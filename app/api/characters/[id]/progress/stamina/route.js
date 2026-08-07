import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "../../../../../../lib/db";
import { verifySessionCookie } from "../../../../../../lib/auth";
import { calculateProgressSpent } from "../../../../../../lib/character-rules";
import { calculateCharacterSheet } from "../../../../../../lib/character-calculations";
import { normalizeCustomAbilities } from "../../../../../../lib/custom-abilities";
import {
  STAMINA_UPGRADE_COST,
  normalizeStaminaUpgradeRolls,
} from "../../../../../../lib/stamina-upgrades";

export const runtime = "nodejs";

async function getIdFromParams(paramsPromise) {
  const resolved = await paramsPromise;
  const rawId = Array.isArray(resolved?.id) ? resolved.id[0] : resolved?.id;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(req, { params }) {
  let connection;

  try {
    const userId = await verifySessionCookie(req);
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = await getIdFromParams(params);
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    connection = await pool.connect();
    await connection.query("BEGIN");

    const existingResult = await connection.query(
      `SELECT * FROM "Character" WHERE id = $1 LIMIT 1 FOR UPDATE`,
      [id]
    );

    if (existingResult.rowCount === 0) {
      await connection.query("ROLLBACK");
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    const character = existingResult.rows[0];
    if (Number(character.ownerId) !== Number(userId)) {
      await connection.query("ROLLBACK");
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const staminaUpgradeRolls = normalizeStaminaUpgradeRolls(
      character.staminaUpgradeRolls
    );
    const totalSpent = calculateProgressSpent({
      spentAttributeUpgrades: character.spentAttributeUpgrades,
      spentSkillUpgrades: character.spentSkillUpgrades,
      boughtAbilities: Array.isArray(character.boughtAbilities)
        ? character.boughtAbilities
        : [],
      customAbilities: normalizeCustomAbilities(character.customAbilities),
      staminaUpgradeRolls,
      specialTrait: character.specialTrait ?? null,
    });
    const progressPoints = Number(character.progressPoints || 0);

    if (progressPoints - totalSpent < STAMINA_UPGRADE_COST) {
      await connection.query("ROLLBACK");
      return NextResponse.json(
        { error: `Você precisa de ${STAMINA_UPGRADE_COST} pontos disponíveis.` },
        { status: 400 }
      );
    }

    const die1 = randomInt(1, 7);
    const die2 = randomInt(1, 7);
    const roll = {
      die1,
      die2,
      total: die1 + die2,
      rolledAt: new Date().toISOString(),
    };
    const nextRolls = [...staminaUpgradeRolls, roll];

    const updateResult = await connection.query(
      `
        UPDATE "Character"
        SET
          "staminaBase" = GREATEST(0, COALESCE("staminaBase", 0)) + $1,
          "staminaCurrent" = GREATEST(0, COALESCE("staminaCurrent", 0)) + $1,
          "staminaUpgradeRolls" = $2,
          "updatedAt" = NOW()
        WHERE id = $3
        RETURNING *
      `,
      [roll.total, JSON.stringify(nextRolls), id]
    );

    await connection.query("COMMIT");

    return NextResponse.json({
      sheet: calculateCharacterSheet(updateResult.rows[0]),
      roll,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } catch {
        // A transação pode já ter sido concluída.
      }
    }

    console.error("STAMINA UPGRADE ERROR:", err);
    return NextResponse.json(
      { error: "Erro ao comprar fôlego", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
