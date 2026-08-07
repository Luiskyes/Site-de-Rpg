import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { requireMaster } from "../../../../lib/master-auth";
import { emptyRankings, normalizeRankingDraft } from "../../../../lib/rankings";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const auth = await requireMaster(req);

    if (auth?.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [configResult, charactersResult, rankingResult] = await Promise.all([
      pool.query(`
        SELECT
          id,
          "attributePointsAtCreation",
          "skillPointsAtCreation",
          "attributeMaxAtCreation",
          "skillMaxAtCreation",
          "levelUpAttributePoints",
          "levelUpSkillPoints"
        FROM "GameConfig"
        ORDER BY id ASC
        LIMIT 1
      `),
      pool.query(`
        SELECT
          c.id,
          c.name,
          c.class,
          c.level,
          c."staminaBase",
          c."staminaCurrent",
          c."ownerId",
          u.email AS "ownerEmail"
        FROM "Character" c
        INNER JOIN users u ON u.id = c."ownerId"
        ORDER BY c.id DESC
      `),
      pool.query(`
        SELECT *
        FROM "RankingBoard"
        WHERE id = 1
        LIMIT 1
      `),
    ]);

    const rankingRow = rankingResult.rows[0] ?? null;

    return NextResponse.json({
      user: auth.user,
      config: configResult.rows[0] ?? null,
      characters: charactersResult.rows ?? [],
      ranking: rankingRow
        ? {
            isPublished: Boolean(rankingRow.isPublished),
            draft: normalizeRankingDraft({
              scorers: rankingRow.scorersDraft,
              assists: rankingRow.assistsDraft,
              bestPlayers: rankingRow.bestPlayersDraft,
            }),
            publishedAt: rankingRow.publishedAt ?? null,
            updatedAt: rankingRow.updatedAt ?? null,
          }
        : {
            isPublished: false,
            draft: emptyRankings(),
            publishedAt: null,
            updatedAt: null,
          },
    });
  } catch (err) {
    console.error("MASTER DASHBOARD LOAD ERROR:", err);
    return NextResponse.json(
      {
        error: "Erro ao carregar painel do mestre",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
