import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { pool } from "../../../../lib/db";
import {
  createSessionToken,
  setSessionCookie,
} from "../../../../lib/auth";

export const runtime = "nodejs";

const googleClient = new OAuth2Client();

function requestHasValidOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}

function googleIsAuthoritativeForEmail(email, payload) {
  return email.endsWith("@gmail.com") || Boolean(payload.hd);
}

export async function POST(req) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "O login com Google ainda não foi configurado." },
      { status: 503 }
    );
  }

  if (!requestHasValidOrigin(req)) {
    return NextResponse.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  }

  let connection;

  try {
    const { credential } = await req.json();
    const idToken = String(credential || "");

    if (!idToken || idToken.length > 12_000) {
      return NextResponse.json({ error: "Credencial do Google inválida." }, { status: 400 });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || "").trim().toLowerCase();
    const googleSub = String(payload?.sub || "").trim();

    if (!payload || !email || !googleSub || payload.email_verified !== true) {
      return NextResponse.json(
        { error: "A conta do Google não possui um e-mail verificado." },
        { status: 401 }
      );
    }

    connection = await pool.connect();
    await connection.query("BEGIN");

    let userResult = await connection.query(
      `SELECT id, email, "googleSub" FROM users WHERE "googleSub" = $1 LIMIT 1 FOR UPDATE`,
      [googleSub]
    );

    if (userResult.rowCount === 0) {
      const emailResult = await connection.query(
        `SELECT id, email, "googleSub" FROM users WHERE email = $1 LIMIT 1 FOR UPDATE`,
        [email]
      );

      if (emailResult.rowCount > 0) {
        const existingUser = emailResult.rows[0];

        if (existingUser.googleSub && existingUser.googleSub !== googleSub) {
          await connection.query("ROLLBACK");
          return NextResponse.json(
            { error: "Este e-mail já está vinculado a outra conta do Google." },
            { status: 409 }
          );
        }

        if (!googleIsAuthoritativeForEmail(email, payload)) {
          await connection.query("ROLLBACK");
          return NextResponse.json(
            {
              error:
                "Por segurança, entre com sua senha antes de vincular este endereço externo ao Google.",
            },
            { status: 409 }
          );
        }

        userResult = await connection.query(
          `
            UPDATE users
            SET "googleSub" = $1, "emailVerifiedAt" = NOW()
            WHERE id = $2
            RETURNING id, email
          `,
          [googleSub, existingUser.id]
        );
      } else {
        userResult = await connection.query(
          `
            INSERT INTO users (email, "passwordHash", "googleSub", "emailVerifiedAt")
            VALUES ($1, NULL, $2, NOW())
            RETURNING id, email
          `,
          [email, googleSub]
        );
      }
    } else {
      userResult = await connection.query(
        `
          UPDATE users
          SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW())
          WHERE id = $1
          RETURNING id, email
        `,
        [userResult.rows[0].id]
      );
    }

    await connection.query("COMMIT");
    const user = userResult.rows[0];
    const sessionToken = await createSessionToken(user.id);
    const response = NextResponse.json({ id: user.id, email: user.email });

    return setSessionCookie(response, sessionToken);
  } catch (error) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A conexão já pode ter encerrado a transação.
      }
    }

    console.error("GOOGLE AUTH ERROR:", error);
    return NextResponse.json(
      { error: "Não foi possível validar o acesso com o Google." },
      { status: 401 }
    );
  } finally {
    connection?.release();
  }
}
