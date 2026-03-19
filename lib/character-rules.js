export const CLASS_OPTIONS = [
  "PlayMaker",
  "Dominador Superior",
  "Especialista Espacial",
  "Driblador",
  "Caçador de Gols",
  "Atacante Completo",
  "Finalizador Clínico",
  "Velocista",
  "Atacante Controlador",
  "Multi-Funções",
  "Defensor Espacial",
  "Atacante Saltador",
  "Vilão do Campo",
  "Louco da Estamina",
  "Goleiro",
  "Ninja",
  "Imperador",
  "Devorador de Ás",
  "Duelista",
  "Cachorro Louco",
];

export const ATTRIBUTE_LIMITS = {
  totalPoints: 7,
  maxPerAttribute: 5,
};

export const SKILL_LIMITS = {
  totalPoints: 15,
  maxPerSkill: 10,
};

export const ATTRIBUTE_TO_SKILLS = {
  potencia: ["corpoACorpo", "cabecio", "chute"],
  tecnica: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"],
  agilidade: ["acrobacias", "defesa", "reflexos", "furtividade"],
  velocidade: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"],
  ego: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"],
};

export function sumValues(obj) {
  return Object.values(obj).reduce((acc, value) => acc + Number(value || 0), 0);
}

export function getAttributePassiveBonuses(baseAttributes) {
  const bonuses = {};

  for (const [attributeKey, skills] of Object.entries(ATTRIBUTE_TO_SKILLS)) {
    const attributeValue = Number(baseAttributes?.[attributeKey] || 0);
    const bonus = Math.floor(attributeValue / 2);

    for (const skill of skills) {
      bonuses[skill] = bonus;
    }
  }

  return bonuses;
}

export function getFinalSkillsFromCreation(baseAttributes, baseSkills) {
  const passiveBonuses = getAttributePassiveBonuses(baseAttributes);
  const finalSkills = {};

  for (const key of Object.keys(baseSkills)) {
    finalSkills[key] = Number(baseSkills[key] || 0) + Number(passiveBonuses[key] || 0);
  }

  return {
    passiveBonuses,
    finalSkills,
  };
}