"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  {
    title: "Potência",
    keys: ["corpoACorpo", "cabecio", "chute"],
  },
  {
    title: "Técnica",
    keys: ["pontaria", "dominio", "passe", "drible", "rouboDeBola"],
  },
  {
    title: "Agilidade",
    keys: ["acrobacias", "defesa", "reflexos", "furtividade"],
  },
  {
    title: "Velocidade",
    keys: ["corridaLongaDistancia", "explosao", "ritmoDeJogo"],
  },
  {
    title: "Ego",
    keys: ["intuicao", "intimidacao", "presenca", "lideranca", "enganacao"],
  },
];

function sumValues(obj) {
  return Object.values(obj || {}).reduce((acc, value) => acc + Number(value || 0), 0);
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
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesRes, configRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/game-config"),
        ]);

        const classesData = await classesRes.json();
        const configData = await configRes.json();

        if (classesRes.ok) setClasses(classesData);
        if (configRes.ok) setConfig(configData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const selectedClassData = useMemo(() => {
    return classes.find((item) => String(item.id) === String(form.classId)) || null;
  }, [classes, form.classId]);

  const classAttributes = useMemo(() => {
    return { ...EMPTY_ATTRIBUTES, ...(selectedClassData?.attributeBonuses ?? {}) };
  }, [selectedClassData]);

  const classSkills = useMemo(() => {
    return { ...EMPTY_SKILLS, ...(selectedClassData?.skillBonuses ?? {}) };
  }, [selectedClassData]);

  const finalAttributes = useMemo(() => {
    return mergeNumberObjects(classAttributes, form.allocatedAttributes);
  }, [classAttributes, form.allocatedAttributes]);

  const passiveBonuses = useMemo(() => {
    return getPassiveSkillBonusesFromAttributes(finalAttributes);
  }, [finalAttributes]);

  const finalSkillsPreview = useMemo(() => {
    return mergeNumberObjects(classSkills, form.allocatedSkills, passiveBonuses);
  }, [classSkills, form.allocatedSkills, passiveBonuses]);

  const attributePointsSpent = useMemo(() => sumValues(form.allocatedAttributes), [form.allocatedAttributes]);
  const skillPointsSpent = useMemo(() => sumValues(form.allocatedSkills), [form.allocatedSkills]);

  const attributeTotal = config?.attributePointsAtCreation ?? 7;
  const skillTotal = config?.skillPointsAtCreation ?? 15;
  const attributeMax = config?.attributeMaxAtCreation ?? 5;
  const skillMax = config?.skillMaxAtCreation ?? 10;

  const selectedAbilityData = useMemo(() => {
    return (selectedClassData?.abilities || []).find(
      (ability) => ability.name === form.selectedAbility
    ) || null;
  }, [selectedClassData, form.selectedAbility]);

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

  function handleAttributeChange(key, rawValue) {
    const nextValue = Math.max(0, Math.min(Number(rawValue || 0), attributeMax));
    const previous = Number(form.allocatedAttributes[key] || 0);
    const nextSpent = attributePointsSpent - previous + nextValue;

    if (nextSpent > attributeTotal) return;

    setForm((prev) => ({
      ...prev,
      allocatedAttributes: {
        ...prev.allocatedAttributes,
        [key]: nextValue,
      },
    }));
  }

  function handleSkillChange(key, rawValue) {
    const nextValue = Math.max(0, Math.min(Number(rawValue || 0), skillMax));
    const previous = Number(form.allocatedSkills[key] || 0);
    const nextSpent = skillPointsSpent - previous + nextValue;

    if (nextSpent > skillTotal) return;

    setForm((prev) => ({
      ...prev,
      allocatedSkills: {
        ...prev.allocatedSkills,
        [key]: nextValue,
      },
    }));
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

      setTimeout(() => {
        router.push(`/characters/${data.id}`);
      }, 700);
    } catch (err) {
      setError("Erro inesperado ao criar ficha");
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando criação de ficha...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topBar}>
          <Link href="/" style={styles.topButton}>
            ← Voltar
          </Link>

          <div style={styles.topActions}>
            <Link href="/" style={styles.secondaryButton}>
              Home
            </Link>
          </div>
        </header>

        <div style={styles.layout}>
          <section style={styles.mainColumn}>
            <div style={styles.heroCard}>
              <div>
                <p style={styles.heroTag}>Nova ficha</p>
                <h1 style={styles.heroTitle}>Criar Personagem</h1>
                <p style={styles.heroSubtitle}>
                  Escolha a classe, distribua seus pontos e defina sua habilidade inicial.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <Card title="Dados Básicos" subtitle="Informações principais do personagem">
                <div style={styles.gridTwo}>
                  <Field
                    label="Nome"
                    name="name"
                    value={form.name}
                    onChange={handleBasicChange}
                    required
                  />

                  <div style={styles.field}>
                    <label htmlFor="classId">Classe</label>
                    <select
                      id="classId"
                      name="classId"
                      value={form.classId}
                      onChange={handleClassChange}
                      style={styles.input}
                      required
                    >
                      <option value="">Selecione uma classe</option>
                      {classes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field label="Idade" name="age" type="number" value={form.age} onChange={handleBasicChange} />
                  <Field label="Altura (cm)" name="heightCm" type="number" value={form.heightCm} onChange={handleBasicChange} />
                  <Field label="Peso (kg)" name="weightKg" type="number" value={form.weightKg} onChange={handleBasicChange} />
                  <Field label="Fôlego Base" name="staminaBase" type="number" value={form.staminaBase} onChange={handleBasicChange} />
                  <Field label="Fôlego Atual" name="staminaCurrent" type="number" value={form.staminaCurrent} onChange={handleBasicChange} />
                </div>
              </Card>

              {selectedClassData ? (
                <Card title="Classe Escolhida" subtitle="Bônus automáticos e habilidade inicial">
                  <div style={styles.classHeader}>
                    <div>
                      <h3 style={styles.className}>{selectedClassData.name}</h3>
                      <p style={styles.classDescription}>
                        {selectedClassData.description || "Sem descrição cadastrada."}
                      </p>
                    </div>
                  </div>

                  <div style={styles.previewGrid}>
                    <PreviewStatsCard
                      title="Atributos da classe"
                      data={classAttributes}
                      labels={attributeLabels}
                    />
                    <PreviewStatsCard
                      title="Perícias da classe"
                      data={classSkills}
                      labels={skillLabels}
                    />
                  </div>

                  <div style={styles.field}>
                    <label htmlFor="selectedAbility">Habilidade inicial</label>
                    <select
                      id="selectedAbility"
                      name="selectedAbility"
                      value={form.selectedAbility}
                      onChange={handleBasicChange}
                      style={styles.input}
                      required
                    >
                      <option value="">Selecione uma habilidade</option>
                      {(selectedClassData.abilities || []).map((ability) => (
                        <option key={ability.name} value={ability.name}>
                          {ability.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAbilityData ? (
                    <div style={styles.abilityCard}>
                      <div style={styles.abilityTop}>
                        <h4 style={styles.abilityName}>{selectedAbilityData.name}</h4>
                        <div style={styles.abilityBadges}>
                          {selectedAbilityData.type ? (
                            <span style={styles.badgeMuted}>{selectedAbilityData.type}</span>
                          ) : null}
                          {selectedAbilityData.cost !== undefined && selectedAbilityData.cost !== null ? (
                            <span style={styles.badgeBlue}>Custo {selectedAbilityData.cost}</span>
                          ) : null}
                          {selectedAbilityData.duration ? (
                            <span style={styles.badgeMuted}>{selectedAbilityData.duration}</span>
                          ) : null}
                        </div>
                      </div>

                      <p style={styles.abilityDescription}>
                        {selectedAbilityData.description || "Sem descrição."}
                      </p>
                    </div>
                  ) : null}
                </Card>
              ) : null}

              <Card
                title="Atributos Livres"
                subtitle={`Distribua ${attributeTotal} pontos. Máximo de ${attributeMax} por atributo.`}
              >
                <div style={styles.progressBox}>
                  <span>Pontos gastos</span>
                  <strong>
                    {attributePointsSpent}/{attributeTotal}
                  </strong>
                </div>

                <div style={styles.attributesGrid}>
                  {Object.keys(EMPTY_ATTRIBUTES).map((key) => (
                    <AttributeInputCard
                      key={key}
                      label={attributeLabels[key]}
                      classValue={classAttributes[key] || 0}
                      freeValue={form.allocatedAttributes[key] || 0}
                      totalValue={finalAttributes[key] || 0}
                      max={attributeMax}
                      onChange={(value) => handleAttributeChange(key, value)}
                    />
                  ))}
                </div>
              </Card>

              <Card
                title="Perícias Livres"
                subtitle={`Distribua ${skillTotal} pontos. Máximo de ${skillMax} por perícia.`}
              >
                <div style={styles.progressBox}>
                  <span>Pontos gastos</span>
                  <strong>
                    {skillPointsSpent}/{skillTotal}
                  </strong>
                </div>

                <div style={styles.skillSections}>
                  {skillGroups.map((group) => (
                    <div key={group.title} style={styles.skillGroupCard}>
                      <h3 style={styles.skillGroupTitle}>{group.title}</h3>

                      <div style={styles.skillList}>
                        {group.keys.map((key) => (
                          <SkillInputCard
                            key={key}
                            label={skillLabels[key]}
                            classValue={classSkills[key] || 0}
                            freeValue={form.allocatedSkills[key] || 0}
                            passiveValue={passiveBonuses[key] || 0}
                            totalValue={finalSkillsPreview[key] || 0}
                            max={skillMax}
                            onChange={(value) => handleSkillChange(key, value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {error ? <p style={styles.error}>{error}</p> : null}
              {success ? <p style={styles.success}>{success}</p> : null}

              <button type="submit" style={styles.submitButton} disabled={saving}>
                {saving ? "Criando ficha..." : "Criar Ficha"}
              </button>
            </form>
          </section>

          <aside style={styles.sidebar}>
            <div style={styles.sidebarCard}>
              <p style={styles.sidebarTag}>Resumo</p>
              <h3 style={styles.sidebarTitle}>{form.name || "Seu personagem"}</h3>
              <p style={styles.sidebarSubtitle}>
                {selectedClassData ? selectedClassData.name : "Nenhuma classe selecionada"}
              </p>

              <div style={styles.sidebarStats}>
                <SidebarMetric
                  label="Atributos livres"
                  value={`${attributePointsSpent}/${attributeTotal}`}
                />
                <SidebarMetric
                  label="Perícias livres"
                  value={`${skillPointsSpent}/${skillTotal}`}
                />
                <SidebarMetric
                  label="Habilidade"
                  value={form.selectedAbility || "-"}
                />
              </div>
            </div>

            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarSectionTitle}>Atributos finais</h3>
              <div style={styles.compactList}>
                {Object.entries(finalAttributes).map(([key, value]) => (
                  <CompactRow
                    key={key}
                    label={attributeLabels[key]}
                    value={value}
                  />
                ))}
              </div>
            </div>

            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarSectionTitle}>Perícias em destaque</h3>
              <div style={styles.compactList}>
                {Object.entries(finalSkillsPreview)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .slice(0, 5)
                  .map(([key, value]) => (
                    <CompactRow
                      key={key}
                      label={skillLabels[key]}
                      value={value}
                    />
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>{title}</h2>
        {subtitle ? <p style={styles.cardSubtitle}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <div style={styles.field}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        style={styles.input}
        required={required}
      />
    </div>
  );
}

function AttributeInputCard({ label, classValue, freeValue, totalValue, max, onChange }) {
  return (
    <div style={styles.attributeCard}>
      <div>
        <div style={styles.attributeName}>{label}</div>
        <div style={styles.attributeMeta}>
          Classe {formatModifier(classValue)} • Livre {formatModifier(freeValue)}
        </div>
      </div>

      <div style={styles.attributeBottom}>
        <input
          type="number"
          min={0}
          max={max}
          value={freeValue}
          onChange={(e) => onChange(e.target.value)}
          style={styles.numberInput}
        />
        <div style={styles.attributeTotalPill}>{totalValue}</div>
      </div>
    </div>
  );
}

function SkillInputCard({ label, classValue, freeValue, passiveValue, totalValue, max, onChange }) {
  return (
    <div style={styles.skillRowCard}>
      <div style={styles.skillRowTop}>
        <div>
          <div style={styles.skillName}>{label}</div>
          <div style={styles.skillMeta}>
            Classe {formatModifier(classValue)} • Livre {formatModifier(freeValue)} • Atributos {formatModifier(passiveValue)}
          </div>
        </div>

        <div style={styles.skillRightSide}>
          <input
            type="number"
            min={0}
            max={max}
            value={freeValue}
            onChange={(e) => onChange(e.target.value)}
            style={styles.smallNumberInput}
          />
          <div style={styles.skillValueBadge}>{totalValue}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewStatsCard({ title, data, labels }) {
  const entries = Object.entries(data || {}).filter(([, value]) => Number(value || 0) !== 0);

  return (
    <div style={styles.previewCard}>
      <h4 style={styles.previewTitle}>{title}</h4>

      {entries.length === 0 ? (
        <p style={styles.previewEmpty}>Nenhum bônus cadastrado.</p>
      ) : (
        <div style={styles.previewList}>
          {entries.map(([key, value]) => (
            <div key={key} style={styles.previewRow}>
              <span>{labels[key] || key}</span>
              <strong>{formatModifier(value)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarMetric({ label, value }) {
  return (
    <div style={styles.sidebarMetric}>
      <span style={styles.sidebarMetricLabel}>{label}</span>
      <strong style={styles.sidebarMetricValue}>{value}</strong>
    </div>
  );
}

function CompactRow({ label, value }) {
  return (
    <div style={styles.compactRow}>
      <span style={styles.compactLabel}>{label}</span>
      <strong style={styles.compactValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), #0b1120",
    color: "#f8fafc",
    padding: "24px",
  },
  container: {
    width: "100%",
    maxWidth: "1380px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  loadingCard: {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "28px 36px",
    fontSize: "18px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.06)",
    color: "#f8fafc",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: "bold",
  },
  topActions: {
    display: "flex",
    gap: "12px",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "14px",
    fontWeight: "bold",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
    gap: "20px",
    alignItems: "start",
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "sticky",
    top: "24px",
  },
  heroCard: {
    background: "linear-gradient(135deg, #111827, #172033)",
    borderRadius: "24px",
    padding: "28px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  heroTag: {
    margin: 0,
    marginBottom: "8px",
    color: "#93c5fd",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroTitle: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#cbd5e1",
    fontSize: "17px",
    maxWidth: "720px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "#111827",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  cardHeader: {
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "28px",
  },
  cardSubtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#94a3b8",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  input: {
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#f8fafc",
    outline: "none",
    fontSize: "15px",
  },
  classHeader: {
    marginBottom: "18px",
  },
  className: {
    margin: 0,
    fontSize: "26px",
  },
  classDescription: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  previewCard: {
    background: "#0b1220",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  previewTitle: {
    margin: 0,
    marginBottom: "12px",
    fontSize: "18px",
    color: "#93c5fd",
  },
  previewEmpty: {
    color: "#94a3b8",
    margin: 0,
  },
  previewList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  previewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  abilityCard: {
    marginTop: "16px",
    background: "#0b1220",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  abilityTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  abilityName: {
    margin: 0,
    fontSize: "20px",
  },
  abilityBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  badgeMuted: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
  badgeBlue: {
    background: "rgba(37,99,235,0.18)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    color: "#93c5fd",
  },
  abilityDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  progressBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0b1220",
    borderRadius: "16px",
    padding: "14px 16px",
    marginBottom: "16px",
    color: "#cbd5e1",
  },
  attributesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  attributeCard: {
    background: "#0b1220",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  attributeName: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  attributeMeta: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  attributeBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  numberInput: {
    width: "88px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#f8fafc",
    outline: "none",
    fontSize: "16px",
  },
  attributeTotalPill: {
    minWidth: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
  },
  skillSections: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  skillGroupCard: {
    background: "#0b1220",
    borderRadius: "20px",
    padding: "18px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  skillGroupTitle: {
    margin: 0,
    marginBottom: "14px",
    fontSize: "20px",
    color: "#93c5fd",
  },
  skillList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  skillRowCard: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "12px",
  },
  skillRowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  skillName: {
    fontWeight: "bold",
    fontSize: "15px",
  },
  skillMeta: {
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  skillRightSide: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  smallNumberInput: {
    width: "72px",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#f8fafc",
    outline: "none",
    fontSize: "15px",
  },
  skillValueBadge: {
    minWidth: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    fontWeight: "bold",
  },
  sidebarCard: {
    background: "#111827",
    borderRadius: "22px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  sidebarTag: {
    margin: 0,
    marginBottom: "8px",
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: "26px",
  },
  sidebarSubtitle: {
    marginTop: "8px",
    color: "#cbd5e1",
    marginBottom: 0,
  },
  sidebarStats: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "18px",
  },
  sidebarMetric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0b1220",
    borderRadius: "14px",
    padding: "12px 14px",
  },
  sidebarMetricLabel: {
    color: "#94a3b8",
    fontSize: "13px",
  },
  sidebarMetricValue: {
    fontSize: "15px",
  },
  sidebarSectionTitle: {
    margin: 0,
    marginBottom: "14px",
    fontSize: "18px",
  },
  compactList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  compactRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0b1220",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  compactLabel: {
    color: "#cbd5e1",
    fontSize: "14px",
  },
  compactValue: {
    fontSize: "15px",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",
    background: "#059669",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "17px",
    cursor: "pointer",
  },
  error: {
    color: "#f87171",
    fontSize: "14px",
    margin: 0,
  },
  success: {
    color: "#34d399",
    fontSize: "14px",
    margin: 0,
  },
};