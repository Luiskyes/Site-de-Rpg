import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../lib/master-auth";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error("AUTH ME ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar usuário autenticado",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}