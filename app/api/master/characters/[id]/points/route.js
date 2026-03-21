import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/db";
import { requireMaster } from "../../../../../../lib/master-auth";

export const runtime = "nodejs";

async function getIdFromParams(paramsPromise) {
  const resolved = await paramsPromise;
  const rawId = Array.isArray(resolved?.id) ? resolved.id[0] : resolved?.id;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(req, { params }) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const id = await getIdFromParams(params);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Quantidade inválida." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE "Character"
      SET
        "progressPoints" = GREATEST(0, COALESCE("progressPoints", 0) + $1),
        "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, name, "progressPoints"
      `,
      [amount, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Ficha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (err) {
    console.error("MASTER ADD POINTS ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao alterar pontos",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}