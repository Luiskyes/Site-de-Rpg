"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAbilitiesByClass } from "../../../lib/ability-book";

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

async function safeJson(response) {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatKey(key) {
  return skillLabels[key] || key;
}

function formatModifier(value) {
  if (!value) return "0";
  return value > 0 ? `+${value}` : String(value);
}

function getStaminaFillStyle(percent) {
  if (percent > 60) return "linear-gradient(90deg, #16a34a, #4ade80)";
  if (percent > 30) return "linear-gradient(90deg, #ca8a04, #facc15)";
  if (percent > 10) return "linear-gradient(90deg, #ea580c, #fb923c)";
  return "linear-gradient(90deg, #b91c1c, #ef4444)";
}

function sumValues(obj) {
  return Object.values(obj || {}).reduce((acc, value) => acc + Number(value || 0), 0);
}

export default function CharacterPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStamina, setSavingStamina] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [progressSuccess, setProgressSuccess] = useState("");

  const [progressForm, setProgressForm] = useState({
    levelUpAttributes: { ...EMPTY_ATTRIBUTES },
    levelUpSkills: { ...EMPTY_SKILLS },
    boughtAbilities: [],
    customAbilities: [],
    newBoughtAbility: "",
    newCustomAbility: "",
  });

  const [savedBaseline, setSavedBaseline] = useState({
    levelUpAttributes: { ...EMPTY_ATTRIBUTES },
    levelUpSkills: { ...EMPTY_SKILLS },
    boughtAbilities: [],
    customAbilities: [],
  });

  useEffect(() => {
    async function fetchSheet() {
      if (!id) {
        setError("ID de personagem inválido");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/characters/${id}/sheet`, {
          cache: "no-store",
          credentials: "include",
        });

        const data = await safeJson(response);

        if (!response.ok || !data) {
          setError(data?.error || "Erro ao carregar ficha");
          return;
        }

        setSheet(data);

        const initialProgress = {
          levelUpAttributes: { ...EMPTY_ATTRIBUTES, ...(data.levelUpAttributes || {}) },
          levelUpSkills: { ...EMPTY_SKILLS, ...(data.levelUpSkills || {}) },
          boughtAbilities: Array.isArray(data.progress?.boughtAbilities)
            ? data.progress.boughtAbilities
            : [],
          customAbilities: Array.isArray(data.progress?.customAbilities)
            ? data.progress.customAbilities
            : [],
          newBoughtAbility: "",
          newCustomAbility: "",
        };

        setProgressForm(initialProgress);
        setSavedBaseline({
          levelUpAttributes: { ...initialProgress.levelUpAttributes },
          levelUpSkills: { ...initialProgress.levelUpSkills },
          boughtAbilities: [...initialProgress.boughtAbilities],
          customAbilities: [...initialProgress.customAbilities],
        });
      } catch {
        setError("Erro inesperado ao carregar ficha");
      } finally {
        setLoading(false);
      }
    }

    fetchSheet();
  }, [id]);

  const staminaPercent = useMemo(() => {
    if (!sheet?.staminaBase || !sheet?.staminaCurrent) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((sheet.staminaCurrent / sheet.staminaBase) * 100))
    );
  }, [sheet]);

  const progressPreview = useMemo(() => {
    const spentAttributeUpgrades = sumValues(progressForm.levelUpAttributes);
    const spentSkillUpgrades = sumValues(progressForm.levelUpSkills);

    const existingAbilityCost = sheet?.progress?.existingAbilityCost ?? 5;
    const customAbilityCost = sheet?.progress?.customAbilityCost ?? 5;

    const totalSpent =
      spentAttributeUpgrades * 2 +
      spentSkillUpgrades * 1 +
      progressForm.boughtAbilities.length * existingAbilityCost +
      progressForm.customAbilities.length * customAbilityCost;

    const totalPoints = sheet?.progress?.progressPoints ?? 0;
    const remaining = totalPoints - totalSpent;
    const invalidSkillsRule = spentSkillUpgrades > spentAttributeUpgrades;

    return {
      spentAttributeUpgrades,
      spentSkillUpgrades,
      existingAbilityCost,
      customAbilityCost,
      totalSpent,
      remaining,
      invalidSkillsRule,
      invalid: remaining < 0 || invalidSkillsRule,
    };
  }, [progressForm, sheet]);

  function canIncreaseAttribute() {
    return progressPreview.remaining >= 2;
  }

  function canIncreaseSkill() {
    return (
      progressPreview.remaining >= 1 &&
      progressPreview.spentSkillUpgrades + 1 <= progressPreview.spentAttributeUpgrades
    );
  }

  function incrementAttribute(key) {
    if (!canIncreaseAttribute()) return;

    setProgressForm((prev) => ({
      ...prev,
      levelUpAttributes: {
        ...prev.levelUpAttributes,
        [key]: Number(prev.levelUpAttributes[key] || 0) + 1,
      },
    }));
  }

  function decrementAttribute(key) {
    const minValue = Number(savedBaseline.levelUpAttributes[key] || 0);

    setProgressForm((prev) => ({
      ...prev,
      levelUpAttributes: {
        ...prev.levelUpAttributes,
        [key]: Math.max(minValue, Number(prev.levelUpAttributes[key] || 0) - 1),
      },
    }));
  }

  function incrementSkill(key) {
    if (!canIncreaseSkill()) return;

    setProgressForm((prev) => ({
      ...prev,
      levelUpSkills: {
        ...prev.levelUpSkills,
        [key]: Number(prev.levelUpSkills[key] || 0) + 1,
      },
    }));
  }

  function decrementSkill(key) {
    const minValue = Number(savedBaseline.levelUpSkills[key] || 0);

    setProgressForm((prev) => ({
      ...prev,
      levelUpSkills: {
        ...prev.levelUpSkills,
        [key]: Math.max(minValue, Number(prev.levelUpSkills[key] || 0) - 1),
      },
    }));
  }

  function addBoughtAbility() {
    const name = String(progressForm.newBoughtAbility || "").trim();
    if (!name) return;
    if (!getAbilitiesByClass(sheet?.class).includes(name)) return;
    if (progressForm.boughtAbilities.includes(name)) return;
    if (progressPreview.remaining < progressPreview.existingAbilityCost) return;

    setProgressForm((prev) => ({
      ...prev,
      boughtAbilities: [...prev.boughtAbilities, name],
      newBoughtAbility: "",
    }));
  }

  function removeBoughtAbility(name) {
    if (savedBaseline.boughtAbilities.includes(name)) return;

    setProgressForm((prev) => ({
      ...prev,
      boughtAbilities: prev.boughtAbilities.filter((item) => item !== name),
    }));
  }

  function addCustomAbility() {
    const name = String(progressForm.newCustomAbility || "").trim();
    if (!name) return;
    if (progressForm.customAbilities.includes(name)) return;
    if (progressPreview.remaining < progressPreview.customAbilityCost) return;

    setProgressForm((prev) => ({
      ...prev,
      customAbilities: [...prev.customAbilities, name],
      newCustomAbility: "",
    }));
  }

  function removeCustomAbility(name) {
    if (savedBaseline.customAbilities.includes(name)) return;

    setProgressForm((prev) => ({
      ...prev,
      customAbilities: prev.customAbilities.filter((item) => item !== name),
    }));
  }

  async function updateStamina(nextValue) {
    if (!sheet || savingStamina) return;

    setSavingStamina(true);

    try {
      const response = await fetch(`/api/characters/${sheet.id}/stamina`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staminaCurrent: nextValue,
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        alert(data?.error || "Erro ao atualizar fôlego");
        return;
      }

      const refreshedResponse = await fetch(`/api/characters/${sheet.id}/sheet`, {
        cache: "no-store",
        credentials: "include",
      });

      const refreshedSheet = await safeJson(refreshedResponse);

      if (refreshedResponse.ok && refreshedSheet) {
        setSheet(refreshedSheet);
      } else {
        setSheet((prev) => ({
          ...prev,
          staminaCurrent: data.staminaCurrent,
          staminaBase: data.staminaBase,
        }));
      }
    } catch (err) {
      alert(`Erro inesperado ao atualizar o fôlego: ${err.message}`);
    } finally {
      setSavingStamina(false);
    }
  }

  async function handleSaveProgress() {
    try {
      setSavingProgress(true);
      setProgressError("");
      setProgressSuccess("");

      const response = await fetch(`/api/characters/${id}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          levelUpAttributes: progressForm.levelUpAttributes,
          levelUpSkills: progressForm.levelUpSkills,
          boughtAbilities: progressForm.boughtAbilities,
          customAbilities: progressForm.customAbilities,
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        setProgressError(data?.error || "Erro ao salvar progressão.");
        return;
      }

      setSheet(data);

      const updatedProgress = {
        levelUpAttributes: { ...EMPTY_ATTRIBUTES, ...(data.levelUpAttributes || {}) },
        levelUpSkills: { ...EMPTY_SKILLS, ...(data.levelUpSkills || {}) },
        boughtAbilities: Array.isArray(data.progress?.boughtAbilities)
          ? data.progress.boughtAbilities
          : [],
        customAbilities: Array.isArray(data.progress?.customAbilities)
          ? data.progress.customAbilities
          : [],
        newBoughtAbility: "",
        newCustomAbility: "",
      };

      setProgressForm(updatedProgress);
      setSavedBaseline({
        levelUpAttributes: { ...updatedProgress.levelUpAttributes },
        levelUpSkills: { ...updatedProgress.levelUpSkills },
        boughtAbilities: [...updatedProgress.boughtAbilities],
        customAbilities: [...updatedProgress.customAbilities],
      });

      setProgressSuccess("Progressão salva com sucesso.");
    } catch (err) {
      console.error("PLAYER PROGRESS SAVE ERROR:", err);
      setProgressError("Erro inesperado ao salvar progressão.");
    } finally {
      setSavingProgress(false);
    }
  }

  function handleDecreaseStamina() {
    if (!sheet) return;
    updateStamina((sheet.staminaCurrent ?? 0) - 1);
  }

  function handleIncreaseStamina() {
    if (!sheet) return;
    updateStamina((sheet.staminaCurrent ?? 0) + 1);
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando ficha...</div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.errorCard}>
          <h1 style={{ marginTop: 0 }}>Não foi possível carregar a ficha</h1>
          <p style={{ color: "#cbd5e1" }}>{error || "Erro desconhecido"}</p>
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
          <div style={{ flex: 1 }}>
            <p style={styles.heroEyebrow}>Ficha visual</p>
            <p style={styles.heroMini}>Ficha do jogador</p>
            <h1 style={styles.heroTitle}>{sheet.name || "Personagem"}</h1>
            <p style={styles.heroSubtitle}>Classe: {sheet.class || "-"}</p>

            <div style={styles.heroSealRow}>
              {sheet.specialTrait === "genio" ? <Seal label="Gênio" accent="blue" /> : null}
              {sheet.specialTrait === "prodigio" ? <Seal label="Prodígio" accent="green" /> : null}
              {sheet.isAmbidextrous ? <Seal label="Ambidestria" accent="purple" /> : null}
            </div>
          </div>

          <div style={styles.heroInfoBox}>
            <InfoLine label="Habilidade inicial" value={sheet.selectedAbility || "Não definida"} />
            <InfoLine label="Idade" value={sheet.age ?? "-"} />
            <InfoLine label="Altura" value={sheet.heightCm ? `${sheet.heightCm} cm` : "-"} />
            <InfoLine label="Peso" value={sheet.weightKg ? `${sheet.weightKg} kg` : "-"} />
          </div>
        </section>

        <div style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <Card title="Resumo" subtitle="Informações rápidas da ficha">
              <div style={styles.quickInfoGrid}>
                <InfoCard label="Classe" value={sheet.class || "-"} />
                <InfoCard label="Fôlego" value={`${sheet.staminaCurrent ?? 0}/${sheet.staminaBase ?? 0}`} />
                <InfoCard label="Habilidade" value={sheet.selectedAbility || "-"} />
                <InfoCard label="Traço" value={sheet.specialTrait || "Nenhum"} />
              </div>

              {sheet.notes ? (
                <div style={styles.notesBox}>
                  <h4 style={styles.notesTitle}>Notas</h4>
                  <p style={styles.notesText}>{sheet.notes}</p>
                </div>
              ) : null}
            </Card>

            <Card title="Fôlego" subtitle="Ajuste o fôlego atual do personagem">
              <div style={styles.staminaCard}>
                <div style={styles.staminaTop}>
                  <div>
                    <p style={styles.staminaLabel}>Fôlego atual</p>
                    <h3 style={styles.staminaValue}>
                      {sheet.staminaCurrent ?? 0} / {sheet.staminaBase ?? 0}
                    </h3>
                  </div>

                  <div style={styles.staminaPercentBadge}>{staminaPercent}%</div>
                </div>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${staminaPercent}%`,
                      background: getStaminaFillStyle(staminaPercent),
                    }}
                  />
                </div>

                {sheet?.fatigue?.isExhaustedPenaltyActive ? (
                  <div style={styles.fatigueWarning}>{sheet?.fatigue?.message}</div>
                ) : null}

                <div style={styles.staminaActions}>
                  <button
                    type="button"
                    onClick={handleDecreaseStamina}
                    disabled={savingStamina}
                    style={styles.staminaButton}
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={handleIncreaseStamina}
                    disabled={savingStamina}
                    style={styles.staminaButtonPrimary}
                  >
                    +1
                  </button>
                </div>
              </div>
            </Card>

            <Card title="Atributos" subtitle="Valores finais">
              <div style={styles.attributeGrid}>
                {Object.entries(sheet.finalAttributes || {}).map(([key, value]) => (
                  <div key={key} style={styles.attributeCard}>
                    <div style={styles.attributeCardTop}>
                      <div>
                        <h3 style={styles.attributeTitle}>{attributeLabels[key] || key}</h3>
                        {sheet?.fatigue?.isExhaustedPenaltyActive ? (
                          <p style={styles.attributeMeta}>
                            Base: {sheet.rawFinalAttributes?.[key] ?? 0} → Atual: {value ?? 0}
                          </p>
                        ) : null}
                      </div>

                      <div style={styles.totalBadge}>{value ?? 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Perícias" subtitle="Leitura visual das perícias">
              <div style={styles.skillsWrap}>
                {skillGroups.map((group) => (
                  <div key={group.title} style={styles.skillSection}>
                    <h3 style={styles.skillSectionTitle}>{group.title}</h3>

                    <div style={styles.skillGrid}>
                      {group.keys.map((key) => {
                        const total = sheet.finalSkills?.[key] ?? 0;
                        const rawTotal = sheet.rawFinalSkills?.[key] ?? total;
                        const passive = sheet.modifiers?.passiveFromAttributes?.[key] ?? 0;
                        const height = sheet.modifiers?.height?.[key] ?? 0;
                        const weight = sheet.modifiers?.weight?.[key] ?? 0;
                        const ambidexterity = sheet.modifiers?.ambidexterity?.[key] ?? 0;

                        const visibleModifiers = [
                          passive !== 0 ? `Atributos ${formatModifier(passive)}` : null,
                          height !== 0 ? `Altura ${formatModifier(height)}` : null,
                          weight !== 0 ? `Peso ${formatModifier(weight)}` : null,
                          ambidexterity !== 0 ? `Ambidestria ${formatModifier(ambidexterity)}` : null,
                        ].filter(Boolean);

                        return (
                          <div key={key} style={styles.skillCard}>
                            <div style={styles.skillCardTop}>
                              <div>
                                <h4 style={styles.skillTitle}>{group.labels[key]}</h4>
                                {sheet?.fatigue?.isExhaustedPenaltyActive ? (
                                  <p style={styles.attributeMeta}>
                                    Base: {rawTotal} → Atual: {total}
                                  </p>
                                ) : null}
                                {visibleModifiers.length > 0 ? (
                                  <div style={styles.skillModifierRow}>
                                    {visibleModifiers.map((text) => (
                                      <span key={text} style={styles.skillModifier}>
                                        {text}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={styles.noModifierText}>Sem modificadores visíveis</p>
                                )}
                              </div>

                              <div style={styles.totalBadge}>{total}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Progressão" subtitle="Distribuição e compras">
              <div style={styles.progressGrid}>
                <InfoCard label="Pontos totais" value={sheet?.progress?.progressPoints ?? 0} />
                <InfoCard label="Pontos gastos" value={progressPreview.totalSpent} />
                <InfoCard label="Pontos restantes" value={progressPreview.remaining} />
              </div>

              <div style={styles.rulesBox}>
                <h4 style={styles.rulesTitle}>Regras</h4>

                <div style={styles.rulesList}>
                  <div style={styles.ruleRow}>
                    <span>Aumentar 1 atributo</span>
                    <strong>2 pontos</strong>
                  </div>
                  <div style={styles.ruleRow}>
                    <span>Comprar habilidade da sua classe</span>
                    <strong>{progressPreview.existingAbilityCost} pontos</strong>
                  </div>
                  <div style={styles.ruleRow}>
                    <span>Criar habilidade nova</span>
                    <strong>{progressPreview.customAbilityCost} pontos</strong>
                  </div>
                </div>

                <p style={styles.progressNote}>
                  Depois de salvar, compras já registradas não podem ser diminuídas ou removidas.
                </p>

                <p style={{ ...styles.progressNote, marginTop: 10 }}>
                  Regra: perícias compradas não podem ultrapassar atributos comprados.
                </p>
              </div>

              <div style={styles.spaciousProgressLayout}>
                <div style={styles.distributionArea}>
                  <StatAdjustSection
                    title="Atributos comprados"
                    values={progressForm.levelUpAttributes}
                    labels={attributeLabels}
                    onIncrement={incrementAttribute}
                    onDecrement={decrementAttribute}
                    canIncrement={canIncreaseAttribute()}
                  />
                </div>

                <div style={styles.purchasesArea}>
                  <div style={styles.purchasePanelLarge}>
                    <h4 style={styles.rulesTitle}>Compras</h4>

                    <div style={styles.purchaseBlock}>
                      <label style={styles.infoLabel}>Habilidade da sua classe</label>
                      <div style={styles.purchaseInputRow}>
                        <select
                          value={progressForm.newBoughtAbility}
                          onChange={(e) =>
                            setProgressForm((prev) => ({
                              ...prev,
                              newBoughtAbility: e.target.value,
                            }))
                          }
                          style={styles.input}
                        >
                          <option value="">Selecione uma habilidade</option>
                          {(getAbilitiesByClass(sheet?.class) || []).map((ability) => (
                            <option key={ability} value={ability}>
                              {ability}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={addBoughtAbility}
                          disabled={progressPreview.remaining < progressPreview.existingAbilityCost}
                          style={styles.miniActionButton}
                        >
                          Adicionar
                        </button>
                      </div>

                      <div style={styles.tagWrap}>
                        {progressForm.boughtAbilities.length ? (
                          progressForm.boughtAbilities.map((item) => {
                            const locked = savedBaseline.boughtAbilities.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => removeBoughtAbility(item)}
                                style={{
                                  ...styles.tagButton,
                                  opacity: locked ? 0.65 : 1,
                                  cursor: locked ? "not-allowed" : "pointer",
                                }}
                                title={locked ? "Já salva, não pode remover" : "Remover"}
                                disabled={locked}
                              >
                                {item} {locked ? "• salva" : "×"}
                              </button>
                            );
                          })
                        ) : (
                          <p style={styles.emptyText}>Nenhuma habilidade comprada.</p>
                        )}
                      </div>
                    </div>

                    <div style={styles.purchaseBlock}>
                      <label style={styles.infoLabel}>Habilidade criada</label>
                      <div style={styles.purchaseInputRow}>
                        <input
                          type="text"
                          value={progressForm.newCustomAbility}
                          onChange={(e) =>
                            setProgressForm((prev) => ({
                              ...prev,
                              newCustomAbility: e.target.value,
                            }))
                          }
                          style={styles.input}
                          placeholder="Nome da habilidade"
                        />
                        <button
                          type="button"
                          onClick={addCustomAbility}
                          disabled={progressPreview.remaining < progressPreview.customAbilityCost}
                          style={styles.miniActionButton}
                        >
                          Adicionar
                        </button>
                      </div>

                      <div style={styles.tagWrap}>
                        {progressForm.customAbilities.length ? (
                          progressForm.customAbilities.map((item) => {
                            const locked = savedBaseline.customAbilities.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => removeCustomAbility(item)}
                                style={{
                                  ...styles.tagButton,
                                  opacity: locked ? 0.65 : 1,
                                  cursor: locked ? "not-allowed" : "pointer",
                                }}
                                title={locked ? "Já salva, não pode remover" : "Remover"}
                                disabled={locked}
                              >
                                {item} {locked ? "• salva" : "×"}
                              </button>
                            );
                          })
                        ) : (
                          <p style={styles.emptyText}>Nenhuma habilidade criada.</p>
                        )}
                      </div>
                    </div>

                    {progressPreview.invalidSkillsRule ? (
                      <div style={styles.errorBox}>
                        As perícias compradas não podem ultrapassar os atributos comprados.
                      </div>
                    ) : null}

                    {progressError ? <div style={styles.errorBox}>{progressError}</div> : null}
                    {progressSuccess ? <div style={styles.successBox}>{progressSuccess}</div> : null}

                    <div style={styles.purchaseFooter}>
                      <button
                        type="button"
                        onClick={handleSaveProgress}
                        style={styles.primaryButton}
                        disabled={savingProgress || progressPreview.invalid}
                      >
                        {savingProgress ? "Salvando progressão..." : "Salvar progressão"}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={styles.distributionArea}>
                  <StatAdjustSection
                    title="Perícias compradas"
                    values={progressForm.levelUpSkills}
                    labels={skillLabels}
                    onIncrement={incrementSkill}
                    onDecrement={decrementSkill}
                    canIncrement={canIncreaseSkill()}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div style={styles.rightColumn}>
            <ModifierCard
              title="Bônus por atributos"
              data={sheet.modifiers?.passiveFromAttributes}
              emptyText="Nenhum bônus passivo relevante."
            />

            <ModifierCard
              title="Modificadores de altura"
              data={sheet.modifiers?.height}
              emptyText="Sem efeito ativo de altura."
            />

            <ModifierCard
              title="Modificadores de peso"
              data={sheet.modifiers?.weight}
              emptyText="Sem efeito ativo de peso."
            />

            <ModifierCard
              title="Ambidestria"
              data={sheet.modifiers?.ambidexterity}
              emptyText="Sem bônus de ambidestria."
            />
          </div>
        </div>
      </div>
    </div>
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

function InfoCard({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={styles.infoLine}>
      <span style={styles.infoLineLabel}>{label}</span>
      <strong style={styles.infoLineValue}>{value}</strong>
    </div>
  );
}

function ModifierCard({ title, data, emptyText }) {
  const entries = Object.entries(data || {}).filter(
    ([, value]) => Number(value || 0) !== 0
  );

  return (
    <Card title={title}>
      {entries.length === 0 ? (
        <p style={styles.emptyText}>{emptyText}</p>
      ) : (
        <div style={styles.modifierList}>
          {entries.map(([key, value]) => (
            <div key={key} style={styles.modifierRow}>
              <span style={styles.modifierKey}>{formatKey(key)}</span>
              <strong style={styles.modifierValue}>{formatModifier(value)}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StatAdjustSection({
  title,
  values,
  labels,
  onIncrement,
  onDecrement,
  canIncrement,
}) {
  return (
    <div style={styles.adjustSection}>
      <h4 style={styles.rulesTitle}>{title}</h4>

      <div style={styles.adjustGrid}>
        {Object.keys(values || {}).map((key) => (
          <div key={key} style={styles.adjustCard}>
            <div>
              <h5 style={styles.adjustTitle}>{labels[key] || key}</h5>
              <p style={styles.adjustMeta}>Atual: {values[key] ?? 0}</p>
            </div>

            <div style={styles.adjustActions}>
              <button
                type="button"
                onClick={() => onDecrement(key)}
                style={styles.adjustButton}
              >
                −
              </button>

              <div style={styles.adjustValue}>{values[key] ?? 0}</div>

              <button
                type="button"
                onClick={() => onIncrement(key)}
                style={styles.adjustButtonPrimary}
                disabled={!canIncrement}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
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
  },
  heroEyebrow: {
    margin: 0,
    color: "#93c5fd",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  heroMini: {
    margin: "8px 0 0",
    color: "#cbd5e1",
    fontSize: 14,
  },
  heroTitle: {
    margin: "10px 0 0",
    fontSize: 42,
    lineHeight: 1.05,
  },
  heroSubtitle: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    fontSize: 17,
  },
  heroSealRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  heroInfoBox: {
    minWidth: 290,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  infoLine: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoLineLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoLineValue: {
    fontSize: 16,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 0.95fr)",
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
    position: "sticky",
    top: 20,
  },
  card: {
    background: "rgba(15,23,42,0.88)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 22,
    boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
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
  quickInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
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
    fontSize: 18,
    wordBreak: "break-word",
  },
  notesBox: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  notesTitle: {
    margin: 0,
    marginBottom: 10,
    fontSize: 16,
  },
  notesText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
  progressGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  rulesBox: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 18,
  },
  rulesTitle: {
    margin: 0,
    marginBottom: 12,
    fontSize: 16,
  },
  rulesList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  ruleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  progressNote: {
    marginTop: 14,
    marginBottom: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: 14,
  },
  spaciousProgressLayout: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  distributionArea: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  purchasesArea: {
    display: "flex",
    justifyContent: "flex-end",
  },
  purchasePanelLarge: {
    width: "100%",
    maxWidth: 620,
    borderRadius: 24,
    padding: 22,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  purchaseBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  purchaseInputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 120px",
    gap: 10,
    alignItems: "center",
  },
  purchaseFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  miniActionButton: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.16)",
    border: "1px solid rgba(96,165,250,0.35)",
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: 700,
  },
  adjustSection: {
    borderRadius: 22,
    padding: 18,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  adjustGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
  },
  adjustCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0a1222",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  adjustTitle: {
    margin: 0,
    fontSize: 16,
  },
  adjustMeta: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: 13,
  },
  adjustActions: {
    display: "grid",
    gridTemplateColumns: "50px 1fr 50px",
    gap: 8,
    alignItems: "center",
  },
  adjustButton: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    cursor: "pointer",
  },
  adjustButtonPrimary: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    cursor: "pointer",
  },
  adjustValue: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
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
  },
  staminaCard: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  staminaTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  staminaLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  staminaValue: {
    margin: "8px 0 0",
    fontSize: 34,
  },
  staminaPercentBadge: {
    minWidth: 74,
    height: 48,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, rgba(37,99,235,0.28), rgba(37,99,235,0.14))",
    border: "1px solid rgba(96,165,250,0.2)",
    fontSize: 18,
    fontWeight: 800,
  },
  progressTrack: {
    width: "100%",
    height: 16,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 180ms ease",
  },
  fatigueWarning: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(248,113,113,0.28)",
    color: "#fecaca",
    borderRadius: 16,
    padding: 14,
    fontWeight: 600,
  },
  staminaActions: {
    display: "flex",
    gap: 12,
  },
  staminaButton: {
    flex: 1,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#f8fafc",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 16,
  },
  staminaButtonPrimary: {
    flex: 1,
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 16,
    boxShadow: "0 16px 34px rgba(37,99,235,0.28)",
  },
  attributeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  attributeCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 16,
  },
  attributeCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  attributeTitle: {
    margin: 0,
    fontSize: 18,
  },
  attributeMeta: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: 13,
  },
  totalBadge: {
    minWidth: 46,
    height: 46,
    borderRadius: 14,
    background:
      "linear-gradient(180deg, rgba(37,99,235,0.28), rgba(37,99,235,0.14))",
    border: "1px solid rgba(96,165,250,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    flexShrink: 0,
  },
  skillsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  skillSection: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    padding: 16,
  },
  skillSectionTitle: {
    margin: 0,
    marginBottom: 14,
    fontSize: 20,
  },
  skillGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  skillCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0a1222",
    padding: 14,
  },
  skillCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  skillTitle: {
    margin: 0,
    fontSize: 16,
  },
  skillModifierRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  skillModifier: {
    borderRadius: 999,
    padding: "5px 8px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: 600,
  },
  noModifierText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 12,
  },
  modifierList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  modifierRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  modifierKey: {
    color: "#e2e8f0",
  },
  modifierValue: {
    fontSize: 16,
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