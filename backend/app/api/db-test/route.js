// backend/app/api/db-test/route.js
import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";

export const runtime = "nodejs";

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
