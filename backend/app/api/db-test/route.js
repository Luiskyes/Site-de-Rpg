import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // se @ não funcionar, veja a seção 3

export async function GET() {
  try {
    const r = await pool.query("SELECT current_database() AS db");
    return NextResponse.json({ db: r.rows[0].db });
  } catch (e) {
    console.error("DB-TEST error:", e);
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
