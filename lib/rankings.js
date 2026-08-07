export const RANKING_CATEGORIES = ["scorers", "assists", "bestPlayers"];
export const MAX_RANKING_ENTRIES = 20;

export function emptyRankings() {
  return {
    scorers: [],
    assists: [],
    bestPlayers: [],
  };
}

export function normalizeRankingEntries(
  value,
  { decimalPlaces = 0, maxValue = 999_999 } = {}
) {
  if (!Array.isArray(value)) return [];

  const entries = [];
  const seenCharacters = new Set();

  for (const item of value) {
    const characterId = Math.floor(Number(item?.characterId));
    const rawScore = Number(item?.value);
    const precision = 10 ** decimalPlaces;
    const score = decimalPlaces > 0
      ? Math.round(rawScore * precision) / precision
      : Math.floor(rawScore);

    if (!Number.isInteger(characterId) || characterId <= 0) continue;
    if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > maxValue) continue;
    if (seenCharacters.has(characterId)) continue;

    seenCharacters.add(characterId);
    entries.push({ characterId, value: score });

    if (entries.length >= MAX_RANKING_ENTRIES) break;
  }

  return entries.sort(
    (first, second) =>
      second.value - first.value || first.characterId - second.characterId
  );
}

export function normalizeRankingDraft(value) {
  return {
    scorers: normalizeRankingEntries(value?.scorers),
    assists: normalizeRankingEntries(value?.assists),
    bestPlayers: normalizeRankingEntries(value?.bestPlayers, {
      decimalPlaces: 1,
      maxValue: 10,
    }),
  };
}

function normalizePublishedEntries(
  value,
  { decimalPlaces = 0, maxValue = 999_999 } = {}
) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_RANKING_ENTRIES)
    .flatMap((item) => {
      const characterId = Math.floor(Number(item?.characterId));
      const rawScore = Number(item?.value);
      const precision = 10 ** decimalPlaces;
      const score = decimalPlaces > 0
        ? Math.round(rawScore * precision) / precision
        : Math.floor(rawScore);
      const name = String(item?.name || "").trim().slice(0, 120);

      if (!Number.isInteger(characterId) || characterId <= 0 || !name) return [];
      if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > maxValue) return [];

      return [{
        characterId,
        name,
        class: String(item?.class || "").trim().slice(0, 120),
        value: score,
      }];
    })
    .sort(
      (first, second) =>
        second.value - first.value || first.characterId - second.characterId
    );
}

export function normalizePublishedRankings(value) {
  return {
    scorers: normalizePublishedEntries(value?.scorers),
    assists: normalizePublishedEntries(value?.assists),
    bestPlayers: normalizePublishedEntries(value?.bestPlayers, {
      decimalPlaces: 1,
      maxValue: 10,
    }),
  };
}

export function buildPublishedRankings(draft, characters) {
  const characterById = new Map(
    (Array.isArray(characters) ? characters : []).map((character) => [
      Number(character.id),
      character,
    ])
  );

  return Object.fromEntries(
    RANKING_CATEGORIES.map((category) => [
      category,
      draft[category].flatMap((entry) => {
        const character = characterById.get(entry.characterId);
        if (!character) return [];

        return [{
          characterId: entry.characterId,
          name: String(character.name || "Personagem"),
          class: String(character.class || ""),
          value: entry.value,
        }];
      }),
    ])
  );
}
