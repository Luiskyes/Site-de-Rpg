"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

async function safeJson(response) {
  try {
    const text = await response.text();

    if (!text || !text.trim()) {
      return null;
    }

    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function MasterPage() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [form, setForm] = useState({
    attributePointsAtCreation: "",
    skillPointsAtCreation: "",
    attributeMaxAtCreation: "",
    skillMaxAtCreation: "",
    levelUpAttributePoints: "",
    levelUpSkillPoints: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [authError, setAuthError] = useState("");
  const [configError, setConfigError] = useState("");
  const [charactersError, setCharactersError] = useState("");

  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setAuthError("");
        setConfigError("");
        setCharactersError("");
        setSuccess("");

        const [userRes, configRes, charsRes] = await Promise.all([
          fetch("/api/auth/me", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/game-config", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/master/characters", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const userData = await safeJson(userRes);

        if (!userRes.ok || !userData?.isMaster) {
          setAuthError("Acesso negado. Esta área é exclusiva do mestre.");
          setLoading(false);
          return;
        }

        setUser(userData);

        const configData = await safeJson(configRes);

        if (configRes.ok && configData) {
          setConfig(configData);
          setForm({
            attributePointsAtCreation: configData.attributePointsAtCreation ?? 0,
            skillPointsAtCreation: configData.skillPointsAtCreation ?? 0,
            attributeMaxAtCreation: configData.attributeMaxAtCreation ?? 0,
            skillMaxAtCreation: configData.skillMaxAtCreation ?? 0,
            levelUpAttributePoints: configData.levelUpAttributePoints ?? 0,
            levelUpSkillPoints: configData.levelUpSkillPoints ?? 0,
          });
        } else {
          setConfigError(
            configData?.error || "Erro ao carregar configuração global."
          );
        }

        const charsData = await safeJson(charsRes);

        if (charsRes.ok && Array.isArray(charsData)) {
          setCharacters(charsData);
        } else {
          setCharacters([]);
          setCharactersError(
            charsData?.error ||
              "Erro ao carregar as fichas do mestre."
          );
        }
      } catch (err) {
        console.error("MASTER PAGE LOAD ERROR:", err);
        setAuthError("Erro ao carregar painel do mestre.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setConfigError("");
    setSuccess("");

    try {
      const response = await fetch("/api/game-config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          attributePointsAtCreation: Number(form.attributePointsAtCreation),
          skillPointsAtCreation: Number(form.skillPointsAtCreation),
          attributeMaxAtCreation: Number(form.attributeMaxAtCreation),
          skillMaxAtCreation: Number(form.skillMaxAtCreation),
          levelUpAttributePoints: Number(form.levelUpAttributePoints),
          levelUpSkillPoints: Number(form.levelUpSkillPoints),
        }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        setConfigError(data?.error || "Erro ao salvar configuração");
        return;
      }

      if (data) {
        setConfig(data);
      }

      setSuccess("Configurações salvas com sucesso.");
    } catch (err) {
      console.error("MASTER PAGE SAVE ERROR:", err);
      setConfigError("Erro inesperado ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando painel do mestre...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.errorCard}>
          <h1 style={{ marginTop: 0 }}>Acesso restrito</h1>
          <p style={{ color: "#cbd5e1" }}>{authError}</p>
          <Link href="/" style={styles.backButton}>
            Voltar para a home
          </Link>
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
          <Link href="/" style={styles.backButton}>
            ← Voltar
          </Link>
        </div>

        <section style={styles.heroCard}>
          <div>
            <p style={styles.heroTag}>Mestre</p>
            <h1 style={styles.heroTitle}>Painel do Mestre</h1>
            <p style={styles.heroSubtitle}>
              Ajuste os pontos globais do sistema e acompanhe as fichas criadas
              pelos jogadores.
            </p>
          </div>

          <div style={styles.heroInfoBox}>
            <span style={styles.heroInfoLabel}>Conta atual</span>
            <strong style={styles.heroInfoValue}>{user?.email || "-"}</strong>
            <p style={styles.heroInfoMeta}>
              {characters.length} ficha(s) encontrada(s)
            </p>
          </div>
        </section>

        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Configuração global</h2>
                <p style={styles.cardSubtitle}>
                  Esses valores afetam criação de ficha e evolução do sistema.
                </p>
              </div>

              <form onSubmit={handleSave}>
                <div style={styles.formGrid}>
                  <Field
                    label="Pontos de atributo na criação"
                    name="attributePointsAtCreation"
                    value={form.attributePointsAtCreation}
                    onChange={handleChange}
                  />
                  <Field
                    label="Pontos de perícia na criação"
                    name="skillPointsAtCreation"
                    value={form.skillPointsAtCreation}
                    onChange={handleChange}
                  />
                  <Field
                    label="Máximo de atributo na criação"
                    name="attributeMaxAtCreation"
                    value={form.attributeMaxAtCreation}
                    onChange={handleChange}
                  />
                  <Field
                    label="Máximo de perícia na criação"
                    name="skillMaxAtCreation"
                    value={form.skillMaxAtCreation}
                    onChange={handleChange}
                  />
                  <Field
                    label="Pontos de atributo por level up"
                    name="levelUpAttributePoints"
                    value={form.levelUpAttributePoints}
                    onChange={handleChange}
                  />
                  <Field
                    label="Pontos de perícia por level up"
                    name="levelUpSkillPoints"
                    value={form.levelUpSkillPoints}
                    onChange={handleChange}
                  />
                </div>

                {configError ? <div style={styles.errorBox}>{configError}</div> : null}
                {success ? <div style={styles.successBox}>{success}</div> : null}

                <button type="submit" style={styles.saveButton} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar configurações"}
                </button>
              </form>
            </section>
          </div>

          <div style={styles.rightColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Fichas dos jogadores</h2>
                <p style={styles.cardSubtitle}>
                  Lista rápida para inspeção e acesso direto.
                </p>
              </div>

              {charactersError ? (
                <div style={styles.errorBox}>{charactersError}</div>
              ) : null}

              <div style={styles.characterList}>
                {characters.length === 0 ? (
                  <p style={styles.emptyText}>Nenhuma ficha encontrada.</p>
                ) : (
                  characters.map((character) => (
                    <Link
                      key={character.id}
                      href={`/master/characters/${character.id}`}
                      style={styles.characterCard}
                    >
                      <div>
                        <p style={styles.characterOwner}>
                          {character.ownerEmail || "Sem dono"}
                        </p>
                        <h3 style={styles.characterName}>
                          {character.name || "Sem nome"}
                        </h3>
                        <p style={styles.characterMeta}>
                          {character.class || "Sem classe"}
                          {character.level ? ` • Nível ${character.level}` : ""}
                        </p>
                        <p style={styles.characterMeta}>
                          Fôlego: {character.staminaCurrent ?? 0}/
                          {character.staminaBase ?? 0}
                        </p>
                      </div>

                      <span style={styles.characterArrow}>→</span>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div style={styles.fieldWrapper}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        style={styles.input}
        min={0}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 24%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 28%), #060c18",
    color: "#f8fafc",
    padding: "24px",
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
    maxWidth: "1440px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    position: "relative",
    zIndex: 1,
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
    fontSize: 42,
  },
  heroSubtitle: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 1.7,
    maxWidth: 760,
  },
  heroInfoBox: {
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  heroInfoLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroInfoValue: {
    fontSize: 18,
  },
  heroInfoMeta: {
    color: "#cbd5e1",
    fontSize: 14,
    margin: 0,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
    gap: 20,
    alignItems: "start",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rightColumn: {
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
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
  },
  cardSubtitle: {
    margin: "8px 0 0",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  fieldWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "13px 14px",
    outline: "none",
    fontSize: 15,
  },
  saveButton: {
    marginTop: 18,
    border: "none",
    borderRadius: 18,
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    padding: "16px 18px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 34px rgba(37,99,235,0.28)",
  },
  errorBox: {
    marginTop: 16,
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(248,113,113,0.28)",
    color: "#fecaca",
    borderRadius: 18,
    padding: 16,
    fontWeight: 600,
  },
  successBox: {
    marginTop: 16,
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    color: "#bbf7d0",
    borderRadius: 18,
    padding: 16,
    fontWeight: 600,
  },
  characterList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  characterCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    textDecoration: "none",
    color: "#f8fafc",
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  characterOwner: {
    margin: 0,
    color: "#93c5fd",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  characterName: {
    margin: "8px 0 0",
    fontSize: 22,
  },
  characterMeta: {
    margin: "8px 0 0",
    color: "#cbd5e1",
    fontSize: 14,
  },
  characterArrow: {
    fontSize: 28,
    color: "#93c5fd",
    fontWeight: 800,
  },
  emptyText: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.6,
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