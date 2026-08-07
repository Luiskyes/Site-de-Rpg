import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { sendPasswordResetEmail } from "../../../../lib/password-reset-email";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação.";
const TOKEN_LIFETIME_MINUTES = 30;
const MIN_REQUEST_INTERVAL_SECONDS = 60;

export async function POST(req) {
  let connection;

  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || email.length > 320) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    connection = await pool.connect();
    await connection.query("BEGIN");

    const userResult = await connection.query(
      `SELECT id, email FROM users WHERE email = $1 LIMIT 1 FOR UPDATE`,
      [email]
    );

    if (userResult.rowCount === 0) {
      await connection.query("COMMIT");
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const user = userResult.rows[0];
    const recentResult = await connection.query(
      `
        SELECT id
        FROM "PasswordResetToken"
        WHERE "userId" = $1
          AND "usedAt" IS NULL
          AND "createdAt" > NOW() - ($2 * INTERVAL '1 second')
        LIMIT 1
      `,
      [user.id, MIN_REQUEST_INTERVAL_SECONDS]
    );

    if (recentResult.rowCount > 0) {
      await connection.query("COMMIT");
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await connection.query(
      `DELETE FROM "PasswordResetToken" WHERE "userId" = $1 AND "usedAt" IS NULL`,
      [user.id]
    );
    const tokenResult = await connection.query(
      `
        INSERT INTO "PasswordResetToken" ("userId", "tokenHash", "expiresAt")
        VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'))
        RETURNING id
      `,
      [user.id, tokenHash, TOKEN_LIFETIME_MINUTES]
    );

    await connection.query("COMMIT");

    const appUrl = process.env.APP_URL || new URL(req.url).origin;
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    let delivered = false;

    try {
      const delivery = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        requestId: `${tokenResult.rows[0].id}-${randomUUID()}`,
      });
      delivered = delivery.delivered;
    } catch (error) {
      console.error("PASSWORD RESET EMAIL ERROR:", error);
    }

    const payload = { message: GENERIC_MESSAGE };
    if (process.env.NODE_ENV !== "production" && !delivered) {
      payload.developmentResetUrl = resetUrl;
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A conexão já pode ter encerrado a transação.
      }
    }

    console.error("PASSWORD FORGOT ERROR:", error);
    return NextResponse.json(
      { error: "Não foi possível processar a recuperação agora." },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
