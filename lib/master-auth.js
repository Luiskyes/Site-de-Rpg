import { pool } from "./db";
import { verifySessionCookie } from "./auth";

export function getMasterEmails() {
  return String(process.env.MASTER_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isMasterEmail(email) {
  if (!email) return false;
  return getMasterEmails().includes(String(email).trim().toLowerCase());
}

export async function getAuthenticatedUser(req) {
  const userId = await verifySessionCookie(req);

  if (!userId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT id, email, "createdAt"
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const user = result.rows[0];

  return {
    ...user,
    isMaster: isMasterEmail(user.email),
  };
}

export async function requireMaster(req) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return { error: "Não autenticado", status: 401 };
  }

  if (!user.isMaster) {
    return { error: "Acesso negado", status: 403 };
  }

  return { user };
}