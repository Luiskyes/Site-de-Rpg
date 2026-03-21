"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

async function safeJson(response) {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toTextAreaLines(value) {
  if (!Array.isArray(value)) return "";
  return value.join("\n");
}

function fromTextAreaLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function MasterCharacterEditPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPoints, setSavingPoints] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pointsDelta, setPointsDelta] = useState("3");

  const [form, setForm] = useState({
    id: "",
    name: "",
    class: "",
    classId: "",
    selectedAbility: "",
    notes: "",
    age: "",
    heightCm: "",
    weightKg: "",
    staminaBase: "",
    staminaCurrent: "",
    specialTrait: "",
    isAmbidextrous: false,

    classAttributes: { ...EMPTY_ATTRIBUTES },
    allocatedAttributes: { ...EMPTY_ATTRIBUTES },
    levelUpAttributes: { ...EMPTY_ATTRIBUTES },

    classSkills: { ...EMPTY_SKILLS },
    allocatedSkills: { ...EMPTY_SKILLS },
    levelUpSkills: { ...EMPTY_SKILLS },

    progressPoints: 0,
    spentAttributeUpgrades: 0,
    spentSkillUpgrades: 0,
    boughtAbilitiesText: "",
    customAbilitiesText: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setError("");
        setSuccess("");

        const response = await fetch(`/api/master/characters/${id}`, {
          cache: "no-store",
          credentials: "include",
        });

        const data = await safeJson(response);

        if (!response.ok || !data) {
          setError(data?.detail || data?.error || "Erro ao carregar ficha do mestre.");
          return;
        }

        setForm({
          id: data.id ?? "",
          name: data.name ?? "",
          class: data.class ?? "",
          classId: data.classId ?? "",
          selectedAbility: data.selectedAbility ?? "",
          notes: data.notes ?? "",
          age: data.age ?? "",
          heightCm: data.heightCm ?? "",
          weightKg: data.weightKg ?? "",
          staminaBase: data.staminaBase ?? "",
          staminaCurrent: data.staminaCurrent ?? "",
          specialTrait: data.specialTrait ?? "",
          isAmbidextrous: Boolean(data.isAmbidextrous),

          classAttributes: { ...EMPTY_ATTRIBUTES, ...(data.classAttributes || {}) },
          allocatedAttributes: { ...EMPTY_ATTRIBUTES, ...(data.allocatedAttributes || {}) },
          levelUpAttributes: { ...EMPTY_ATTRIBUTES, ...(data.levelUpAttributes || {}) },

          classSkills: { ...EMPTY_SKILLS, ...(data.classSkills || {}) },
          allocatedSkills: { ...EMPTY_SKILLS, ...(data.allocatedSkills || {}) },
          levelUpSkills: { ...EMPTY_SKILLS, ...(data.levelUpSkills || {}) },

          progressPoints: Number(data.progressPoints || 0),
          spentAttributeUpgrades: Number(data.spentAttributeUpgrades || 0),
          spentSkillUpgrades: Number(data.spentSkillUpgrades || 0),
          boughtAbilitiesText: toTextAreaLines(data.boughtAbilities),
          customAbilitiesText: toTextAreaLines(data.customAbilities),
        });
      } catch (err) {
        console.error("MASTER CHARACTER PAGE LOAD ERROR:", err);
        setError("Erro inesperado ao carregar a ficha.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadData();
  }, [id]);

  function handleBasicChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleNestedChange(section, key, value) {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: Number(value || 0),
      },
    }));
  }

  const progressPreview = useMemo(() => {
    const existingAbilityCost = form.specialTrait === "prodigio" ? 3 : 5;
    const customAbilityCost = form.specialTrait === "genio" ? 3 : 5;

    const boughtAbilities = fromTextAreaLines(form.boughtAbilitiesText);
    const customAbilities = fromTextAreaLines(form.customAbilitiesText);

    const totalSpent =
      Number(form.spentAttributeUpgrades || 0) * 2 +
      Number(form.spentSkillUpgrades || 0) * 1 +
      boughtAbilities.length * existingAbilityCost +
      customAbilities.length * customAbilityCost;

    const remaining = Number(form.progressPoints || 0) - totalSpent;
    const invalidSkillsRule =
      Number(form.spentSkillUpgrades || 0) > Number(form.spentAttributeUpgrades || 0);

    return {
      boughtAbilities,
      customAbilities,
      existingAbilityCost,
      customAbilityCost,
      totalSpent,
      remaining,
      invalidSkillsRule,
      invalid: remaining < 0 || invalidSkillsRule,
    };
  }, [form]);

  async function handleAddPoints() {
    try {
      setSavingPoints(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/master/characters/${id}/points`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount: Number(pointsDelta || 0),
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        setError(data?.detail || data?.error || "Erro ao alterar pontos.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        progressPoints: Number(data.progressPoints || 0),
      }));

      setSuccess("Pontos alterados com sucesso.");
    } catch (err) {
      console.error("MASTER POINTS ERROR:", err);
      setError("Erro inesperado ao alterar pontos.");
    } finally {
      setSavingPoints(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name,
        class: form.class,
        classId: form.classId === "" ? null : Number(form.classId),
        selectedAbility: form.selectedAbility,
        notes: form.notes,
        age: form.age === "" ? null : Number(form.age),
        heightCm: form.heightCm === "" ? null : Number(form.heightCm),
        weightKg: form.weightKg === "" ? null : Number(form.weightKg),
        staminaBase: form.staminaBase === "" ? null : Number(form.staminaBase),
        staminaCurrent: form.staminaCurrent === "" ? null : Number(form.staminaCurrent),
        specialTrait: form.specialTrait || null,
        isAmbidextrous: Boolean(form.isAmbidextrous),

        classAttributes: form.classAttributes,
        allocatedAttributes: form.allocatedAttributes,
        levelUpAttributes: form.levelUpAttributes,

        classSkills: form.classSkills,
        allocatedSkills: form.allocatedSkills,
        levelUpSkills: form.levelUpSkills,

        progressPoints: Number(form.progressPoints || 0),
        spentAttributeUpgrades: Number(form.spentAttributeUpgrades || 0),
        spentSkillUpgrades: Number(form.spentSkillUpgrades || 0),
        boughtAbilities: fromTextAreaLines(form.boughtAbilitiesText),
        customAbilities: fromTextAreaLines(form.customAbilitiesText),
      };

      const response = await fetch(`/api/master/characters/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        setError(data?.detail || data?.error || "Erro ao salvar ficha.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        heightCm: data.heightCm ?? "",
        weightKg: data.weightKg ?? "",
      }));

      setSuccess("Ficha salva com sucesso.");
    } catch (err) {
      console.error("MASTER CHARACTER SAVE ERROR:", err);
      setError("Erro inesperado ao salvar ficha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Carregando ficha...</div>
        </div>
      </div>
    );
  }

  if (error && !form.id) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Link href="/master" style={styles.backButton}>
            ← Voltar
          </Link>
          <div style={styles.errorBox}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link href="/master" style={styles.backButton}>
            ← Voltar
          </Link>
        </div>

        <section style={styles.heroCard}>
          <div>
            <p style={styles.heroTag}>Mestre • edição completa</p>
            <h1 style={styles.heroTitle}>{form.name || "Ficha"}</h1>
            <p style={styles.heroSubtitle}>
              Classe: {form.class || "-"} • ID: {form.id || "-"}
            </p>
          </div>

          <div style={styles.heroInfoBox}>
            <div>Pontos: <strong>{form.progressPoints}</strong></div>
            <div>Gasto: <strong>{progressPreview.totalSpent}</strong></div>
            <div>Restante: <strong>{progressPreview.remaining}</strong></div>
          </div>
        </section>

        <form onSubmit={handleSave} style={styles.grid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Dados principais</h2>

            <div style={styles.formGrid}>
              <Field label="Nome" name="name" value={form.name} onChange={handleBasicChange} />
              <Field label="Classe" name="class" value={form.class} onChange={handleBasicChange} />
              <Field label="Class ID" name="classId" type="number" value={form.classId} onChange={handleBasicChange} />
              <Field label="Habilidade inicial" name="selectedAbility" value={form.selectedAbility} onChange={handleBasicChange} />
              <Field label="Idade" name="age" type="number" value={form.age} onChange={handleBasicChange} />
              <Field label="Altura (150-200)" name="heightCm" type="number" value={form.heightCm} onChange={handleBasicChange} />
              <Field label="Peso (50-100)" name="weightKg" type="number" value={form.weightKg} onChange={handleBasicChange} />
              <Field label="Fôlego base" name="staminaBase" type="number" value={form.staminaBase} onChange={handleBasicChange} />
              <Field label="Fôlego atual" name="staminaCurrent" type="number" value={form.staminaCurrent} onChange={handleBasicChange} />
            </div>

            <div style={styles.traitRow}>
              <label style={styles.checkboxWrap}>
                <input
                  type="radio"
                  name="specialTrait"
                  value=""
                  checked={form.specialTrait === ""}
                  onChange={handleBasicChange}
                />
                Nenhum
              </label>

              <label style={styles.checkboxWrap}>
                <input
                  type="radio"
                  name="specialTrait"
                  value="genio"
                  checked={form.specialTrait === "genio"}
                  onChange={handleBasicChange}
                />
                Gênio
              </label>

              <label style={styles.checkboxWrap}>
                <input
                  type="radio"
                  name="specialTrait"
                  value="prodigio"
                  checked={form.specialTrait === "prodigio"}
                  onChange={handleBasicChange}
                />
                Prodígio
              </label>

              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  name="isAmbidextrous"
                  checked={form.isAmbidextrous}
                  onChange={handleBasicChange}
                />
                Ambidestria
              </label>
            </div>

            <label style={styles.label}>Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleBasicChange}
              rows={5}
              style={styles.textarea}
            />
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Progressão</h2>

            <div style={styles.pointsBar}>
              <input
                type="number"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={handleAddPoints}
                style={styles.secondaryButton}
                disabled={savingPoints}
              >
                {savingPoints ? "Alterando..." : "Alterar pontos"}
              </button>
            </div>

            <div style={styles.formGrid}>
              <Field
                label="Pontos totais"
                name="progressPoints"
                type="number"
                value={form.progressPoints}
                onChange={handleBasicChange}
              />
              <Field
                label="Atributos comprados"
                name="spentAttributeUpgrades"
                type="number"
                value={form.spentAttributeUpgrades}
                onChange={handleBasicChange}
              />
              <Field
                label="Perícias compradas"
                name="spentSkillUpgrades"
                type="number"
                value={form.spentSkillUpgrades}
                onChange={handleBasicChange}
              />
            </div>

            <div style={styles.infoBox}>
              <div>Custo atributo: <strong>2</strong></div>
              <div>Custo perícia: <strong>1</strong></div>
              <div>Comprar habilidade: <strong>{progressPreview.existingAbilityCost}</strong></div>
              <div>Criar habilidade: <strong>{progressPreview.customAbilityCost}</strong></div>
            </div>

            <label style={styles.label}>Habilidades compradas existentes (1 por linha)</label>
            <textarea
              value={form.boughtAbilitiesText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, boughtAbilitiesText: e.target.value }))
              }
              rows={5}
              style={styles.textarea}
            />

            <label style={styles.label}>Habilidades criadas/custom (1 por linha)</label>
            <textarea
              value={form.customAbilitiesText}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customAbilitiesText: e.target.value }))
              }
              rows={5}
              style={styles.textarea}
            />

            <div style={styles.infoBox}>
              <div>Gasto total: <strong>{progressPreview.totalSpent}</strong></div>
              <div>Restante: <strong>{progressPreview.remaining}</strong></div>
              <div>
                Regra perícia/atributo:{" "}
                <strong>
                  {progressPreview.invalidSkillsRule ? "Inválida" : "OK"}
                </strong>
              </div>
            </div>
          </section>

          <StatSection
            title="Atributos de classe"
            values={form.classAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("classAttributes", key, value)}
          />

          <StatSection
            title="Atributos base do jogador"
            values={form.allocatedAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("allocatedAttributes", key, value)}
          />

          <StatSection
            title="Atributos de progressão"
            values={form.levelUpAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("levelUpAttributes", key, value)}
          />

          <StatSection
            title="Perícias de classe"
            values={form.classSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("classSkills", key, value)}
          />

          <StatSection
            title="Perícias base do jogador"
            values={form.allocatedSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("allocatedSkills", key, value)}
          />

          <StatSection
            title="Perícias de progressão"
            values={form.levelUpSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("levelUpSkills", key, value)}
          />

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          {success ? <div style={styles.successBox}>{success}</div> : null}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={saving || progressPreview.invalid}
          >
            {saving ? "Salvando..." : "Salvar ficha"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type = "text", ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input type={type} {...props} style={styles.input} />
    </div>
  );
}

function StatSection({ title, values, labels, onChange }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      <div style={styles.statGrid}>
        {Object.keys(values || {}).map((key) => (
          <div key={key} style={styles.field}>
            <label style={styles.label}>{labels[key] || key}</label>
            <input
              type="number"
              value={values[key]}
              onChange={(e) => onChange(key, e.target.value)}
              style={styles.input}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#060c18",
    color: "#f8fafc",
    padding: 24,
  },
  container: {
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-start",
  },
  backButton: {
    textDecoration: "none",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    width: "fit-content",
  },
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    padding: 28,
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.88))",
  },
  heroTag: {
    margin: 0,
    color: "#93c5fd",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  heroTitle: {
    margin: "10px 0 0",
    fontSize: 40,
  },
  heroSubtitle: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    fontSize: 16,
  },
  heroInfoBox: {
    minWidth: 240,
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "rgba(15,23,42,0.88)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 22,
  },
  cardTitle: {
    margin: "0 0 16px",
    fontSize: 24,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
  },
  textarea: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    resize: "vertical",
    marginTop: 8,
  },
  traitRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 16,
  },
  checkboxWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#e2e8f0",
  },
  pointsBar: {
    display: "grid",
    gridTemplateColumns: "160px 220px",
    gap: 12,
    marginBottom: 18,
  },
  infoBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  primaryButton: {
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    padding: "16px 18px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "16px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(248,113,113,0.28)",
    color: "#fecaca",
    borderRadius: 18,
    padding: 16,
    fontWeight: 600,
  },
  successBox: {
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    color: "#bbf7d0",
    borderRadius: 18,
    padding: 16,
    fontWeight: 600,
  },
  loadingCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0f172a",
    padding: "24px 30px",
    fontSize: 18,
  },
};