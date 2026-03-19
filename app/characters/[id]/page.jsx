"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const attributeLabels = {
  potencia: "Potência",
  tecnica: "Técnica",
  agilidade: "Agilidade",
  velocidade: "Velocidade",
  ego: "Ego",
};

const skillGroups = [
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

function formatKey(key) {
  const map = {
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

  return map[key] || key;
}

function formatModifier(value) {
  if (!value) return "0";
  return value > 0 ? `+${value}` : String(value);
}

export default function CharacterPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSheet() {
      if (!id) {
        setError("ID de personagem inválido");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/characters/${id}/sheet`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erro ao carregar ficha");
          return;
        }

        setSheet(data);
      } catch (err) {
        setError("Erro inesperado ao carregar ficha");
      } finally {
        setLoading(false);
      }
    }

    fetchSheet();
  }, [id]);

  const staminaText = useMemo(() => {
    if (!sheet) return "-";
    const current = sheet.staminaCurrent ?? "-";
    const base = sheet.staminaBase ?? "-";
    return `${current} / ${base}`;
  }, [sheet]);

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando ficha...</div>
      </main>
    );
  }

  if (error || !sheet) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.errorCard}>
          <h1 style={styles.errorTitle}>Não foi possível carregar a ficha</h1>
          <p style={styles.errorText}>{error || "Erro desconhecido"}</p>
          <Link href="/" style={styles.backLink}>
            Voltar para a home
          </Link>
        </div>
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
            <Link href="/characters/create" style={styles.secondaryButton}>
              Nova ficha
            </Link>
          </div>
        </header>

        <section style={styles.heroCard}>
          <div>
            <p style={styles.heroTag}>Ficha do jogador</p>
            <h1 style={styles.heroTitle}>{sheet.name || "Personagem"}</h1>
            <p style={styles.heroSubtitle}>
              Classe: <strong>{sheet.class || "-"}</strong> • Nível {sheet.level ?? 1}
            </p>
          </div>

          <div style={styles.heroAbilityBox}>
            <span style={styles.heroAbilityLabel}>Habilidade inicial</span>
            <span style={styles.heroAbilityValue}>
              {sheet.selectedAbility || "Não definida"}
            </span>
          </div>
        </section>

        <section style={styles.summaryGrid}>
          <InfoCard label="Idade" value={sheet.age ?? "-"} />
          <InfoCard label="Altura" value={sheet.heightCm ? `${sheet.heightCm} cm` : "-"} />
          <InfoCard label="Peso" value={sheet.weightKg ? `${sheet.weightKg} kg` : "-"} />
          <InfoCard label="Fôlego" value={staminaText} />
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Atributos</h2>
            <p style={styles.sectionSubtitle}>Valores finais do personagem</p>
          </div>

          <div style={styles.attributesGrid}>
            {Object.entries(sheet.finalAttributes || {}).map(([key, value]) => (
              <div key={key} style={styles.attributeCard}>
                <span style={styles.attributeName}>{attributeLabels[key] || key}</span>
                <span style={styles.attributeValue}>{value ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Perícias</h2>
            <p style={styles.sectionSubtitle}>Organizadas de forma simples e legível</p>
          </div>

          <div style={styles.skillsSections}>
            {skillGroups.map((group) => (
              <div key={group.title} style={styles.skillGroupCard}>
                <h3 style={styles.skillGroupTitle}>{group.title}</h3>

                <div style={styles.skillList}>
                  {group.keys.map((key) => {
                    const total = sheet.finalSkills?.[key] ?? 0;
                    const passive = sheet.modifiers?.passiveFromAttributes?.[key] ?? 0;
                    const height = sheet.modifiers?.height?.[key] ?? 0;
                    const weight = sheet.modifiers?.weight?.[key] ?? 0;

                    const visibleModifiers = [
                      passive !== 0 ? `Atributos ${formatModifier(passive)}` : null,
                      height !== 0 ? `Altura ${formatModifier(height)}` : null,
                      weight !== 0 ? `Peso ${formatModifier(weight)}` : null,
                    ].filter(Boolean);

                    return (
                      <div key={key} style={styles.skillRow}>
                        <div style={styles.skillLabelArea}>
                          <span style={styles.skillLabel}>{group.labels[key]}</span>

                          {visibleModifiers.length > 0 ? (
                            <div style={styles.skillModifierTags}>
                              {visibleModifiers.map((text) => (
                                <span key={text} style={styles.modifierTag}>
                                  {text}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div style={styles.skillValueBadge}>{total}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.modifiersGrid}>
          <ModifierCard
            title="Bônus dos atributos"
            data={sheet.modifiers?.passiveFromAttributes}
            emptyText="Nenhum bônus passivo ativo."
          />

          <ModifierCard
            title="Altura"
            data={sheet.modifiers?.height}
            emptyText="Nenhum modificador de altura."
          />

          <ModifierCard
            title="Peso"
            data={sheet.modifiers?.weight}
            emptyText="Nenhum modificador de peso."
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function ModifierCard({ title, data, emptyText }) {
  const entries = Object.entries(data || {}).filter(([, value]) => Number(value || 0) !== 0);

  return (
    <div style={styles.modifierCard}>
      <h3 style={styles.modifierTitle}>{title}</h3>

      {entries.length === 0 ? (
        <p style={styles.modifierEmpty}>{emptyText}</p>
      ) : (
        <div style={styles.modifierList}>
          {entries.map(([key, value]) => (
            <div key={key} style={styles.modifierRow}>
              <span style={styles.modifierName}>{formatKey(key)}</span>
              <span style={styles.modifierValue}>{formatModifier(value)}</span>
            </div>
          ))}
        </div>
      )}
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
    maxWidth: "1280px",
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
  errorCard: {
    maxWidth: "520px",
    width: "100%",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "32px",
  },
  errorTitle: {
    margin: 0,
    marginBottom: "12px",
    fontSize: "24px",
  },
  errorText: {
    color: "#cbd5e1",
    marginBottom: "16px",
  },
  backLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: "bold",
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
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
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
    fontSize: "40px",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#cbd5e1",
    fontSize: "17px",
  },
  heroAbilityBox: {
    minWidth: "240px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  heroAbilityLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroAbilityValue: {
    fontSize: "18px",
    fontWeight: "bold",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    background: "#111827",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  infoValue: {
    fontSize: "26px",
    fontWeight: "bold",
  },
  section: {
    background: "#111827",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  sectionHeader: {
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "28px",
  },
  sectionSubtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#94a3b8",
  },
  attributesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  attributeCard: {
    background: "#0b1220",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "120px",
  },
  attributeName: {
    color: "#cbd5e1",
    fontSize: "15px",
  },
  attributeValue: {
    fontSize: "34px",
    fontWeight: "bold",
    lineHeight: 1,
  },
  skillsSections: {
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
  skillRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "12px",
  },
  skillLabelArea: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  skillLabel: {
    fontWeight: "bold",
    fontSize: "15px",
  },
  skillModifierTags: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  modifierTag: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    color: "#cbd5e1",
  },
  skillValueBadge: {
    minWidth: "56px",
    height: "56px",
    borderRadius: "16px",
    background: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  modifiersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  modifierCard: {
    background: "#111827",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  modifierTitle: {
    margin: 0,
    marginBottom: "14px",
    fontSize: "20px",
  },
  modifierEmpty: {
    color: "#94a3b8",
    margin: 0,
  },
  modifierList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  modifierRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0b1220",
    padding: "12px 14px",
    borderRadius: "14px",
  },
  modifierName: {
    color: "#cbd5e1",
  },
  modifierValue: {
    fontWeight: "bold",
    color: "#f8fafc",
  },
};