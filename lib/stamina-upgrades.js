export const STAMINA_UPGRADE_COST = 5;

function normalizeDie(value) {
  const die = Math.floor(Number(value));
  return Number.isInteger(die) && die >= 1 && die <= 6 ? die : null;
}

export function normalizeStaminaUpgradeRolls(value) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const die1 = normalizeDie(item.die1);
    const die2 = normalizeDie(item.die2);
    if (!die1 || !die2) return [];

    const rolledAt = String(item.rolledAt || "").trim();

    return [{
      die1,
      die2,
      total: die1 + die2,
      rolledAt: rolledAt || null,
    }];
  });
}
