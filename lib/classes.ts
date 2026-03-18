export interface Skill {
  name: string;
  attribute: 'potencia' | 'tecnica' | 'agilidade' | 'velocidade' | 'ego';
  baseValue: number;
}

export interface Attribute {
  potencia: number;
  tecnica: number;
  velocidade: number;
  agilidade: number;
  ego: number;
}

export interface ClassData {
  id: string;
  name: string;
  description: string;
  attributes: Attribute;
  skills: Skill[];
}

// Lista completa de perícias organizadas por atributo
export const ALL_SKILLS: Skill[] = [
  // Potência
  { name: 'Corpo a Corpo', attribute: 'potencia', baseValue: 0 },
  { name: 'Cabeceio', attribute: 'potencia', baseValue: 0 },
  { name: 'Chute', attribute: 'potencia', baseValue: 0 },
  
  // Técnica
  { name: 'Pontaria', attribute: 'tecnica', baseValue: 0 },
  { name: 'Domínio', attribute: 'tecnica', baseValue: 0 },
  { name: 'Passe', attribute: 'tecnica', baseValue: 0 },
  { name: 'Drible/Finta', attribute: 'tecnica', baseValue: 0 },
  { name: 'Roubo de Bola', attribute: 'tecnica', baseValue: 0 },
  
  // Agilidade
  { name: 'Acrobacias', attribute: 'agilidade', baseValue: 0 },
  { name: 'Defesa', attribute: 'agilidade', baseValue: 0 },
  { name: 'Reflexos', attribute: 'agilidade', baseValue: 0 },
  { name: 'Furtividade', attribute: 'agilidade', baseValue: 0 },
  
  // Velocidade
  { name: 'Corrida Longa Distância', attribute: 'velocidade', baseValue: 0 },
  { name: 'Explosão', attribute: 'velocidade', baseValue: 0 },
  { name: 'Ritmo de Jogo', attribute: 'velocidade', baseValue: 0 },
  
  // Ego
  { name: 'Intuição', attribute: 'ego', baseValue: 0 },
  { name: 'Intimidação', attribute: 'ego', baseValue: 0 },
  { name: 'Presença', attribute: 'ego', baseValue: 0 },
  { name: 'Liderança', attribute: 'ego', baseValue: 0 },
  { name: 'Enganação', attribute: 'ego', baseValue: 0 },
];

export const CLASSES: ClassData[] = [
  {
    id: 'playmaker',
    name: 'PlayMaker',
    description: 'O craque do time, capaz de finalizar, passar com precisão e driblar com maestria.',
    attributes: { potencia: 0, tecnica: 3, velocidade: 0, agilidade: 2, ego: 2 },
    skills: [
      { name: 'Passe', attribute: 'tecnica', baseValue: 5 },
      { name: 'Drible/Finta', attribute: 'tecnica', baseValue: 5 },
      { name: 'Pontaria', attribute: 'tecnica', baseValue: 5 },
      { name: 'Roubo de Bola', attribute: 'tecnica', baseValue: 5 },
      { name: 'Intuição', attribute: 'ego', baseValue: 5 },
      { name: 'Intimidação', attribute: 'ego', baseValue: 5 },
    ]
  },
  {
    id: 'velocista',
    name: 'Velocista',
    description: 'Extremamente hábil em perfurar a defesa adversária em contra-ataques.',
    attributes: { potencia: 2, tecnica: 0, velocidade: 3, agilidade: 1, ego: 1 },
    skills: [
      { name: 'Drible/Finta', attribute: 'tecnica', baseValue: 5 },
      { name: 'Corrida Longa Distância', attribute: 'velocidade', baseValue: 5 },
      { name: 'Roubo de Bola', attribute: 'tecnica', baseValue: 5 },
      { name: 'Chute', attribute: 'potencia', baseValue: 5 },
      { name: 'Explosão', attribute: 'velocidade', baseValue: 5 },
    ]
  },
];
