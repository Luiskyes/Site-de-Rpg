import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { requireMaster } from "../../../../lib/master-auth";
import {
  RANKING_CATEGORIES,
  buildPublishedRankings,
  normalizeRankingDraft,
} from "../../../../lib/rankings";

export const runtime = "nodejs";

async function ensureBoard(connection) {
  await connection.query(
    `INSERT INTO "RankingBoard" (id) VALUES (1) ON CONFLICT (id) DO NOTHING`
  );
}

function boardResponse(row) {
  return {
    isPublished: Boolean(row?.isPublished),
    draft: normalizeRankingDraft({
      scorers: row?.scorersDraft,
      assists: row?.assistsDraft,
      bestPlayers: row?.bestPlayersDraft,
    }),
    publishedAt: row?.publishedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
  };
}

async function validateDraftCharacters(connection, draft) {
  const ids = [
    ...new Set(
      RANKING_CATEGORIES.flatMap((category) =>
        draft[category].map((entry) => entry.characterId)
      )
    ),
  ];

  if (ids.length === 0) return [];

  const result = await connection.query(
    `SELECT id, name, class FROM "Character" WHERE id = ANY($1::int[])`,
    [ids]
  );

  if (result.rowCount !== ids.length) {
    return null;
  }

  return result.rows;
}

export async function PATCH(req) {
  let connection;

  try {
    const auth = await requireMaster(req);
    if (auth?.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const draft = normalizeRankingDraft(body?.rankings);

    connection = await pool.connect();
    await connection.query("BEGIN");
    await ensureBoard(connection);

    const boardResult = await connection.query(
      `SELECT * FROM "RankingBoard" WHERE id = 1 FOR UPDATE`
    );
    const board = boardResult.rows[0];

    if (board.isPublished) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: "Prive o ranking antes de editar o rascunho." },
        { status: 409 }
      );
    }

    const characters = await validateDraftCharacters(connection, draft);
    if (!characters) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: "O ranking contém uma ficha que não existe mais." },
        { status: 400 }
      );
    }

    const updateResult = await connection.query(
      `
        UPDATE "RankingBoard"
        SET
          "scorersDraft" = $1,
          "assistsDraft" = $2,
          "bestPlayersDraft" = $3,
          "updatedAt" = NOW()
        WHERE id = 1
        RETURNING *
      `,
      [
        JSON.stringify(draft.scorers),
        JSON.stringify(draft.assists),
        JSON.stringify(draft.bestPlayers),
      ]
    );

    await connection.query("COMMIT");
    return NextResponse.json(boardResponse(updateResult.rows[0]));
  } catch (err) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A transação pode já ter sido concluída.
      }
    }

    console.error("MASTER RANKING SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Erro ao salvar o ranking", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

export async function POST(req) {
  let connection;

  try {
    const auth = await requireMaster(req);
    if (auth?.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const action = String(body?.action || "");

    if (!new Set(["publish", "privatize"]).has(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    connection = await pool.connect();
    await connection.query("BEGIN");
    await ensureBoard(connection);

    const boardResult = await connection.query(
      `SELECT * FROM "RankingBoard" WHERE id = 1 FOR UPDATE`
    );
    const board = boardResult.rows[0];

    if (action === "privatize") {
      const privateResult = await connection.query(
        `
          UPDATE "RankingBoard"
          SET "isPublished" = false, "updatedAt" = NOW()
          WHERE id = 1
          RETURNING *
        `
      );

      await connection.query("COMMIT");
      return NextResponse.json(boardResponse(privateResult.rows[0]));
    }

    const draft = normalizeRankingDraft(body?.rankings || {
      scorers: board.scorersDraft,
      assists: board.assistsDraft,
      bestPlayers: board.bestPlayersDraft,
    });
    const entryCount = RANKING_CATEGORIES.reduce(
      (total, category) => total + draft[category].length,
      0
    );

    if (entryCount === 0) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: "Adicione ao menos um jogador antes de desprivar o ranking." },
        { status: 400 }
      );
    }

    const characters = await validateDraftCharacters(connection, draft);
    if (!characters) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: "O ranking contém uma ficha que não existe mais." },
        { status: 400 }
      );
    }

    const published = buildPublishedRankings(draft, characters);
    const publishResult = await connection.query(
      `
        UPDATE "RankingBoard"
        SET
          "isPublished" = true,
          "scorersDraft" = $1,
          "assistsDraft" = $2,
          "bestPlayersDraft" = $3,
          "scorersPublished" = $4,
          "assistsPublished" = $5,
          "bestPlayersPublished" = $6,
          "publishedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE id = 1
        RETURNING *
      `,
      [
        JSON.stringify(draft.scorers),
        JSON.stringify(draft.assists),
        JSON.stringify(draft.bestPlayers),
        JSON.stringify(published.scorers),
        JSON.stringify(published.assists),
        JSON.stringify(published.bestPlayers),
      ]
    );

    await connection.query("COMMIT");
    return NextResponse.json(boardResponse(publishResult.rows[0]));
  } catch (err) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A transação pode já ter sido concluída.
      }
    }

    console.error("MASTER RANKING PUBLISH ERROR:", err);
    return NextResponse.json(
      { error: "Erro ao alterar a privacidade do ranking", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
