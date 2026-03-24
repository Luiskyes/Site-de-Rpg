import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { CLASS_BOOK } from "../../../lib/class-book";

export const runtime = "nodejs";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hasAnyKeys(obj) {
  return !!obj && typeof obj === "object" && Object.keys(obj).length > 0;
}

function normalizeAbilities(value) {
  const raw = Array.isArray(value) ? value : [];
  const seen = new Set();

  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return String(item.name || "").trim();
      return "";
    })
    .filter(Boolean)
    .filter((name) => {
      const key = normalizeText(name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((name) => ({ name }));
}

function getFallbackClassData(className) {
  const normalizedName = normalizeText(className);

  const matchedKey = Object.keys(CLASS_BOOK).find(
    (key) => normalizeText(key) === normalizedName
  );

  return matchedKey ? CLASS_BOOK[matchedKey] : null;
}

function scoreRow(row) {
  let score = 0;

  if (hasAnyKeys(row.attributeBonuses)) score += 3;
  if (hasAnyKeys(row.skillBonuses)) score += 3;
  if (Array.isArray(row.abilities) && row.abilities.length > 0) score += 3;

  const name = String(row.name || "");
  const looksBroken = /[Ã�þÒÛ┴§Æµ]/.test(name);
  if (!looksBroken) score += 2;

  return score;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.description,
        c."attributeBonuses",
        c."skillBonuses",
        c.abilities,
        CASE
          WHEN ch.id IS NOT NULL THEN true
          ELSE false
        END AS "isTaken"
      FROM "Class" c
      LEFT JOIN "Character" ch ON ch."classId" = c.id
      ORDER BY c.id ASC
    `);

    const grouped = new Map();

    for (const row of result.rows) {
      const key = normalizeText(row.name);

      if (!grouped.has(key)) {
        grouped.set(key, row);
        continue;
      }

      const current = grouped.get(key);
      if (scoreRow(row) > scoreRow(current)) {
        grouped.set(key, row);
      }
    }

    const rows = Array.from(grouped.values()).map((row) => {
      const fallback = getFallbackClassData(row.name);

      const attributeBonuses = hasAnyKeys(row.attributeBonuses)
        ? row.attributeBonuses
        : fallback?.attributes || {};

      const skillBonuses = hasAnyKeys(row.skillBonuses)
        ? row.skillBonuses
        : fallback?.skills || {};

      const abilities =
        Array.isArray(row.abilities) && row.abilities.length > 0
          ? normalizeAbilities(row.abilities)
          : normalizeAbilities(fallback?.abilities || []);

      return {
        ...row,
        name: fallback
          ? Object.keys(CLASS_BOOK).find(
              (key) => normalizeText(key) === normalizeText(row.name)
            ) || row.name
          : row.name,
        attributeBonuses,
        skillBonuses,
        abilities,
        attributesMode: fallback?.attributesMode || "fixed",
        attributePool: Number(fallback?.attributePool || 0),
        attributeMaxPerStat: Number(fallback?.attributeMaxPerStat || 0),
        skillsMode: fallback?.skillsMode || "fixed",
        skillPickCount: Number(fallback?.skillPickCount || 0),
        skillPickBonus: Number(fallback?.skillPickBonus || 0),
      };
    });

    rows.sort((a, b) => a.id - b.id);

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET CLASSES ERROR:", err);

    return NextResponse.json(
      {
        error: "Erro ao buscar classes",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}