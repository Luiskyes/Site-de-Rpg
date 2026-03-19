// lib/character-calculations.js

function getDefaultBaseAttributes() {
  return {
    potencia: 0,
    tecnica: 0,
    agilidade: 0,
    velocidade: 0,
    ego: 0,
  };
}

function getDefaultBaseSkills() {
  return {
    corpoACorpo: 0,
    cabecio: 0,
    chute: 0,

    pontaria: 0,
    dominio: 0,
    passe: 0,
    drible: 0,
    rouboDeBola: 0,

    acrobacias: 0,
    defesa: 0,
    reflexos: 0,
    furtividade: 0,

    corridaLongaDistancia: 0,
    explosao: 0,
    ritmoDeJogo: 0,

    intuicao: 0,
    intimidacao: 0,
    presenca: 0,
    lideranca: 0,
    enganacao: 0,
  };
}

function getEmptyModifiers() {
  return {
    corpoACorpo: 0,
    cabecio: 0,
    chute: 0,
    pontaria: 0,
    dominio: 0,
    passe: 0,
    drible: 0,
    rouboDeBola: 0,
    acrobacias: 0,
    defesa: 0,
    reflexos: 0,
    furtividade: 0,
    corridaLongaDistancia: 0,
    explosao: 0,
    ritmoDeJogo: 0,
    intuicao: 0,
    intimidacao: 0,
    presenca: 0,
    lideranca: 0,
    enganacao: 0,
  };
}

export function getHeightModifiers(heightCm, isGoalkeeper = false) {
  const mods = getEmptyModifiers();

  if (heightCm >= 150 && heightCm <= 155) {
    mods.drible += 3;
    mods.explosao += 2;
    mods.reflexos += 2;
    mods.cabecio -= 3;
    mods.intimidacao -= 2;
    mods.defesa -= 2;
  } else if (heightCm >= 156 && heightCm <= 160) {
    mods.drible += 2;
    mods.explosao += 2;
    mods.reflexos += 2;
    mods.cabecio -= 3;
    mods.intimidacao -= 2;
    mods.defesa -= 1;
  } else if (heightCm >= 161 && heightCm <= 165) {
    mods.drible += 2;
    mods.explosao += 1;
    mods.reflexos += 2;
    mods.cabecio -= 2;
    mods.intimidacao -= 1;
    mods.defesa -= 1;
  } else if (heightCm >= 166 && heightCm <= 170) {
    mods.drible += 2;
    mods.explosao += 1;
    mods.reflexos += 1;
    mods.cabecio -= 2;
    mods.defesa -= 1;
  } else if (heightCm >= 171 && heightCm <= 175) {
    mods.drible += 1;
    mods.reflexos += 1;
    mods.cabecio -= 1;
  } else if (heightCm >= 176 && heightCm <= 180) {
    // sem bônus
  } else if (heightCm >= 181 && heightCm <= 185) {
    mods.cabecio += 1;
    mods.intimidacao += 1;
    mods.defesa += 1;
    mods.explosao -= 1;
  } else if (heightCm >= 186 && heightCm <= 190) {
    mods.cabecio += 2;
    mods.intimidacao += 1;
    mods.defesa += 2;
    mods.explosao -= 2;
  } else if (heightCm >= 191 && heightCm <= 195) {
    mods.cabecio += 2;
    mods.intimidacao += 2;
    mods.defesa += 2;
    mods.explosao -= 2;
    mods.drible -= 1;
  } else if (heightCm >= 196 && heightCm <= 200) {
    mods.cabecio += 3;
    mods.intimidacao += 2;
    mods.defesa += 3;
    mods.explosao -= 3;
    mods.drible -= 2;
    mods.reflexos -= 1;
  } else if (heightCm >= 201) {
    mods.cabecio += 3;
    mods.intimidacao += 3;
    mods.defesa += 4;
    mods.explosao -= 4;
    mods.drible -= 2;
    mods.reflexos -= 2;
  }

  if (!isGoalkeeper && heightCm >= 186 && mods.defesa > 0) {
    mods.defesa = Math.floor(mods.defesa / 2);
  }

  return mods;
}

export function getWeightModifiers(weightKg, isGoalkeeper = false) {
  const mods = getEmptyModifiers();

  if (weightKg >= 50 && weightKg <= 55) {
    mods.explosao += 3;
    mods.acrobacias += 2;
    mods.furtividade += 2;
    mods.reflexos += 1;
    mods.corpoACorpo -= 3;
    mods.intimidacao -= 2;
    mods.defesa -= 2;
  } else if (weightKg >= 56 && weightKg <= 60) {
    mods.explosao += 2;
    mods.acrobacias += 2;
    mods.furtividade += 1;
    mods.reflexos += 1;
    mods.corpoACorpo -= 3;
    mods.intimidacao -= 2;
    mods.defesa -= 1;
  } else if (weightKg >= 61 && weightKg <= 65) {
    mods.explosao += 2;
    mods.acrobacias += 1;
    mods.furtividade += 1;
    mods.reflexos += 1;
    mods.corpoACorpo -= 2;
    mods.intimidacao -= 1;
  } else if (weightKg >= 66 && weightKg <= 70) {
    mods.explosao += 2;
    mods.acrobacias += 1;
    mods.reflexos += 1;
    mods.corpoACorpo -= 2;
  } else if (weightKg >= 71 && weightKg <= 75) {
    // sem bônus
  } else if (weightKg >= 76 && weightKg <= 80) {
    mods.corpoACorpo += 1;
    mods.chute += 1;
    mods.defesa += 1;
    mods.explosao -= 1;
  } else if (weightKg >= 81 && weightKg <= 85) {
    mods.corpoACorpo += 2;
    mods.chute += 1;
    mods.defesa += 1;
    mods.explosao -= 2;
    mods.reflexos -= 1;
  } else if (weightKg >= 86 && weightKg <= 90) {
    mods.corpoACorpo += 2;
    mods.chute += 2;
    mods.defesa += 2;
    mods.explosao -= 2;
    mods.reflexos -= 1;
  } else if (weightKg >= 91 && weightKg <= 95) {
    mods.corpoACorpo += 3;
    mods.chute += 2;
    mods.defesa += 3;
    mods.explosao -= 3;
    mods.reflexos -= 2;
  } else if (weightKg >= 96) {
    mods.corpoACorpo += 3;
    mods.chute += 3;
    mods.defesa += 4;
    mods.explosao -= 4;
    mods.reflexos -= 2;
    mods.drible -= 1;
  }

  if (!isGoalkeeper && weightKg >= 86 && mods.defesa > 0) {
    mods.defesa = Math.floor(mods.defesa / 2);
  }

  return mods;
}

export function sumModifiers(...modifierObjects) {
  const total = getEmptyModifiers();

  for (const mods of modifierObjects) {
    for (const key of Object.keys(total)) {
      total[key] += mods?.[key] ?? 0;
    }
  }

  return total;
}

export function calculateFinalSkills(baseSkills = {}, heightMods = {}, weightMods = {}) {
  const defaults = getDefaultBaseSkills();
  const mergedBase = { ...defaults, ...baseSkills };
  const totalMods = sumModifiers(heightMods, weightMods);

  const finalSkills = {};

  for (const key of Object.keys(defaults)) {
    finalSkills[key] = (mergedBase[key] ?? 0) + (totalMods[key] ?? 0);
  }

  return finalSkills;
}

export function calculateCharacterSheet(character, options = {}) {
  const isGoalkeeper = options.isGoalkeeper ?? false;

  const baseAttributes = {
    ...getDefaultBaseAttributes(),
    ...(character.baseAttributes ?? {}),
  };

  const baseSkills = {
    ...getDefaultBaseSkills(),
    ...(character.baseSkills ?? {}),
  };

  const heightMods = getHeightModifiers(character.heightCm ?? 0, isGoalkeeper);
  const weightMods = getWeightModifiers(character.weightKg ?? 0, isGoalkeeper);
  const finalSkills = calculateFinalSkills(baseSkills, heightMods, weightMods);

  return {
    baseAttributes,
    baseSkills,
    modifiers: {
      height: heightMods,
      weight: weightMods,
    },
    finalSkills,
  };
}