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
  const [deleting, setDeleting] = useState(false);
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
        id: data.id ?? prev.id,
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

  async function handleDelete() {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a ficha "${form.name || "Sem nome"}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/master/characters/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        setError(data?.detail || data?.error || "Erro ao excluir ficha.");
        return;
      }

      alert("Ficha excluída com sucesso.");
      window.location.href = "/master";
    } catch (err) {
      console.error("MASTER CHARACTER DELETE ERROR:", err);
      setError("Erro inesperado ao excluir ficha.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando ficha...</div>
      </div>
    );
  }

  if (error && !form.id) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.errorCard}>
          <Link href="/master" style={styles.backButton}>
            ← Voltar
          </Link>
          <p style={{ marginTop: 16, color: "#fecaca" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgOrbTop} />
      <div style={styles.bgOrbBottom} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <Link href="/master" style={styles.backButton}>
            ← Voltar
          </Link>
        </div>

        <section style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroEyebrow}>Mestre • edição completa</p>
            <h1 style={styles.heroTitle}># {form.name || "Ficha"}</h1>
            <p style={styles.heroSubtitle}>
              Classe: {form.class || "-"} • ID: {form.id || "-"}
            </p>
          </div>

          <div style={styles.heroStats}>
            <InfoBadge label="Pontos" value={form.progressPoints} />
            <InfoBadge label="Gasto" value={progressPreview.totalSpent} />
            <InfoBadge label="Restante" value={progressPreview.remaining} />
          </div>
        </section>

        <form onSubmit={handleSave} style={styles.formWrap}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Dados principais</h2>

            <div style={styles.grid2}>
              <Input
                label="Nome"
                name="name"
                value={form.name}
                onChange={handleBasicChange}
              />
              <Input
                label="Classe"
                name="class"
                value={form.class}
                onChange={handleBasicChange}
              />
              <Input
                label="Class ID"
                name="classId"
                value={form.classId}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Habilidade inicial"
                name="selectedAbility"
                value={form.selectedAbility}
                onChange={handleBasicChange}
              />
              <Input
                label="Idade"
                name="age"
                value={form.age}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Altura (cm)"
                name="heightCm"
                value={form.heightCm}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Peso (kg)"
                name="weightKg"
                value={form.weightKg}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Fôlego base"
                name="staminaBase"
                value={form.staminaBase}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Fôlego atual"
                name="staminaCurrent"
                value={form.staminaCurrent}
                onChange={handleBasicChange}
                type="number"
              />
              <div style={styles.field}>
                <label style={styles.label}>Traço especial</label>
                <select
                  name="specialTrait"
                  value={form.specialTrait}
                  onChange={handleBasicChange}
                  style={styles.input}
                >
                  <option value="">Nenhum</option>
                  <option value="genio">Gênio</option>
                  <option value="prodigio">Prodígio</option>
                </select>
              </div>
            </div>

            <div style={styles.checkboxRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="isAmbidextrous"
                  checked={form.isAmbidextrous}
                  onChange={handleBasicChange}
                />
                Ambidestria
              </label>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Notas</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleBasicChange}
                style={styles.textarea}
                rows={5}
              />
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Pontos de progressão</h2>

            <div style={styles.pointsRow}>
              <Input
                label="Alterar pontos"
                name="pointsDelta"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                type="number"
              />

              <button
                type="button"
                onClick={handleAddPoints}
                disabled={savingPoints}
                style={styles.secondaryButton}
              >
                {savingPoints ? "Alterando..." : "Aplicar pontos"}
              </button>
            </div>

            <div style={styles.progressStats}>
              <InfoBadge label="Totais" value={form.progressPoints} />
              <InfoBadge label="Gastos" value={progressPreview.totalSpent} />
              <InfoBadge label="Restantes" value={progressPreview.remaining} />
            </div>

            {progressPreview.invalidSkillsRule ? (
              <div style={styles.errorBox}>
                As perícias gastas não podem ultrapassar os atributos gastos.
              </div>
            ) : null}
          </section>

          <StatsSection
            title="Atributos de classe"
            values={form.classAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("classAttributes", key, value)}
          />

          <StatsSection
            title="Atributos alocados"
            values={form.allocatedAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("allocatedAttributes", key, value)}
          />

          <StatsSection
            title="Atributos de progressão"
            values={form.levelUpAttributes}
            labels={attributeLabels}
            onChange={(key, value) => handleNestedChange("levelUpAttributes", key, value)}
          />

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Gastos manuais</h2>

            <div style={styles.grid2}>
              <Input
                label="Atributos gastos"
                name="spentAttributeUpgrades"
                value={form.spentAttributeUpgrades}
                onChange={handleBasicChange}
                type="number"
              />
              <Input
                label="Perícias gastas"
                name="spentSkillUpgrades"
                value={form.spentSkillUpgrades}
                onChange={handleBasicChange}
                type="number"
              />
            </div>
          </section>

          <StatsSection
            title="Perícias de classe"
            values={form.classSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("classSkills", key, value)}
            isSkills
          />

          <StatsSection
            title="Perícias alocadas"
            values={form.allocatedSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("allocatedSkills", key, value)}
            isSkills
          />

          <StatsSection
            title="Perícias de progressão"
            values={form.levelUpSkills}
            labels={skillLabels}
            onChange={(key, value) => handleNestedChange("levelUpSkills", key, value)}
            isSkills
          />

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Habilidades</h2>

            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Habilidades compradas (1 por linha)</label>
                <textarea
                  value={form.boughtAbilitiesText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      boughtAbilitiesText: e.target.value,
                    }))
                  }
                  style={styles.textarea}
                  rows={8}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Habilidades criadas (1 por linha)</label>
                <textarea
                  value={form.customAbilitiesText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customAbilitiesText: e.target.value,
                    }))
                  }
                  style={styles.textarea}
                  rows={8}
                />
              </div>
            </div>
          </section>

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          {success ? <div style={styles.successBox}>{success}</div> : null}

          <div style={styles.footerActions}>
            <button
              type="submit"
              disabled={saving || deleting}
              style={styles.primaryButton}
            >
              {saving ? "Salvando..." : "Salvar ficha"}
            </button>
          </div>

          <div style={styles.dangerZone}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              style={styles.deleteButton}
            >
              {deleting ? "Excluindo ficha..." : "Excluir ficha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input {...props} style={styles.input} />
    </div>
  );
}

function InfoBadge({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

function StatsSection({ title, values, labels, onChange }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      <div style={styles.statsGrid}>
        {Object.keys(values || {}).map((key) => (
          <div key={key} style={styles.statCard}>
            <label style={styles.label}>{labels[key] || key}</label>
            <input
              type="number"
              value={values[key] ?? 0}
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
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 28%), #060c18",
    color: "#f8fafc",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  bgOrbTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(37,99,235,0.15)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: -140,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.12)",
    filter: "blur(48px)",
    pointerEvents: "none",
  },
  container: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-start",
  },
  backButton: {
    color: "#cbd5e1",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    padding: 28,
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.88))",
    boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
    alignItems: "center",
  },
  heroEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  heroTitle: {
    margin: "10px 0 0",
    fontSize: 38,
    lineHeight: 1.05,
  },
  heroSubtitle: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    fontSize: 17,
  },
  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
    gap: 12,
    minWidth: 380,
  },
  formWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "rgba(15,23,42,0.88)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 22,
    boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: 24,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "12px 14px",
    outline: "none",
    fontSize: 15,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "12px 14px",
    outline: "none",
    fontSize: 15,
    resize: "vertical",
    boxSizing: "border-box",
  },
  checkboxRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "#e2e8f0",
    fontWeight: 600,
  },
  pointsRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 220px) 180px",
    gap: 16,
    alignItems: "end",
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    height: 48,
  },
  progressStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  statCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 14,
  },
  infoCard: {
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: {
    fontSize: 20,
    wordBreak: "break-word",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
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
  dangerZone: {
    marginTop: 4,
    display: "flex",
    justifyContent: "flex-end",
  },
  deleteButton: {
    border: "1px solid rgba(248,113,113,0.35)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.12)",
    color: "#fecaca",
    padding: "16px 18px",
    fontSize: 16,
    fontWeight: 800,
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
  loadingPage: {
    minHeight: "100vh",
    background: "#060c18",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0f172a",
    padding: "24px 30px",
    fontSize: 18,
  },
  errorCard: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0f172a",
    padding: 28,
    maxWidth: 520,
  },
};