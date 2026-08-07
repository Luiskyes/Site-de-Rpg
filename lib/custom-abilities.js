export const MAX_CUSTOM_ABILITY_NAME_LENGTH = 80;
export const MAX_CUSTOM_ABILITY_DESCRIPTION_LENGTH = 600;

export function normalizeCustomAbility(value) {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name, description: "" } : null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const name = String(value.name || "").trim();
  if (!name) return null;

  return {
    name,
    description: String(value.description || "").trim(),
  };
}

export function customAbilityKey(value) {
  const ability = normalizeCustomAbility(value);
  return ability ? ability.name.toLocaleLowerCase("pt-BR") : "";
}

export function normalizeCustomAbilities(value) {
  if (!Array.isArray(value)) return [];

  const unique = [];
  const seen = new Set();

  for (const item of value) {
    const ability = normalizeCustomAbility(item);
    if (!ability) continue;

    const key = customAbilityKey(ability);
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(ability);
  }

  return unique;
}
