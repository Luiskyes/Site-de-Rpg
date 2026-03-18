'use client';

import { useState } from 'react';
import { CLASSES, ClassData, ALL_SKILLS, Skill } from '@/lib/classes';

interface CharacterInfo {
  name: string;
  age: string;
  height: string;
  weight: string;
  background: string;
}

interface SkillValue extends Skill {
  currentValue: number;
  baseValue: number;
  addedPoints: number;
}

interface AttributeValue {
  name: string;
  baseValue: number;
  addedPoints: number;
  currentValue: number;
}

export default function Home() {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo>({
    name: '',
    age: '',
    height: '',
    weight: '',
    background: '',
  });
  const [skills, setSkills] = useState<SkillValue[]>([]);
  const [attributes, setAttributes] = useState<AttributeValue[]>([]);
  const [availableAttributePoints, setAvailableAttributePoints] = useState(7);
  const [availableSkillPoints, setAvailableSkillPoints] = useState(15);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleClassSelect = (classData: ClassData) => {
    setSelectedClass(classData);
    
    const initializedAttributes: AttributeValue[] = [
      { name: 'potencia', baseValue: classData.attributes.potencia, addedPoints: 0, currentValue: classData.attributes.potencia },
      { name: 'tecnica', baseValue: classData.attributes.tecnica, addedPoints: 0, currentValue: classData.attributes.tecnica },
      { name: 'velocidade', baseValue: classData.attributes.velocidade, addedPoints: 0, currentValue: classData.attributes.velocidade },
      { name: 'agilidade', baseValue: classData.attributes.agilidade, addedPoints: 0, currentValue: classData.attributes.agilidade },
      { name: 'ego', baseValue: classData.attributes.ego, addedPoints: 0, currentValue: classData.attributes.ego },
    ];
    setAttributes(initializedAttributes);
    
    const initializedSkills = ALL_SKILLS.map(skill => {
      const classSkill = classData.skills.find(s => s.name === skill.name);
      const base = classSkill ? classSkill.baseValue : 0;
      return {
        ...skill,
        baseValue: base,
        addedPoints: 0,
        currentValue: base,
      };
    });
    
    setSkills(initializedSkills);
    setAvailableAttributePoints(7);
    setAvailableSkillPoints(15);
    setIsConfirmed(false);
  };

  const adjustAttribute = (attributeName: string, change: number) => {
    if (isConfirmed) return;

    setAttributes(prev => {
      const attr = prev.find(a => a.name === attributeName);
      if (!attr) return prev;

      const newAddedPoints = attr.addedPoints + change;

      if (newAddedPoints < 0) return prev;
      if (newAddedPoints > 5) return prev;

      const newAvailablePoints = availableAttributePoints - change;
      if (newAvailablePoints < 0) return prev;

      setAvailableAttributePoints(newAvailablePoints);

      return prev.map(a => {
        if (a.name === attributeName) {
          return {
            ...a,
            addedPoints: newAddedPoints,
            currentValue: a.baseValue + newAddedPoints,
          };
        }
        return a;
      });
    });
  };

  const adjustSkill = (skillName: string, change: number) => {
    if (isConfirmed) return;

    setSkills(prev => {
      const skill = prev.find(s => s.name === skillName);
      if (!skill) return prev;

      const newAddedPoints = skill.addedPoints + change;

      if (newAddedPoints < 0) return prev;
      if (newAddedPoints > 10) return prev;

      const newAvailablePoints = availableSkillPoints - change;
      if (newAvailablePoints < 0) return prev;

      setAvailableSkillPoints(newAvailablePoints);

      return prev.map(s => {
        if (s.name === skillName) {
          return {
            ...s,
            addedPoints: newAddedPoints,
            currentValue: s.baseValue + newAddedPoints,
          };
        }
        return s;
      });
    });
  };

  const confirmCharacter = () => {
    if (window.confirm('Tem certeza? Após confirmar, você não poderá mais alterar os pontos!')) {
      setIsConfirmed(true);
    }
  };

  const getAttribute = (name: string) => {
    return attributes.find(a => a.name === name);
  };

  const getAttributeBonus = (attributeName: string): number => {
    const attr = getAttribute(attributeName);
    if (!attr) return 0;
    return Math.floor(attr.currentValue / 2);
  };

  const getSkillsByAttribute = (attribute: string) => {
    const attributeBonus = getAttributeBonus(attribute);
    return skills
      .filter(skill => skill.attribute === attribute)
      .map(skill => ({
        ...skill,
        totalValue: skill.currentValue + attributeBonus,
        attributeBonus: attributeBonus,
      }));
  };

  const attributeColors = {
    potencia: { bg: 'bg-blue-500/20', text: 'text-blue-200', border: 'border-blue-400' },
    tecnica: { bg: 'bg-purple-500/20', text: 'text-purple-200', border: 'border-purple-400' },
    velocidade: { bg: 'bg-green-500/20', text: 'text-green-200', border: 'border-green-400' },
    agilidade: { bg: 'bg-yellow-500/20', text: 'text-yellow-200', border: 'border-yellow-400' },
    ego: { bg: 'bg-red-500/20', text: 'text-red-200', border: 'border-red-400' },
  };

  const attributeNames = {
    potencia: 'Potência',
    tecnica: 'Técnica',
    velocidade: 'Velocidade',
    agilidade: 'Agilidade',
    ego: 'Ego',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-2">
          Blue Lock RPG
        </h1>
        <p className="text-blue-200 text-center mb-8">Sistema de Criação de Ficha - KEYs LOCK</p>

        {!selectedClass ? (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Escolha sua Classe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CLASSES.map((classData) => (
                <button
                  key={classData.id}
                  onClick={() => handleClassSelect(classData)}
                  className="bg-white/10 backdrop-blur-sm border-2 border-blue-400/30 rounded-lg p-6 hover:bg-white/20 hover:border-blue-400/60 transition-all transform hover:scale-105"
                >
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {classData.name}
                  </h3>
                  <p className="text-blue-200 text-sm">{classData.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Ficha de Personagem</h2>
              <button
                onClick={() => setSelectedClass(null)}
                className="bg-red-500/80 hover:bg-red-600/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Voltar
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-2 border-blue-400/30 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-4">Informações do Personagem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-blue-200 text-sm block mb-1">Nome do Personagem:</label>
                  <input
                    type="text"
                    value={characterInfo.name}
                    onChange={(e) => setCharacterInfo({ ...characterInfo, name: e.target.value })}
                    disabled={isConfirmed}
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-1">Classe:</label>
                  <input
                    type="text"
                    value={selectedClass.name}
                    disabled
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white opacity-50"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-1">Idade:</label>
                  <input
                    type="text"
                    value={characterInfo.age}
                    onChange={(e) => setCharacterInfo({ ...characterInfo, age: e.target.value })}
                    disabled={isConfirmed}
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-1">Altura:</label>
                  <input
                    type="text"
                    value={characterInfo.height}
                    onChange={(e) => setCharacterInfo({ ...characterInfo, height: e.target.value })}
                    disabled={isConfirmed}
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm block mb-1">Peso:</label>
                  <input
                    type="text"
                    value={characterInfo.weight}
                    onChange={(e) => setCharacterInfo({ ...characterInfo, weight: e.target.value })}
                    disabled={isConfirmed}
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-blue-200 text-sm block mb-1">Histórico/Breve descrição:</label>
                  <textarea
                    value={characterInfo.background}
                    onChange={(e) => setCharacterInfo({ ...characterInfo, background: e.target.value })}
                    disabled={isConfirmed}
                    rows={3}
                    className="w-full bg-white/5 border border-blue-400/30 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm border-2 border-blue-400/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">Pontos de Atributos:</span>
                  <span className={`text-3xl font-bold ${availableAttributePoints > 0 ? 'text-green-400' : 'text-white'}`}>
                    {availableAttributePoints}/7
                  </span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border-2 border-purple-400/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-lg">Pontos de Perícias:</span>
                  <span className={`text-3xl font-bold ${availableSkillPoints > 0 ? 'text-green-400' : 'text-white'}`}>
                    {availableSkillPoints}/15
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border-2 border-blue-400/30 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-4">Atributos Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {attributes.map((attr) => (
                  <div key={attr.name} className={`${attributeColors[attr.name as keyof typeof attributeColors].bg} border-2 ${attributeColors[attr.name as keyof typeof attributeColors].border} rounded-lg p-4`}>
                    <div className="text-center mb-3">
                      <div className="text-white text-sm mb-1">{attributeNames[attr.name as keyof typeof attributeNames]}</div>
                      <div className="text-4xl font-bold text-white">{attr.currentValue}</div>
                      {attr.addedPoints > 0 && (
                        <div className="text-green-400 text-xs">+{attr.addedPoints}</div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => adjustAttribute(attr.name, -1)}
                        disabled={isConfirmed || attr.addedPoints <= 0}
                        className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8rounded disabled:cursor-not-allowed transition-colors text-lg"
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjustAttribute(attr.name, 1)}
                        disabled={isConfirmed || availableAttributePoints <= 0 || attr.addedPoints >= 5}
                        className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors text-lg"
                      >
                        +
                      </button>
                    </div>
                    {attr.addedPoints >= 5 && (
                      <div className="text-orange-400 text-xs text-center mt-2">Máx. atingido</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Potência */}
              <div className={`${attributeColors.potencia.bg} border-2 ${attributeColors.potencia.border} rounded-lg p-6`}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Potência: {getAttribute('potencia')?.currentValue || 0}
                  <span className="text-sm text-blue-300 ml-2">
                    (Bônus: +{getAttributeBonus('potencia')} em perícias)
                  </span>
                </h3>
                <div className="space-y-3">
                  {getSkillsByAttribute('potencia').map((skill) => (
                    <div key={skill.name} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{skill.name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustSkill(skill.name, -1)}
                            disabled={isConfirmed || skill.addedPoints <= 0}
                            className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <div className="text-center min-w-[60px]">
                            <div className="text-white font-bold text-xl">{skill.totalValue}</div>
                            <div className="flex flex-col text-xs">
                              {skill.baseValue > 0 && (
                                <span className="text-gray-300">Base: {skill.baseValue}</span>
                              )}
                              {skill.addedPoints > 0 && (
                                <span className="text-green-400">+{skill.addedPoints} pontos</span>
                              )}
                              {skill.attributeBonus > 0 && (
                                <span className="text-blue-400">+{skill.attributeBonus} atributo</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => adjustSkill(skill.name, 1)}
                            disabled={isConfirmed || availableSkillPoints <= 0 || skill.addedPoints >= 10}
                            className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {skill.addedPoints >= 10 && (
                        <div className="text-orange-400 text-xs mt-1">Máximo de pontos atingido (10)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Técnica */}
              <div className={`${attributeColors.tecnica.bg} border-2 ${attributeColors.tecnica.border} rounded-lg p-6`}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Técnica: {getAttribute('tecnica')?.currentValue || 0}
                  <span className="text-sm text-purple-300 ml-2">
                    (Bônus: +{getAttributeBonus('tecnica')} em perícias)
                  </span>
                </h3>
                <div className="space-y-3">
                  {getSkillsByAttribute('tecnica').map((skill) => (
                    <div key={skill.name} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{skill.name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustSkill(skill.name, -1)}
                            disabled={isConfirmed || skill.addedPoints <= 0}
                            className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <div className="text-center min-w-[60px]">
                            <div className="text-white font-bold text-xl">{skill.totalValue}</div>
                            <div className="flex flex-col text-xs">
                              {skill.baseValue > 0 && (
                                <span className="text-gray-300">Base: {skill.baseValue}</span>
                              )}
                              {skill.addedPoints > 0 && (
                                <span className="text-green-400">+{skill.addedPoints} pontos</span>
                              )}
                              {skill.attributeBonus > 0 && (
                                <span className="text-blue-400">+{skill.attributeBonus} atributo</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => adjustSkill(skill.name, 1)}
                            disabled={isConfirmed || availableSkillPoints <= 0 || skill.addedPoints >= 10}
                            className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {skill.addedPoints >= 10 && (
                        <div className="text-orange-400 text-xs mt-1">Máximo de pontos atingido (10)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agilidade */}
              <div className={`${attributeColors.agilidade.bg} border-2 ${attributeColors.agilidade.border} rounded-lg p-6`}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Agilidade: {getAttribute('agilidade')?.currentValue || 0}
                  <span className="text-sm text-yellow-300 ml-2">
                    (Bônus: +{getAttributeBonus('agilidade')} em perícias)
                  </span>
                </h3>
                <div className="space-y-3">
                  {getSkillsByAttribute('agilidade').map((skill) => (
                    <div key={skill.name} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{skill.name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustSkill(skill.name, -1)}
                            disabled={isConfirmed || skill.addedPoints <= 0}
                            className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <div className="text-center min-w-[60px]">
                            <div className="text-white font-bold text-xl">{skill.totalValue}</div>
                            <div className="flex flex-col text-xs">
                              {skill.baseValue > 0 && (
                                <span className="text-gray-300">Base: {skill.baseValue}</span>
                              )}
                              {skill.addedPoints > 0 && (
                                <span className="text-green-400">+{skill.addedPoints} pontos</span>
                              )}
                              {skill.attributeBonus > 0 && (
                                <span className="text-blue-400">+{skill.attributeBonus} atributo</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => adjustSkill(skill.name, 1)}
                            disabled={isConfirmed || availableSkillPoints <= 0 || skill.addedPoints >= 10}
                            className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {skill.addedPoints >= 10 && (
                        <div className="text-orange-400 text-xs mt-1">Máximo de pontos atingido (10)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Velocidade */}
              <div className={`${attributeColors.velocidade.bg} border-2 ${attributeColors.velocidade.border} rounded-lg p-6`}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Velocidade: {getAttribute('velocidade')?.currentValue || 0}
                  <span className="text-sm text-green-300 ml-2">
                    (Bônus: +{getAttributeBonus('velocidade')} em perícias)
                  </span>
                </h3>
                <div className="space-y-3">
                  {getSkillsByAttribute('velocidade').map((skill) => (
                    <div key={skill.name} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{skill.name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustSkill(skill.name, -1)}
                            disabled={isConfirmed || skill.addedPoints <= 0}
                            className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <div className="text-center min-w-[60px]">
                            <div className="text-white font-bold text-xl">{skill.totalValue}</div>
                            <div className="flex flex-col text-xs">
                              {skill.baseValue > 0 && (
                                <span className="text-gray-300">Base: {skill.baseValue}</span>
                              )}
                              {skill.addedPoints > 0 && (
                                <span className="text-green-400">+{skill.addedPoints} pontos</span>
                              )}
                              {skill.attributeBonus > 0 && (
                                <span className="text-blue-400">+{skill.attributeBonus} atributo</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => adjustSkill(skill.name, 1)}
                            disabled={isConfirmed || availableSkillPoints <= 0 || skill.addedPoints >= 10}
                            className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {skill.addedPoints >= 10 && (
                        <div className="text-orange-400 text-xs mt-1">Máximo de pontos atingido (10)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ego */}
              <div className={`${attributeColors.ego.bg} border-2 ${attributeColors.ego.border} rounded-lg p-6 lg:col-span-2`}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ego: {getAttribute('ego')?.currentValue || 0}
                  <span className="text-sm text-red-300 ml-2">
                    (Bônus: +{getAttributeBonus('ego')} em perícias)
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getSkillsByAttribute('ego').map((skill) => (
                    <div key={skill.name} className="bg-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{skill.name}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustSkill(skill.name, -1)}
                            disabled={isConfirmed || skill.addedPoints <= 0}
                            className="bg-red-500/50 hover:bg-red-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <div className="text-center min-w-[60px]">
                            <div className="text-white font-bold text-xl">{skill.totalValue}</div>
                            <div className="flex flex-col text-xs">
                              {skill.baseValue > 0 && (
                                <span className="text-gray-300">Base: {skill.baseValue}</span>
                              )}
                              {skill.addedPoints > 0 && (
                                <span className="text-green-400">+{skill.addedPoints} pontos</span>
                              )}
                              {skill.attributeBonus > 0 && (
                                <span className="text-blue-400">+{skill.attributeBonus} atributo</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => adjustSkill(skill.name, 1)}
                            disabled={isConfirmed|| availableSkillPoints <= 0 || skill.addedPoints >= 10}
                            className="bg-green-500/50 hover:bg-green-500 disabled:bg-gray-500/30 text-white w-8 h-8 rounded disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {skill.addedPoints >= 10 && (
                        <div className="text-orange-400 text-xs mt-1">Máximo de pontos atingido (10)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão Confirmar */}
            {!isConfirmed ? (
              <button
                onClick={confirmCharacter}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-xl transition-colors"
              >
                Confirmar Ficha (Ação Permanente!)
              </button>
            ) : (
              <div className="bg-green-600/20 border-2 border-green-400 rounded-lg p-4 text-center">
                <span className="text-green-400 font-bold text-xl">✓ Ficha Confirmada!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

