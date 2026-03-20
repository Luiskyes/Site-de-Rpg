export const EMPTY_ATTRIBUTES = {
  potencia: 0,
  tecnica: 0,
  agilidade: 0,
  velocidade: 0,
  ego: 0,
};

export const EMPTY_SKILLS = {
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

export const ATTRIBUTE_TO_SKILLS = {
  potencia: ["corpoACorpo", "cabecio", "chute"],
  tecnica: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"],
  agilidade: ["acrobacias", "defesa", "reflexos", "furtividade"],
  velocidade: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"],
  ego: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"],
};

export function mergeNumberObjects(...objects) {
  const result = {};

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj || {})) {
      result[key] = Number(result[key] || 0) + Number(value || 0);
    }
  }

  return result;
}

export function getPassiveSkillBonusesFromAttributes(finalAttributes) {
  const bonuses = { ...EMPTY_SKILLS };

  for (const [attributeKey, skills] of Object.entries(ATTRIBUTE_TO_SKILLS)) {
    const attributeValue = Number(finalAttributes?.[attributeKey] || 0);
    const passiveBonus = Math.floor(attributeValue / 2);

    for (const skill of skills) {
      bonuses[skill] = passiveBonus;
    }
  }

  return bonuses;
}

export function getHeightModifiers(heightCm, isGoalkeeper = false) {
  const h = Number(heightCm);

  if (!Number.isFinite(h) || h <= 0) {
    return { ...EMPTY_SKILLS };
  }

  const mod = { ...EMPTY_SKILLS };

  if (h >= 150 && h <= 155) {
    mod.drible += 3;
    mod.explosao += 2;
    mod.reflexos += 2;
    mod.cabecio -= 3;
    mod.intimidacao -= 2;
    mod.defesa -= 2;
  } else if (h >= 156 && h <= 160) {
    mod.drible += 2;
    mod.explosao += 2;
    mod.reflexos += 2;
    mod.cabecio -= 3;
    mod.intimidacao -= 2;
    mod.defesa -= 1;
  } else if (h >= 161 && h <= 165) {
    mod.drible += 2;
    mod.explosao += 1;
    mod.reflexos += 2;
    mod.cabecio -= 2;
    mod.intimidacao -= 1;
    mod.defesa -= 1;
  } else if (h >= 166 && h <= 170) {
    mod.drible += 2;
    mod.explosao += 1;
    mod.reflexos += 1;
    mod.cabecio -= 2;
    mod.defesa -= 1;
  } else if (h >= 171 && h <= 175) {
    mod.drible += 1;
    mod.reflexos += 1;
    mod.cabecio -= 1;
  } else if (h >= 176 && h <= 180) {
    // neutro
  } else if (h >= 181 && h <= 185) {
    mod.cabecio += 1;
    mod.intimidacao += 1;
    mod.defesa += 1;
    mod.explosao -= 1;
  } else if (h >= 186 && h <= 190) {
    mod.cabecio += 2;
    mod.intimidacao += 1;
    mod.defesa += isGoalkeeper ? 2 : Math.floor(2 / 2);
    mod.explosao -= 2;
  } else if (h >= 191 && h <= 195) {
    mod.cabecio += 2;
    mod.intimidacao += 2;
    mod.defesa += isGoalkeeper ? 2 : Math.floor(2 / 2);
    mod.explosao -= 2;
    mod.drible -= 1;
  } else if (h >= 196 && h <= 200) {
    mod.cabecio += 3;
    mod.intimidacao += 2;
    mod.defesa += isGoalkeeper ? 3 : Math.floor(3 / 2);
    mod.explosao -= 3;
    mod.drible -= 2;
    mod.reflexos -= 1;
  } else if (h >= 201) {
    mod.cabecio += 3;
    mod.intimidacao += 3;
    mod.defesa += isGoalkeeper ? 4 : Math.floor(4 / 2);
    mod.explosao -= 4;
    mod.drible -= 2;
    mod.reflexos -= 2;
  }

  return mod;
}

export function getWeightModifiers(weightKg, isGoalkeeper = false) {
  const w = Number(weightKg);

  if (!Number.isFinite(w) || w <= 0) {
    return { ...EMPTY_SKILLS };
  }

  const mod = { ...EMPTY_SKILLS };

  if (w >= 50 && w <= 55) {
    mod.explosao += 3;
    mod.acrobacias += 2;
    mod.furtividade += 2;
    mod.reflexos += 1;
    mod.corpoACorpo -= 3;
    mod.intimidacao -= 2;
    mod.defesa -= 2;
  } else if (w >= 56 && w <= 60) {
    mod.explosao += 2;
    mod.acrobacias += 2;
    mod.furtividade += 1;
    mod.reflexos += 1;
    mod.corpoACorpo -= 3;
    mod.intimidacao -= 2;
    mod.defesa -= 1;
  } else if (w >= 61 && w <= 65) {
    mod.explosao += 2;
    mod.acrobacias += 1;
    mod.furtividade += 1;
    mod.reflexos += 1;
    mod.corpoACorpo -= 2;
    mod.intimidacao -= 1;
  } else if (w >= 66 && w <= 70) {
    mod.explosao += 2;
    mod.acrobacias += 1;
    mod.reflexos += 1;
    mod.corpoACorpo -= 2;
  } else if (w >= 71 && w <= 75) {
    // neutro
  } else if (w >= 76 && w <= 80) {
    mod.corpoACorpo += 1;
    mod.chute += 1;
    mod.defesa += 1;
    mod.explosao -= 1;
  } else if (w >= 81 && w <= 85) {
    mod.corpoACorpo += 2;
    mod.chute += 1;
    mod.defesa += 1;
    mod.explosao -= 2;
    mod.reflexos -= 1;
  } else if (w >= 86 && w <= 90) {
    mod.corpoACorpo += 2;
    mod.chute += 2;
    mod.defesa += isGoalkeeper ? 2 : Math.floor(2 / 2);
    mod.explosao -= 2;
    mod.reflexos -= 1;
  } else if (w >= 91 && w <= 95) {
    mod.corpoACorpo += 3;
    mod.chute += 2;
    mod.defesa += isGoalkeeper ? 3 : Math.floor(3 / 2);
    mod.explosao -= 3;
    mod.reflexos -= 2;
  } else if (w >= 96) {
    mod.corpoACorpo += 3;
    mod.chute += 3;
    mod.defesa += isGoalkeeper ? 4 : Math.floor(4 / 2);
    mod.explosao -= 4;
    mod.reflexos -= 2;
    mod.drible -= 1;
  }

  return mod;
}

export function getAmbidexterityModifiers(isAmbidextrous) {
  const mod = { ...EMPTY_SKILLS };

  if (!isAmbidextrous) {
    return mod;
  }

  mod.chute += 6;
  mod.pontaria += 6;
  mod.passe += 6;
  mod.drible += 6;
  mod.dominio += 6;

  return mod;
}