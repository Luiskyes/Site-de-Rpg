import {
  EMPTY_ATTRIBUTES,
  EMPTY_SKILLS,
  mergeNumberObjects,
  getPassiveSkillBonusesFromAttributes,
  getHeightModifiers,
  getWeightModifiers,
  getAmbidexterityModifiers,
} from "./character-rules";

export function calculateCharacterSheet(character, options = {}) {
  const isGoalkeeper = options?.isGoalkeeper ?? false;

  const classAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.classAttributes ?? {}),
  };

  const allocatedAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.allocatedAttributes ?? {}),
  };

  const levelUpAttributes = {
    ...EMPTY_ATTRIBUTES,
    ...(character?.levelUpAttributes ?? {}),
  };

  const finalAttributes = mergeNumberObjects(
    classAttributes,
    allocatedAttributes,
    levelUpAttributes
  );

  const classSkills = {
    ...EMPTY_SKILLS,
    ...(character?.classSkills ?? {}),
  };

  const allocatedSkills = {
    ...EMPTY_SKILLS,
    ...(character?.allocatedSkills ?? {}),
  };

  const levelUpSkills = {
    ...EMPTY_SKILLS,
    ...(character?.levelUpSkills ?? {}),
  };

  const passiveFromAttributes =
    getPassiveSkillBonusesFromAttributes(finalAttributes);

  const heightModifiers = getHeightModifiers(
    character?.heightCm,
    isGoalkeeper
  );

  const weightModifiers = getWeightModifiers(
    character?.weightKg,
    isGoalkeeper
  );

  const ambidexterityModifiers = getAmbidexterityModifiers(
    character?.isAmbidextrous
  );

  const finalSkills = mergeNumberObjects(
    classSkills,
    allocatedSkills,
    levelUpSkills,
    passiveFromAttributes,
    heightModifiers,
    weightModifiers,
    ambidexterityModifiers
  );

  return {
    id: character?.id ?? null,
    name: character?.name ?? "",
    class: character?.class ?? "",
    classId: character?.classId ?? null,
    selectedAbility: character?.selectedAbility ?? "",
    specialTrait: character?.specialTrait ?? null,
    isAmbidextrous: Boolean(character?.isAmbidextrous),
    level: character?.level ?? 1,
    notes: character?.notes ?? null,

    age: character?.age ?? null,
    heightCm: character?.heightCm ?? null,
    weightKg: character?.weightKg ?? null,
    staminaBase: character?.staminaBase ?? null,
    staminaCurrent: character?.staminaCurrent ?? null,

    classAttributes,
    allocatedAttributes,
    levelUpAttributes,
    finalAttributes,

    classSkills,
    allocatedSkills,
    levelUpSkills,
    finalSkills,

    modifiers: {
      passiveFromAttributes,
      height: heightModifiers,
      weight: weightModifiers,
      ambidexterity: ambidexterityModifiers,
    },
  };
}