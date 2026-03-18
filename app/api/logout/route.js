// backend/app/api/logout/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Apaga o cookie “session”
  const response = NextResponse.json({ message: "Deslogado" });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,               // expira imediatamente
    expires: new Date(0),      // data no passado
    path: "/",
  });
  return response;
}
