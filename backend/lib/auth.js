// backend/lib/auth.js
import { SignJWT, jwtVerify } from "jose";

/**
 * Cria um token JWT (compact JWS) contendo o `userId`.
 * @param {number} userId
 * @returns {Promise<string>} token assinado
 */
export async function createSessionToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não definido no .env");

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // 7 dias
    .sign(new TextEncoder().encode(secret));

  return token;
}

/**
 * Verifica o cookie “session”. Se válido, devolve o `userId` (number); caso contrário, null.
 * @param {import("next/server").NextRequest} req
 * @returns {Promise<number|null>}
 */
export async function verifySessionCookie(req) {
  const token = req.cookies.get("session")?.value ?? null;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.userId ?? null;
  } catch {
    // token expirado, corrompido ou assinatura inválida
    return null;
  }
}
