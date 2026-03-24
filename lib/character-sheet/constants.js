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

export const attributeLabels = {
  potencia: "Potência",
  tecnica: "Técnica",
  agilidade: "Agilidade",
  velocidade: "Velocidade",
  ego: "Ego",
};

export const skillLabels = {
  corpoACorpo: "Corpo a Corpo",
  cabecio: "Cabeceio",
  chute: "Chute",
  pontaria: "Pontaria",
  dominio: "Domínio",
  passe: "Passe",
  drible: "Drible",
  rouboDeBola: "Roubo de Bola",
  acrobacias: "Acrobacias",
  defesa: "Defesa",
  reflexos: "Reflexos",
  furtividade: "Furtividade",
  corridaLongaDistancia: "Corrida Longa Distância",
  explosao: "Explosão",
  ritmoDeJogo: "Ritmo de Jogo",
  intuicao: "Intuição",
  intimidacao: "Intimidação",
  presenca: "Presença",
  lideranca: "Liderança",
  enganacao: "Enganação",
};

export const skillGroups = [
  {
    title: "Potência",
    keys: ["corpoACorpo", "cabecio", "chute"],
    labels: {
      corpoACorpo: "Corpo a Corpo",
      cabecio: "Cabeceio",
      chute: "Chute",
    },
  },
  {
    title: "Técnica",
    keys: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"],
    labels: {
      pontaria: "Pontaria",
      dominio: "Domínio",
      passe: "Passe",
      drible: "Drible",
      rouboDeBola: "Roubo de Bola",
    },
  },
  {
    title: "Agilidade",
    keys: ["acrobacias", "defesa", "reflexos", "furtividade"],
    labels: {
      acrobacias: "Acrobacias",
      defesa: "Defesa",
      reflexos: "Reflexos",
      furtividade: "Furtividade",
    },
  },
  {
    title: "Velocidade",
    keys: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"],
    labels: {
      corridaLongaDistancia: "Corrida Longa Distância",
      explosao: "Explosão",
      ritmoDeJogo: "Ritmo de Jogo",
    },
  },
  {
    title: "Ego",
    keys: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"],
    labels: {
      intuicao: "Intuição",
      intimidacao: "Intimidação",
      presenca: "Presença",
      lideranca: "Liderança",
      enganacao: "Enganação",
    },
  },
];