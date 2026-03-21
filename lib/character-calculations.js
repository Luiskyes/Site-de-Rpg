import {
  EMPTY_ATTRIBUTES,
  EMPTY_SKILLS,
  mergeNumberObjects,
  getPassiveSkillBonusesFromAttributes,
  getHeightModifiers,
  getWeightModifiers,
  getAmbidexterityModifiers,
  normalizeHeightCm,
  normalizeWeightKg,
  calculateProgressSpent,
  getExistingAbilityCost,
  getCustomAbilityCost,
} from "./character-rules";

function halveNumberObject(obj) {
  const result = {};

  for (const [key, value] of Object.entries(obj || {})) {
    result[key] = Math.floor(Number(value || 0) / 2);
  }

  return result;
}

export function calculateCharacterSheet(character, options = {}) {
  const isGoalkeeper = options?.isGoalkeeper ?? false;

  const normalizedHeightCm = normalizeHeightCm(character?.heightCm);
  const normalizedWeightKg = normalizeWeightKg(character?.weightKg);

  const classAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.classAttributes ?? {}),
  };

  const allocatedAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.allocatedAttributes ?? {}),
  };

  const progressionAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.levelUpAttributes ?? {}),
  };

  const rawFinalAttributes = mergeNumberObjects(
    classAttributes,
    allocatedAttributes,
    progressionAttributes
  );

  const classSkills = {
    ...EMPTY_SKILLS,
    ...(character?.classSkills ?? {}),
  };

  const allocatedSkills = {
    ...EMPTY_SKILLS,
    ...(character?.allocatedSkills ?? {}),
  };

  const progressionSkills = {
    ...EMPTY_SKILLS,
    ...(character?.levelUpSkills ?? {}),
  };

  const passiveFromAttributes = getPassiveSkillBonusesFromAttributes(rawFinalAttributes);
  const heightModifiers = getHeightModifiers(normalizedHeightCm, isGoalkeeper);
  const weightModifiers = getWeightModifiers(normalizedWeightKg, isGoalkeeper);
  const ambidexterityModifiers = getAmbidexterityModifiers(character?.isAmbidextrous);

  const rawFinalSkills = mergeNumberObjects(
    classSkills,
    allocatedSkills,
    progressionSkills,
    passiveFromAttributes,
    heightModifiers,
    weightModifiers,
    ambidexterityModifiers
  );

  const staminaBase = character?.staminaBase ?? null;
  const staminaCurrent = character?.staminaCurrent ?? null;

  const isExhaustedPenaltyActive =
    Number.isFinite(Number(staminaCurrent)) && Number(staminaCurrent) <= 10;

  const finalAttributes = isExhaustedPenaltyActive
    ? halveNumberObject(rawFinalAttributes)
    : rawFinalAttributes;

  const finalSkills = isExhaustedPenaltyActive
    ? halveNumberObject(rawFinalSkills)
    : rawFinalSkills;

  const progressPoints = Number(character?.progressPoints || 0);
  const spentAttributeUpgrades = Number(character?.spentAttributeUpgrades || 0);
  const spentSkillUpgrades = Number(character?.spentSkillUpgrades || 0);
  const boughtAbilities = Array.isArray(character?.boughtAbilities)
    ? character.boughtAbilities
    : [];
  const customAbilities = Array.isArray(character?.customAbilities)
    ? character.customAbilities
    : [];

  const totalProgressSpent = calculateProgressSpent({
    spentAttributeUpgrades,
    spentSkillUpgrades,
    boughtAbilities,
    customAbilities,
    specialTrait: character?.specialTrait ?? null,
  });

  return {
    id: character?.id ?? null,
    name: character?.name ?? "",
    class: character?.class ?? "",
    classId: character?.classId ?? null,
    selectedAbility: character?.selectedAbility ?? "",
    specialTrait: character?.specialTrait ?? null,
    isAmbidextrous: Boolean(character?.isAmbidextrous),
    notes: character?.notes ?? null,
    age: character?.age ?? null,
    heightCm: normalizedHeightCm,
    weightKg: normalizedWeightKg,
    staminaBase,
    staminaCurrent,

    fatigue: {
      isExhaustedPenaltyActive,
      threshold: 10,
      message: isExhaustedPenaltyActive
        ? "Fôlego em 10 ou menos: atributos e perícias estão reduzidos pela metade."
        : null,
    },

    progress: {
      progressPoints,
      spentAttributeUpgrades,
      spentSkillUpgrades,
      boughtAbilities,
      customAbilities,
      existingAbilityCost: getExistingAbilityCost(character?.specialTrait ?? null),
      customAbilityCost: getCustomAbilityCost(character?.specialTrait ?? null),
      totalProgressSpent,
      progressPointsRemaining: Math.max(0, progressPoints - totalProgressSpent),
    },

    classAttributes,
    allocatedAttributes,
    levelUpAttributes: progressionAttributes,
    rawFinalAttributes,
    finalAttributes,

    classSkills,
    allocatedSkills,
    levelUpSkills: progressionSkills,
    rawFinalSkills,
    finalSkills,

    modifiers: {
      passiveFromAttributes,
      height: heightModifiers,
      weight: weightModifiers,
      ambidexterity: ambidexterityModifiers,
    },
  };
}