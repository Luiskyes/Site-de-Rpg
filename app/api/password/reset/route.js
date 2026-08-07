import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { validatePassword } from "../../../../lib/password-policy";

export const runtime = "nodejs";

export async function POST(req) {
  let connection;

  try {
    const body = await req.json();
    const token = String(body?.token || "");
    const password = String(body?.password || "");
    const passwordError = validatePassword(password);

    if (!token || token.length > 200) {
      return NextResponse.json(
        { error: "O link de recuperação é inválido." },
        { status: 400 }
      );
    }

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    connection = await pool.connect();
    await connection.query("BEGIN");

    const tokenResult = await connection.query(
      `
        SELECT id, "userId"
        FROM "PasswordResetToken"
        WHERE "tokenHash" = $1
          AND "usedAt" IS NULL
          AND "expiresAt" > NOW()
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash]
    );

    if (tokenResult.rowCount === 0) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: "Este link é inválido, expirou ou já foi utilizado." },
        { status: 400 }
      );
    }

    const resetToken = tokenResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await connection.query(
      `UPDATE users SET "passwordHash" = $1 WHERE id = $2`,
      [passwordHash, resetToken.userId]
    );
    await connection.query(
      `UPDATE "PasswordResetToken" SET "usedAt" = NOW() WHERE id = $1`,
      [resetToken.id]
    );
    await connection.query(
      `
        DELETE FROM "PasswordResetToken"
        WHERE "userId" = $1 AND id <> $2 AND "usedAt" IS NULL
      `,
      [resetToken.userId, resetToken.id]
    );

    await connection.query("COMMIT");
    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A conexão já pode ter encerrado a transação.
      }
    }

    console.error("PASSWORD RESET ERROR:", error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha agora." },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
