"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppTopBar from "../../components/AppTopBar";
import {
  getHeightModifiers,
  getWeightModifiers,
  getAmbidexterityModifiers,
} from "../../../lib/character-rules";

import { styles } from "./styles";

const EMPTY_ATTRIBUTES = {
  potencia: 0,
  tecnica: 0,
  agilidade: 0,
  velocidade: 0,
  ego: 0,
};

const EMPTY_SKILLS = {
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

const ATTRIBUTE_TO_SKILLS = {
  potencia: ["corpoACorpo", "cabecio", "chute"],
  tecnica: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"],
  agilidade: ["acrobacias", "defesa", "reflexos", "furtividade"],
  velocidade: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"],
  ego: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"],
};

const attributeLabels = {
  potencia: "Potência",
  tecnica: "Técnica",
  agilidade: "Agilidade",
  velocidade: "Velocidade",
  ego: "Ego",
};

const skillLabels = {
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

const skillGroups = [
  { title: "Potência", keys: ["corpoACorpo", "cabecio", "chute"] },
  { title: "Técnica", keys: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"] },
  { title: "Agilidade", keys: ["acrobacias", "defesa", "reflexos", "furtividade"] },
  { title: "Velocidade", keys: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"] },
  { title: "Ego", keys: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"] },
];

function sumValues(obj) {
  return Object.values(obj || {}).reduce((acc, value) => acc + Number(value || 0), 0);
}

function updatePointAllocation({ current, key, value, maxPerItem, maxTotal }) {
  const nextValue = Math.max(0, Math.min(value, maxPerItem));
  const previousValue = Number(current?.[key] || 0);

  if (nextValue === previousValue) return current;
  if (sumValues(current) - previousValue + nextValue > maxTotal) return current;

  return { ...current, [key]: nextValue };
}

function mergeNumberObjects(...objects) {
  const result = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj || {})) {
      result[key] = Number(result[key] || 0) + Number(value || 0);
    }
  }
  return result;
}

function getPassiveSkillBonusesFromAttributes(finalAttributes) {
  const bonuses = {};
  for (const [attributeKey, skills] of Object.entries(ATTRIBUTE_TO_SKILLS)) {
    const attributeValue = Number(finalAttributes?.[attributeKey] || 0);
    const passiveBonus = Math.floor(attributeValue / 2);
    for (const skill of skills) {
      bonuses[skill] = passiveBonus;
    }
  }
  return bonuses;
}

function formatModifier(value) {
  if (!value) return "0";
  return value > 0 ? `+${value}` : String(value);
}

export default function CreateCharacterPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [config, setConfig] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    name: "",
    classId: "",
    class: "",
    selectedAbility: "",
    age: "",
    heightCm: "",
    weightKg: "",
    staminaBase: "",
    staminaCurrent: "",
    allocatedAttributes: { ...EMPTY_ATTRIBUTES },
    allocatedSkills: { ...EMPTY_SKILLS },
    notes: "",
    specialTrait: null,
    isAmbidextrous: false,
  });

  const [customClassAttributes, setCustomClassAttributes] = useState({ ...EMPTY_ATTRIBUTES });
  const [customClassSkills, setCustomClassSkills] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [classesRes, configRes] = await Promise.all([
          fetch("/api/classes", { cache: "no-store", signal: controller.signal }),
          fetch("/api/game-config", { cache: "no-store", signal: controller.signal }),
        ]);

        const classesData = await classesRes.json();
        const configData = await configRes.json();

        if (classesRes.ok) setClasses(classesData);
        if (configRes.ok) setConfig(configData);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Erro ao carregar dados:", err);
      } finally {
        if (!controller.signal.aborted) setLoadingData(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const selectedClassData = useMemo(() => {
    return classes.find((item) => String(item.id) === String(form.classId)) || null;
  }, [classes, form.classId]);

  const uniqueSelectedClassAbilities = useMemo(() => {
    const rawAbilities = Array.isArray(selectedClassData?.abilities)
      ? selectedClassData.abilities
      : [];

    const seen = new Set();

    return rawAbilities
      .map((ability, index) => {
        const name =
          typeof ability === "string"
            ? ability.trim()
            : String(ability?.name || "").trim();

        if (!name) return null;

        const normalized = name.toLowerCase();
        if (seen.has(normalized)) return null;

        seen.add(normalized);

        return {
          id: `${normalized}-${index}`,
          name,
        };
      })
      .filter(Boolean);
  }, [selectedClassData]);

  const isCustomAttributeClass =
    selectedClassData?.attributesMode === "custom_pool";

  const isCustomSkillClass =
    selectedClassData?.skillsMode === "custom_pick";

  const customAttributePool = Number(selectedClassData?.attributePool || 0);
  const customAttributeMaxPerStat = Number(selectedClassData?.attributeMaxPerStat || 0);
  const customSkillPickCount = Number(selectedClassData?.skillPickCount || 0);
  const customSkillPickBonus = Number(selectedClassData?.skillPickBonus || 0);

  const customClassAttributeSpent = useMemo(
    () => sumValues(customClassAttributes),
    [customClassAttributes]
  );

  useEffect(() => {
    setCustomClassAttributes({ ...EMPTY_ATTRIBUTES });
    setCustomClassSkills([]);
    setForm((prev) => ({
      ...prev,
      selectedAbility: "",
    }));
  }, [selectedClassData?.id]);

  const classAttributes = useMemo(() => {
    if (isCustomAttributeClass) {
      return { ...EMPTY_ATTRIBUTES, ...customClassAttributes };
    }

    return { ...EMPTY_ATTRIBUTES, ...(selectedClassData?.attributeBonuses ?? {}) };
  }, [selectedClassData, isCustomAttributeClass, customClassAttributes]);

  const classSkills = useMemo(() => {
    if (isCustomSkillClass) {
      return customClassSkills.reduce(
        (acc, key) => {
          acc[key] = customSkillPickBonus;
          return acc;
        },
        { ...EMPTY_SKILLS }
      );
    }

    return { ...EMPTY_SKILLS, ...(selectedClassData?.skillBonuses ?? {}) };
  }, [selectedClassData, isCustomSkillClass, customClassSkills, customSkillPickBonus]);

  const finalAttributes = useMemo(() => {
    return mergeNumberObjects(classAttributes, form.allocatedAttributes);
  }, [classAttributes, form.allocatedAttributes]);

  const passiveBonuses = useMemo(() => {
    return getPassiveSkillBonusesFromAttributes(finalAttributes);
  }, [finalAttributes]);

  const heightModifiers = useMemo(() => {
    return getHeightModifiers(form.heightCm === "" ? null : Number(form.heightCm), false);
  }, [form.heightCm]);

  const weightModifiers = useMemo(() => {
    return getWeightModifiers(form.weightKg === "" ? null : Number(form.weightKg), false);
  }, [form.weightKg]);

  const ambidexterityModifiers = useMemo(() => {
    return getAmbidexterityModifiers(form.isAmbidextrous);
  }, [form.isAmbidextrous]);

  const finalSkillsPreview = useMemo(() => {
    return mergeNumberObjects(
      classSkills,
      form.allocatedSkills,
      passiveBonuses,
      heightModifiers,
      weightModifiers,
      ambidexterityModifiers
    );
  }, [
    classSkills,
    form.allocatedSkills,
    passiveBonuses,
    heightModifiers,
    weightModifiers,
    ambidexterityModifiers,
  ]);

  const baseAttributeTotal = config?.attributePointsAtCreation ?? 7;
  const baseSkillTotal = config?.skillPointsAtCreation ?? 15;
  const baseAttributeMax = config?.attributeMaxAtCreation ?? 5;
  const baseSkillMax = config?.skillMaxAtCreation ?? 10;

  const extraAttributePoints = form.specialTrait === "prodigio" ? 6 : 0;
  const extraSkillPoints = form.specialTrait === "genio" ? 6 : 0;

  const attributeTotal = baseAttributeTotal + extraAttributePoints;
  const skillTotal = baseSkillTotal + extraSkillPoints;

  const attributePointsSpent = useMemo(
    () => sumValues(form.allocatedAttributes),
    [form.allocatedAttributes]
  );

  const skillPointsSpent = useMemo(
    () => sumValues(form.allocatedSkills),
    [form.allocatedSkills]
  );

  const selectedAbilityData = useMemo(() => {
    return (
      uniqueSelectedClassAbilities.find(
        (ability) => ability.name === form.selectedAbility
      ) || null
    );
  }, [uniqueSelectedClassAbilities, form.selectedAbility]);

  function handleBasicChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleClassChange(e) {
    const selectedId = e.target.value;
    const found = classes.find((item) => String(item.id) === String(selectedId));

    setForm((prev) => ({
      ...prev,
      classId: selectedId,
      class: found?.name || "",
      selectedAbility: "",
    }));
  }

  function handleTraitChange(trait) {
    setForm((prev) => ({
      ...prev,
      specialTrait: prev.specialTrait === trait ? null : trait,
    }));
  }

  function toggleAmbidexterity() {
    setForm((prev) => ({
      ...prev,
      isAmbidextrous: !prev.isAmbidextrous,
    }));
  }

  const handleAttributeChange = useCallback((key, rawValue) => {
    const value = Number(rawValue || 0);
    setForm((prev) => {
      const allocatedAttributes = updatePointAllocation({
        current: prev.allocatedAttributes,
        key,
        value,
        maxPerItem: prev.specialTrait === "prodigio" ? 999 : baseAttributeMax,
        maxTotal: attributeTotal,
      });

      return allocatedAttributes === prev.allocatedAttributes
        ? prev
        : { ...prev, allocatedAttributes };
    });
  }, [attributeTotal, baseAttributeMax]);

  const handleSkillChange = useCallback((key, rawValue) => {
    const value = Number(rawValue || 0);
    setForm((prev) => {
      const allocatedSkills = updatePointAllocation({
        current: prev.allocatedSkills,
        key,
        value,
        maxPerItem: prev.specialTrait === "genio" ? 999 : baseSkillMax,
        maxTotal: skillTotal,
      });

      return allocatedSkills === prev.allocatedSkills
        ? prev
        : { ...prev, allocatedSkills };
    });
  }, [baseSkillMax, skillTotal]);

  function incrementCustomClassAttribute(key) {
    if (!isCustomAttributeClass) return;
    if (customClassAttributeSpent >= customAttributePool) return;

    setCustomClassAttributes((prev) => {
      const current = Number(prev[key] || 0);
      if (current >= customAttributeMaxPerStat) return prev;

      return {
        ...prev,
        [key]: current + 1,
      };
    });
  }

  function decrementCustomClassAttribute(key) {
    if (!isCustomAttributeClass) return;

    setCustomClassAttributes((prev) => ({
      ...prev,
      [key]: Math.max(0, Number(prev[key] || 0) - 1),
    }));
  }

  function toggleCustomClassSkill(key) {
    if (!isCustomSkillClass) return;

    setCustomClassSkills((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }

      if (prev.length >= customSkillPickCount) {
        return prev;
      }

      return [...prev, key];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!selectedClassData) {
      setError("Selecione uma classe.");
      return;
    }

    if (!form.selectedAbility) {
      setError("Selecione uma habilidade inicial.");
      return;
    }

    if (isCustomAttributeClass && customClassAttributeSpent !== customAttributePool) {
      setError(`Distribua exatamente ${customAttributePool} pontos nos atributos da classe.`);
      return;
    }

    if (isCustomSkillClass && customClassSkills.length !== customSkillPickCount) {
      setError(`Escolha exatamente ${customSkillPickCount} perícias da classe.`);
      return;
    }

    if (attributePointsSpent !== attributeTotal) {
      setError(`Você precisa gastar exatamente ${attributeTotal} pontos em atributos.`);
      return;
    }

    if (skillPointsSpent !== skillTotal) {
      setError(`Você precisa gastar exatamente ${skillTotal} pontos em perícias.`);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        class: selectedClassData.name,
        classId: selectedClassData.id,
        selectedAbility: form.selectedAbility,
        age: form.age === "" ? null : Number(form.age),
        heightCm: form.heightCm === "" ? null : Number(form.heightCm),
        weightKg: form.weightKg === "" ? null : Number(form.weightKg),
        staminaBase: form.staminaBase === "" ? null : Number(form.staminaBase),
        staminaCurrent:
          form.staminaCurrent === ""
            ? form.staminaBase === ""
              ? null
              : Number(form.staminaBase)
            : Number(form.staminaCurrent),
        classAttributes,
        classSkills,
        allocatedAttributes: form.allocatedAttributes,
        allocatedSkills: form.allocatedSkills,
        notes: form.notes.trim() || null,
        specialTrait: form.specialTrait,
        isAmbidextrous: form.isAmbidextrous,
      };

      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar ficha");
        return;
      }

      setSuccess("Ficha criada com sucesso!");
      router.push(`/characters/${data.id}`);
      router.refresh();
    } catch {
      setError("Erro inesperado ao criar ficha");
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="ui-loading-page" style={styles.loadingPage}>
        <div className="ui-loading-card" role="status" aria-live="polite" style={styles.loadingCard}>
          Carregando criação de ficha...
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page" style={styles.page}>
      <div className="ui-orb" style={styles.bgOrbTop} />
      <div className="ui-orb" style={styles.bgOrbBottom} />

      <div className="ui-container" style={styles.container}>
        <AppTopBar backHref="/" backLabel="Painel" context="Nova ficha" />

        <section className="ui-hero" style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroEyebrow}>Nova ficha</p>
            <h1 className="ui-title" style={styles.heroTitle}>Criar Personagem</h1>
            <p style={styles.heroSubtitle}>
              Escolha a classe, ative seus diferenciais e distribua os pontos com
              uma visualização clara do resultado final.
            </p>

            <div style={styles.heroSealRow}>
              {form.specialTrait === "genio" ? <Seal label="Gênio" accent="blue" /> : null}
              {form.specialTrait === "prodigio" ? <Seal label="Prodígio" accent="green" /> : null}
              {form.isAmbidextrous ? <Seal label="Ambidestria" accent="purple" /> : null}
            </div>
          </div>

          <div className="ui-hero-side" style={styles.heroSideCard}>
            <div style={styles.heroSideItem}>
              <span style={styles.heroSideLabel}>Atributos</span>
              <strong style={styles.heroSideValue}>
                {attributePointsSpent}/{attributeTotal}
              </strong>
            </div>
            <div style={styles.heroSideItem}>
              <span style={styles.heroSideLabel}>Perícias</span>
              <strong style={styles.heroSideValue}>
                {skillPointsSpent}/{skillTotal}
              </strong>
            </div>
            <div style={styles.heroSideItem}>
              <span style={styles.heroSideLabel}>Classe</span>
              <strong style={styles.heroSideValueSmall}>
                {selectedClassData?.name || "Não selecionada"}
              </strong>
            </div>
          </div>
        </section>

        <form className="ui-main-grid" onSubmit={handleSubmit} style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <Card
              title="Dados principais"
              subtitle="Base do personagem e status inicial"
            >
              <div className="ui-grid" style={styles.fieldGrid}>
                <Field
                  label="Nome"
                  name="name"
                  value={form.name}
                  onChange={handleBasicChange}
                  required
                />
                <SelectField
                  label="Classe"
                  value={form.classId}
                  onChange={handleClassChange}
                  options={classes.map((item) => ({
                    value: item.id,
                    label: `${item.name}${item.isTaken ? " (ocupada)" : ""}`,
                    disabled: item.isTaken,
                  }))}
                />
                <Field
                  label="Idade"
                  name="age"
                  value={form.age}
                  onChange={handleBasicChange}
                  type="number"
                />
                <Field
                  label="Altura (cm)"
                  name="heightCm"
                  value={form.heightCm}
                  onChange={handleBasicChange}
                  type="number"
                />
                <Field
                  label="Peso (kg)"
                  name="weightKg"
                  value={form.weightKg}
                  onChange={handleBasicChange}
                  type="number"
                />
                <Field
                  label="Fôlego base"
                  name="staminaBase"
                  value={form.staminaBase}
                  onChange={handleBasicChange}
                  type="number"
                />
                <Field
                  label="Fôlego atual"
                  name="staminaCurrent"
                  value={form.staminaCurrent}
                  onChange={handleBasicChange}
                  type="number"
                />
              </div>

              <div style={{ marginTop: 18 }}>
                <label htmlFor="character-notes" style={styles.textareaLabel}>Notas</label>
                <textarea
                  id="character-notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleBasicChange}
                  rows={5}
                  style={styles.textarea}
                  placeholder="Observações extras do personagem..."
                />
              </div>
            </Card>

            <Card
              title="Traços especiais"
              subtitle="Gênio e Prodígio são exclusivos. Ambidestria é independente."
            >
              <div className="ui-grid" style={styles.traitsGrid}>
                <TraitButton
                  title="Prodígio"
                  description="+6 pontos em atributos. Exclusivo com Gênio."
                  active={form.specialTrait === "prodigio"}
                  onClick={() => handleTraitChange("prodigio")}
                  accent="green"
                />
                <TraitButton
                  title="Gênio"
                  description="+6 pontos em perícias. Exclusivo com Prodígio."
                  active={form.specialTrait === "genio"}
                  onClick={() => handleTraitChange("genio")}
                  accent="blue"
                />
                <TraitButton
                  title="Ambidestria"
                  description="+6 em chute, pontaria, passe, drible e domínio."
                  active={form.isAmbidextrous}
                  onClick={toggleAmbidexterity}
                  accent="purple"
                />
              </div>
            </Card>

            {selectedClassData ? (
              <Card
                title={`Classe: ${selectedClassData.name}`}
                subtitle={selectedClassData.description || "Sem descrição cadastrada."}
              >
                <div style={styles.classHeaderRow}>
                  <div style={styles.inlineInfoBox}>
                    <span style={styles.inlineInfoLabel}>Habilidade inicial</span>
                    <select
                      value={form.selectedAbility}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          selectedAbility: e.target.value,
                        }))
                      }
                      style={styles.select}
                    >
                      <option value="">
                        {uniqueSelectedClassAbilities.length
                          ? "Selecione"
                          : "Nenhuma habilidade disponível"}
                      </option>
                      {uniqueSelectedClassAbilities.map((ability) => (
                        <option key={ability.id} value={ability.name}>
                          {ability.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAbilityData ? (
                  <div style={styles.abilityCard}>
                    <div style={styles.abilityIcon}>✦</div>
                    <div>
                      <h4 style={styles.abilityTitle}>{selectedAbilityData.name}</h4>
                      <p style={styles.abilityDescription}>
                        {selectedClassData?.abilities?.find(
                          (item) =>
                            (typeof item === "string"
                              ? item
                              : item?.name) === selectedAbilityData.name
                        )?.description || "Sem descrição."}
                      </p>
                    </div>
                  </div>
                ) : null}

                {isCustomAttributeClass ? (
                  <div style={styles.specialClassBox}>
                    <h4 style={styles.specialClassTitle}>Atributos da classe</h4>
                    <p style={styles.specialClassText}>
                      Distribua {customAttributePool} pontos. Máximo de{" "}
                      {customAttributeMaxPerStat} por atributo.
                    </p>
                    <p style={styles.specialClassText}>
                      Pontos usados: {customClassAttributeSpent} / {customAttributePool}
                    </p>

                    <div className="ui-grid" style={styles.customAdjustGrid}>
                      {Object.keys(EMPTY_ATTRIBUTES).map((key) => (
                        <div key={key} style={styles.customAdjustCard}>
                          <strong style={styles.customAdjustTitle}>
                            {attributeLabels[key]}
                          </strong>

                          <div style={styles.customAdjustActions}>
                            <button
                              type="button"
                              onClick={() => decrementCustomClassAttribute(key)}
                              style={styles.customAdjustButton}
                            >
                              −
                            </button>

                            <div style={styles.customAdjustValue}>
                              {customClassAttributes[key] ?? 0}
                            </div>

                            <button
                              type="button"
                              onClick={() => incrementCustomClassAttribute(key)}
                              style={styles.customAdjustButtonPrimary}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isCustomSkillClass ? (
                  <div style={{ ...styles.specialClassBox, marginTop: 18 }}>
                    <h4 style={styles.specialClassTitle}>Perícias da classe</h4>
                    <p style={styles.specialClassText}>
                      Escolha {customSkillPickCount} perícias. Cada uma recebe +{customSkillPickBonus}.
                    </p>
                    <p style={styles.specialClassText}>
                      Escolhidas: {customClassSkills.length} / {customSkillPickCount}
                    </p>

                    <div className="ui-grid" style={styles.customSkillPickGrid}>
                      {Object.keys(EMPTY_SKILLS).map((key) => {
                        const selected = customClassSkills.includes(key);

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleCustomClassSkill(key)}
                            style={{
                              ...styles.customSkillPickButton,
                              ...(selected ? styles.customSkillPickButtonActive : {}),
                            }}
                          >
                            {skillLabels[key]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}

            <Card
              title="Atributos"
              subtitle={`Distribua exatamente ${attributeTotal} pontos`}
              rightSlot={
                <ProgressPill
                  current={attributePointsSpent}
                  total={attributeTotal}
                  ok={attributePointsSpent === attributeTotal}
                />
              }
            >
              <div className="ui-grid" style={styles.attributesGrid}>
                {Object.keys(EMPTY_ATTRIBUTES).map((key) => (
                  <AttributeInputCard
                    key={key}
                    attributeKey={key}
                    label={attributeLabels[key]}
                    classValue={classAttributes[key] ?? 0}
                    freeValue={form.allocatedAttributes[key] ?? 0}
                    totalValue={finalAttributes[key] ?? 0}
                    onChange={handleAttributeChange}
                  />
                ))}
              </div>
            </Card>

            <Card
              title="Perícias"
              subtitle={`Distribua exatamente ${skillTotal} pontos`}
              rightSlot={
                <ProgressPill
                  current={skillPointsSpent}
                  total={skillTotal}
                  ok={skillPointsSpent === skillTotal}
                />
              }
            >
              <div style={styles.skillsSections}>
                {skillGroups.map((group) => (
                  <div key={group.title} style={styles.skillSection}>
                    <div style={styles.skillSectionHeader}>
                      <h3 style={styles.skillSectionTitle}>{group.title}</h3>
                    </div>

                    <div className="ui-grid" style={styles.skillGrid}>
                      {group.keys.map((key) => (
                        <SkillInputCard
                          key={key}
                          skillKey={key}
                          label={skillLabels[key]}
                          classValue={classSkills[key] ?? 0}
                          freeValue={form.allocatedSkills[key] ?? 0}
                          passiveValue={passiveBonuses[key] ?? 0}
                          heightValue={heightModifiers[key] ?? 0}
                          weightValue={weightModifiers[key] ?? 0}
                          ambidexterityValue={ambidexterityModifiers[key] ?? 0}
                          totalValue={finalSkillsPreview[key] ?? 0}
                          onChange={handleSkillChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {error ? <div style={styles.errorBox}>{error}</div> : null}
            {success ? <div style={styles.successBox}>{success}</div> : null}

            <button className="ui-submit ui-interactive" type="submit" style={styles.submitButton} disabled={saving}>
              {saving ? "Criando ficha..." : "Criar Ficha"}
            </button>
          </div>

          <div className="ui-sticky-column" style={styles.rightColumn}>
            <Card
              title="Resumo visual"
              subtitle="Prévia do resultado final da ficha"
            >
              <div style={styles.previewHero}>
                <div>
                  <p style={styles.previewClass}>
                    {selectedClassData ? selectedClassData.name : "Nenhuma classe selecionada"}
                  </p>
                  <h2 style={styles.previewName}>{form.name || "Seu personagem"}</h2>
                  <p style={styles.previewMeta}>
                    {form.age || "-"} anos • {form.heightCm || "-"} cm • {form.weightKg || "-"} kg
                  </p>
                </div>

                <div style={styles.previewSealStack}>
                  {form.specialTrait === "genio" ? <Seal label="Gênio" accent="blue" /> : null}
                  {form.specialTrait === "prodigio" ? <Seal label="Prodígio" accent="green" /> : null}
                  {form.isAmbidextrous ? <Seal label="Ambidestria" accent="purple" /> : null}
                </div>
              </div>

              <div className="ui-grid" style={styles.previewStatGrid}>
                <MiniStat title="Fôlego Base" value={form.staminaBase || "-"} />
                <MiniStat
                  title="Habilidade"
                  value={form.selectedAbility || "Não definida"}
                  small
                />
              </div>
            </Card>

            <PreviewStatsCard
              title="Atributos finais"
              data={finalAttributes}
              labels={attributeLabels}
            />

            <PreviewStatsCard
              title="Perícias finais"
              data={finalSkillsPreview}
              labels={skillLabels}
            />

            <Card
              title="Modificadores ativos"
              subtitle="O que está impactando a prévia agora"
            >
              <ModifierPreviewBlock title="Altura" data={heightModifiers} labels={skillLabels} />
              <ModifierPreviewBlock title="Peso" data={weightModifiers} labels={skillLabels} />
              <ModifierPreviewBlock
                title="Ambidestria"
                data={ambidexterityModifiers}
                labels={skillLabels}
              />
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}

function Card({ title, subtitle, rightSlot, children }) {
  return (
    <section className="ui-card" style={styles.card}>
      <div className="ui-card-header" style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>{title}</h2>
          {subtitle ? <p style={styles.cardSubtitle}>{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div style={styles.fieldWrapper}>
      <label htmlFor={name} style={styles.fieldLabel}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        style={styles.input}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={styles.fieldWrapper}>
      <label htmlFor="classId" style={styles.fieldLabel}>{label}</label>
      <select id="classId" value={value} onChange={onChange} style={styles.select}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TraitButton({ title, description, active, onClick, accent }) {
  const accentMap = {
    blue: {
      border: "rgba(59,130,246,0.6)",
      glow: "rgba(59,130,246,0.18)",
      badge: "#60a5fa",
    },
    green: {
      border: "rgba(16,185,129,0.6)",
      glow: "rgba(16,185,129,0.18)",
      badge: "#34d399",
    },
    purple: {
      border: "rgba(168,85,247,0.6)",
      glow: "rgba(168,85,247,0.18)",
      badge: "#c084fc",
    },
  };

  const current = accentMap[accent] || accentMap.blue;

  return (
    <button
      className="ui-interactive"
      type="button"
      onClick={onClick}
      style={{
        ...styles.traitButton,
        borderColor: active ? current.border : "rgba(255,255,255,0.08)",
        boxShadow: active ? `0 0 0 1px ${current.border}, 0 18px 32px ${current.glow}` : "none",
        background: active
          ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))"
          : "rgba(255,255,255,0.02)",
      }}
    >
      <div style={styles.traitTopRow}>
        <span style={{ ...styles.traitDot, background: current.badge }} />
        <span style={styles.traitTitle}>{title}</span>
        <span
          style={{
            ...styles.traitStatus,
            color: active ? "#e2e8f0" : "#94a3b8",
            borderColor: active ? current.border : "rgba(255,255,255,0.08)",
          }}
        >
          {active ? "Ativo" : "Inativo"}
        </span>
      </div>

      <p style={styles.traitDescription}>{description}</p>
    </button>
  );
}

const AttributeInputCard = memo(function AttributeInputCard({
  attributeKey,
  label,
  classValue,
  freeValue,
  totalValue,
  onChange,
}) {
  return (
    <div style={styles.valueCard}>
      <div style={styles.valueCardTop}>
        <div>
          <h3 style={styles.valueCardTitle}>{label}</h3>
          <p style={styles.valueCardMeta}>
            Classe {formatModifier(classValue)} • Livre {formatModifier(freeValue)}
          </p>
        </div>

        <div style={styles.totalBadge}>{totalValue}</div>
      </div>

      <input
        type="number"
        min={0}
        value={freeValue}
        onChange={(e) => onChange(attributeKey, e.target.value)}
        style={styles.numberInput}
        aria-label={`Pontos livres de ${label}`}
      />
    </div>
  );
});

const SkillInputCard = memo(function SkillInputCard({
  skillKey,
  label,
  classValue,
  freeValue,
  passiveValue,
  heightValue,
  weightValue,
  ambidexterityValue,
  totalValue,
  onChange,
}) {
  const visibleModifiers = [
    ["Classe", classValue],
    ["Livre", freeValue],
    ["Atributos", passiveValue],
    ["Altura", heightValue],
    ["Peso", weightValue],
    ["Ambidestria", ambidexterityValue],
  ].filter(([, value]) => Number(value || 0) !== 0);

  return (
    <div style={styles.skillCard}>
      <div style={styles.skillCardHead}>
        <div>
          <h4 style={styles.skillCardTitle}>{label}</h4>
          {visibleModifiers.length ? (
            <div style={styles.modifierRow}>
              {visibleModifiers.map(([source, value]) => (
                <SmallModifier
                  key={source}
                  text={`${source} ${formatModifier(value)}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div style={styles.totalBadge}>{totalValue}</div>
      </div>

      <input
        type="number"
        min={0}
        value={freeValue}
        onChange={(e) => onChange(skillKey, e.target.value)}
        style={styles.smallNumberInput}
        aria-label={`Pontos livres de ${label}`}
      />
    </div>
  );
});

function SmallModifier({ text }) {
  return <span style={styles.smallModifier}>{text}</span>;
}

function ProgressPill({ current, total, ok }) {
  return (
    <div
      style={{
        ...styles.progressPill,
        borderColor: ok ? "rgba(16,185,129,0.45)" : "rgba(59,130,246,0.25)",
        color: ok ? "#d1fae5" : "#dbeafe",
      }}
    >
      {current}/{total}
    </div>
  );
}

function PreviewStatsCard({ title, data, labels }) {
  const entries = Object.entries(data || {}).filter(
    ([, value]) => Number(value || 0) !== 0
  );

  return (
    <Card title={title}>
      {entries.length === 0 ? (
        <p style={styles.emptyText}>Nenhum valor relevante para mostrar.</p>
      ) : (
        <div style={styles.previewList}>
          {entries
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .map(([key, value]) => (
              <div key={key} style={styles.previewRow}>
                <span style={styles.previewRowLabel}>{labels?.[key] || key}</span>
                <strong style={styles.previewRowValue}>{value}</strong>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

function ModifierPreviewBlock({ title, data, labels }) {
  const entries = Object.entries(data || {}).filter(
    ([, value]) => Number(value || 0) !== 0
  );

  return (
    <div style={styles.modifierBlock}>
      <h4 style={styles.modifierBlockTitle}>{title}</h4>
      {entries.length === 0 ? (
        <p style={styles.emptyText}>Sem efeito ativo.</p>
      ) : (
        <div style={styles.modifierBlockList}>
          {entries.map(([key, value]) => (
            <div key={key} style={styles.previewRow}>
              <span style={styles.previewRowLabel}>{labels?.[key] || key}</span>
              <strong style={styles.previewRowValue}>{formatModifier(value)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ title, value, small = false }) {
  return (
    <div style={styles.miniStat}>
      <span style={styles.miniStatTitle}>{title}</span>
      <strong style={{ ...styles.miniStatValue, fontSize: small ? 15 : 24 }}>{value}</strong>
    </div>
  );
}

function Seal({ label, accent = "blue" }) {
  const accents = {
    blue: {
      bg: "rgba(37,99,235,0.16)",
      border: "rgba(96,165,250,0.35)",
      color: "#bfdbfe",
    },
    green: {
      bg: "rgba(5,150,105,0.16)",
      border: "rgba(52,211,153,0.35)",
      color: "#bbf7d0",
    },
    purple: {
      bg: "rgba(124,58,237,0.16)",
      border: "rgba(192,132,252,0.35)",
      color: "#e9d5ff",
    },
  };

  const current = accents[accent] || accents.blue;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${current.border}`,
        background: current.bg,
        color: current.color,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      ✦ {label}
    </span>
  );
}
