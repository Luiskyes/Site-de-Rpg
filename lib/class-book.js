// lib/class-book.js

export const CLASS_BOOK = {
  Playmaker: {
    attributes: {
      potencia: 0,
      tecnica: 3,
      agilidade: 2,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      passe: 5,
      drible: 5,
      pontaria: 5,
      rouboDeBola: 5,
      intuicao: 5,
      intimidacao: 5,
    },
    abilities: [
      "Percepção Espacial – Armador",
      "Sincronização",
      "Chute Preciso",
      "Olhar do Tirano",
    ],
  },

  "Dominador Superior": {
    attributes: {
      potencia: 0,
      tecnica: 3,
      agilidade: 2,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      dominio: 5,
      acrobacias: 5,
      pontaria: 5,
      drible: 5,
      enganacao: 5,
    },
    abilities: [
      "Domínio em Pleno Ar",
      "Armadilha De Domínio",
      "Impulso Do Gênio",
      "Domínio Sob Pressão",
    ],
  },

  Velocista: {
    attributes: {
      potencia: 2,
      tecnica: 0,
      agilidade: 1,
      velocidade: 3,
      ego: 1,
    },
    skills: {
      drible: 5,
      corridaLongaDistancia: 5,
      rouboDeBola: 5,
      chute: 5,
      explosao: 5,
    },
    abilities: [
      "Drible Com Adiantamento",
      "Voo Pelo Campo",
      "Fora da Bola",
      "Chute Veloz",
    ],
  },

  "Especialista Espacial": {
    attributes: {
      potencia: 3,
      tecnica: 0,
      agilidade: 2,
      velocidade: 0,
      ego: 3,
    },
    skills: {
      intuicao: 5,
      intimidacao: 5,
      enganacao: 5,
      chute: 5,
      passe: 5,
      furtividade: 5,
      reflexos: 5,
    },
    abilities: [
      "Percepção Espacial Básica",
      "Tiro Direto",
      "Gênio da Adaptação",
    ],
  },

  "Finalizador Clínico": {
    attributes: {
      potencia: 4,
      tecnica: 0,
      agilidade: 1,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      chute: 6,
      corpoACorpo: 5,
      cabecio: 5,
      dominio: 5,
      reflexos: 5,
    },
    abilities: [
      "Ambidestro",
      "Sai De Cima",
      "Finalizador De Longa Distância",
      "Finalização Oportunista",
    ],
  },

  Driblador: {
    attributes: {
      potencia: 0,
      tecnica: 3,
      agilidade: 3,
      velocidade: 0,
      ego: 1,
    },
    skills: {
      drible: 7,
      intuicao: 5,
      passe: 5,
      acrobacias: 5,
      pontaria: 5,
    },
    abilities: [
      "Monstro Interno",
      "Pico De Dopamina",
      "Passe Rápido",
      "Pedalada",
      "Chute Acrobático",
    ],
  },

  "Atacante Completo": {
    attributesMode: "custom_pool",
    attributePool: 7,
    attributeMaxPerStat: 3,
    skillsMode: "custom_pick",
    skillPickCount: 6,
    skillPickBonus: 5,
    attributes: null,
    skills: null,
    abilities: [
      "Dupla Dinâmica",
      "Camaleão Imperfeito",
    ],
  },

  "Caçador de Gols": {
    attributes: {
      potencia: 3,
      tecnica: 0,
      agilidade: 0,
      velocidade: 2,
      ego: 3,
    },
    skills: {
      chute: 5,
      acrobacias: 5,
      explosao: 5,
      intimidacao: 5,
      enganacao: 5,
      corpoACorpo: 5,
      pontaria: 5,
    },
    abilities: [
      "Chute Big Bang",
      "Posicionamento do Às",
      "Drible Agressivo",
      "Início Destrutivo",
    ],
  },

  "Atacante Controlador": {
    attributes: {
      potencia: 1,
      tecnica: 3,
      agilidade: 1,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      pontaria: 5,
      drible: 5,
      passe: 5,
      intimidacao: 5,
      presenca: 5,
      furtividade: 5,
      intuicao: 5,
      rouboDeBola: 5,
    },
    abilities: [
      "Marionetista",
      "Chute Sofisticado",
      "Enganador de Percepções",
      "Fator Sorte Aprimorado",
      "Fake Shot",
    ],
  },

  "Multi-Funções": {
    attributes: {
      potencia: 1,
      tecnica: 1,
      agilidade: 3,
      velocidade: 1,
      ego: 0,
    },
    skills: {
      defesa: 5,
      reflexos: 5,
      chute: 3,
      cabecio: 3,
      pontaria: 3,
      rouboDeBola: 5,
      passe: 3,
      corpoACorpo: 3,
      intuicao: 3,
      acrobacias: 3,
    },
    abilities: [
      "Reação Explosiva",
      "Corpo Tipo Mola",
      "Última Defesa",
    ],
  },

  "Atacante Saltador": {
    attributes: {
      potencia: 3,
      tecnica: 0,
      agilidade: 3,
      velocidade: 0,
      ego: 0,
    },
    skills: {
      cabecio: 7,
      chute: 3,
      corpoACorpo: 5,
      dominio: 5,
      reflexos: 3,
      passe: 5,
      rouboDeBola: 3,
    },
    abilities: [
      "Pressão Do Gigante",
      "Impulso Aprimorado",
      "Grandes Proporções",
    ],
  },

  "Defensor Espacial": {
    attributes: {
      potencia: 4,
      tecnica: 1,
      agilidade: 4,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      defesa: 7,
      rouboDeBola: 7,
      acrobacias: 5,
      reflexos: 5,
      passe: 5,
      corridaLongaDistancia: 5,
      intuicao: 5,
      corpoACorpo: 5,
      chute: 2,
    },
    abilities: [
      "Bote Da Serpente",
      "Defesa Impenetrável (v1)",
      "Troca De Mentalidade",
    ],
  },

  "Louco da Estamina": {
    attributes: {
      potencia: 6,
      tecnica: 0,
      agilidade: 0,
      velocidade: 2,
      ego: 0,
    },
    skills: {
      corpoACorpo: 7,
      chute: 5,
      reflexos: 3,
      corridaLongaDistancia: 2,
      explosao: 1,
    },
    abilities: [
      "Objeto Imóvel",
      "Perseguidor Insistente",
      "Marcação Monstruosa",
    ],
  },

  "Vilão do Campo": {
    attributes: {
      potencia: 3,
      tecnica: 2,
      agilidade: 0,
      velocidade: 0,
      ego: 3,
    },
    skills: {
      chute: 5,
      drible: 5,
      intimidacao: 5,
      corpoACorpo: 5,
      reflexos: 5,
      presenca: 5,
    },
    abilities: [
      "Área do Rei",
      "Imprevisibilidade Do Rei",
      "Olho Do Predador",
      "Filosofia Imperial",
    ],
  },

  Goleiro: {
    attributes: {
      potencia: 0,
      tecnica: 3,
      agilidade: 8,
      velocidade: 3,
      ego: 3,
    },
    skills: {
      defesa: 10,
      passe: 5,
      reflexos: 5,
      acrobacias: 5,
      intimidacao: 5,
      intuicao: 8,
    },
    abilities: [
      "Indução",
      "Coordenar Contra-Ataque",
      "Última Esperança",
    ],
  },

  Ninja: {
    attributes: {
      potencia: 0,
      tecnica: 2,
      agilidade: 2,
      velocidade: 1,
      ego: 1,
    },
    skills: {
      furtividade: 7,
      pontaria: 7,
      presenca: 5,
      passe: 5,
      rouboDeBola: 5,
    },
    abilities: [
      "Caminhar Fantasma",
      "Roubo Fantasma",
      "Chute Sombrio",
      "Tabela com a Sombra",
    ],
  },

  Imperador: {
    attributes: {
      potencia: 4,
      tecnica: 3,
      agilidade: 0,
      velocidade: 0,
      ego: 4,
    },
    skills: {
      drible: 5,
      chute: 5,
      passe: 5,
      intimidacao: 5,
      presenca: 5,
      rouboDeBola: 5,
      corpoACorpo: 5,
      reflexos: 5,
    },
    abilities: [
      "Meta Visão",
      "Impact",
      "Ajoelhe-se",
      "Zona de Perigo",
    ],
  },

  "Devorador de Ás": {
    attributes: {
      potencia: 3,
      tecnica: 4,
      agilidade: 0,
      velocidade: 2,
      ego: 1,
    },
    skills: {
      rouboDeBola: 5,
      presenca: 5,
      intimidacao: 5,
      corpoACorpo: 5,
      reflexos: 5,
      explosao: 5,
      corridaLongaDistancia: 5,
      cabecio: 5,
      defesa: 5,
    },
    abilities: [
      "Você é Meu",
      "Devorador de Ás",
    ],
  },

  Duelista: {
    attributes: {
      potencia: 2,
      tecnica: 3,
      agilidade: 1,
      velocidade: 0,
      ego: 2,
    },
    skills: {
      chute: 5,
      drible: 4,
      rouboDeBola: 4,
      dominio: 5,
      explosao: 5,
      reflexos: 5,
      passe: 6,
    },
    abilities: [
      "Rei Do 1 Contra 1",
      "Jogador Esguio",
      "Gyro-Shot",
      "Driblador Incansável",
    ],
  },

  "Cachorro Louco": {
    attributes: {
      potencia: 4,
      tecnica: 1,
      agilidade: 3,
      velocidade: 0,
      ego: 3,
    },
    skills: {
      cabecio: 5,
      passe: 5,
      defesa: 8,
      reflexos: 7,
      rouboDeBola: 6,
      explosao: 5,
    },
    abilities: [
      "Cão Solto",
      "Continuem o ataque!",
      "Corta Luz",
    ],
  },
};

export function getClassTemplate(className) {
  return CLASS_BOOK[String(className || "").trim()] ?? null;
}

export function getClassAbilities(className) {
  return getClassTemplate(className)?.abilities ?? [];
}

export function getClassAttributes(className) {
  return getClassTemplate(className)?.attributes ?? null;
}

export function getClassSkills(className) {
  return getClassTemplate(className)?.skills ?? null;
}