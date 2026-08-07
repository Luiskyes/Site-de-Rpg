import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { verifySessionCookie } from "../../../lib/auth";
import { isMasterEmail } from "../../../lib/master-auth";
import { emptyRankings, normalizePublishedRankings } from "../../../lib/rankings";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const userId = await verifySessionCookie(req);

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [result, rankingResult] = await Promise.all([
      pool.query(
        `
        SELECT
          u.id AS "userId",
          u.email,
          u."createdAt",
          c.id AS "characterId",
          c.name AS "characterName",
          c.class AS "characterClass",
          c.level AS "characterLevel",
          campaign."characterCount",
          campaign."playerCount"
        FROM users u
        LEFT JOIN LATERAL (
          SELECT id, name, class, level
          FROM "Character"
          WHERE "ownerId" = u.id
          ORDER BY id ASC
          LIMIT 1
        ) c ON true
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS "characterCount",
            COUNT(DISTINCT "ownerId")::int AS "playerCount"
          FROM "Character"
        ) campaign ON true
        WHERE u.id = $1
        LIMIT 1
        `,
        [userId]
      ),
      pool.query(`
        SELECT
          "isPublished",
          "scorersPublished",
          "assistsPublished",
          "bestPlayersPublished",
          "publishedAt"
        FROM "RankingBoard"
        WHERE id = 1
        LIMIT 1
      `),
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
    }

    const row = result.rows[0];
    const isMaster = isMasterEmail(row.email);
    const rankingRow = rankingResult.rows[0] ?? null;
    const rankingIsPublished = Boolean(rankingRow?.isPublished);
    const publishedRankings = rankingIsPublished
      ? normalizePublishedRankings({
          scorers: rankingRow.scorersPublished,
          assists: rankingRow.assistsPublished,
          bestPlayers: rankingRow.bestPlayersPublished,
        })
      : emptyRankings();

    return NextResponse.json({
      user: {
        id: row.userId,
        email: row.email,
        createdAt: row.createdAt,
        isMaster,
      },
      character: row.characterId
        ? {
            id: row.characterId,
            name: row.characterName,
            class: row.characterClass,
            level: row.characterLevel,
            ownerId: row.userId,
          }
        : null,
      campaign: isMaster
        ? {
            characterCount: Number(row.characterCount || 0),
            playerCount: Number(row.playerCount || 0),
          }
        : null,
      ranking: {
        isPublished: rankingIsPublished,
        categories: publishedRankings,
        publishedAt: rankingIsPublished ? rankingRow?.publishedAt ?? null : null,
      },
    });
  } catch (err) {
    console.error("DASHBOARD LOAD ERROR:", err);
    return NextResponse.json(
      { error: "Erro ao carregar o painel", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
