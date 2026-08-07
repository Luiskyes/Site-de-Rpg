"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import AppTopBar from "../../components/AppTopBar";
import {
  getAbilitiesByClass,
  normalizeAbilityName,
} from "../../../lib/ability-book";
import {
  EMPTY_ATTRIBUTES,
  EMPTY_SKILLS,
  attributeLabels,
  skillLabels,
  skillGroups,
} from "../../../lib/character-sheet/constants";
import {
  safeJson,
  formatKey,
  formatModifier,
  getStaminaFillStyle,
  sumValues,
} from "../../../lib/character-sheet/utils";
import {
  MAX_CUSTOM_ABILITY_DESCRIPTION_LENGTH,
  MAX_CUSTOM_ABILITY_NAME_LENGTH,
  customAbilityKey,
  normalizeCustomAbilities,
} from "../../../lib/custom-abilities";

export default function CharacterPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const masterMode = pathname.startsWith("/master/");
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [sheet, setSheet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStamina, setSavingStamina] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [progressSuccess, setProgressSuccess] = useState("");
  const [pointsDelta, setPointsDelta] = useState(3);
  const [savingPoints, setSavingPoints] = useState(false);
  const [masterError, setMasterError] = useState("");
  const [masterSuccess, setMasterSuccess] = useState("");
  const [staminaDraft, setStaminaDraft] = useState("");
  const [deletingCharacter, setDeletingCharacter] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [rollingStaminaUpgrade, setRollingStaminaUpgrade] = useState(false);
  const [staminaUpgradeError, setStaminaUpgradeError] = useState("");
  const [latestStaminaRoll, setLatestStaminaRoll] = useState(null);

  const [progressForm, setProgressForm] = useState({
    levelUpAttributes: { ...EMPTY_ATTRIBUTES },
    levelUpSkills: { ...EMPTY_SKILLS },
    boughtAbilities: [],
    customAbilities: [],
    newBoughtAbility: "",
    newCustomAbilityName: "",
    newCustomAbilityDescription: "",
  });

  const [savedBaseline, setSavedBaseline] = useState({
    levelUpAttributes: { ...EMPTY_ATTRIBUTES },
    levelUpSkills: { ...EMPTY_SKILLS },
    boughtAbilities: [],
    customAbilities: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSheet() {
      if (!id) {
        setError("ID de personagem inválido");
        setLoading(false);
        return;
      }

      try {
        const sheetUrl = masterMode
          ? `/api/master/characters/${id}`
          : `/api/characters/${id}/sheet`;
        const response = await fetch(sheetUrl, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        const data = await safeJson(response);

        if (!response.ok || !data) {
          setError(data?.error || "Erro ao carregar ficha");
          return;
        }

        setSheet(data);
        setStaminaDraft(String(data.staminaCurrent ?? 0));

        const initialProgress = {
          levelUpAttributes: { ...EMPTY_ATTRIBUTES, ...(data.levelUpAttributes || {}) },
          levelUpSkills: { ...EMPTY_SKILLS, ...(data.levelUpSkills || {}) },
          boughtAbilities: Array.isArray(data.progress?.boughtAbilities)
            ? data.progress.boughtAbilities
            : [],
          customAbilities: normalizeCustomAbilities(data.progress?.customAbilities),
          newBoughtAbility: "",
          newCustomAbilityName: "",
          newCustomAbilityDescription: "",
        };

        setProgressForm(initialProgress);
        setSavedBaseline({
          levelUpAttributes: { ...initialProgress.levelUpAttributes },
          levelUpSkills: { ...initialProgress.levelUpSkills },
          boughtAbilities: [...initialProgress.boughtAbilities],
          customAbilities: [...initialProgress.customAbilities],
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError("Erro inesperado ao carregar ficha");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchSheet();
    return () => controller.abort();
  }, [id, masterMode]);

  const staminaPercent = useMemo(() => {
    if (!sheet?.staminaBase || !sheet?.staminaCurrent) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((sheet.staminaCurrent / sheet.staminaBase) * 100))
    );
  }, [sheet]);

  const availableClassAbilities = useMemo(() => {
    const initialAbilityKey = normalizeAbilityName(sheet?.selectedAbility);

    return getAbilitiesByClass(sheet?.class).filter(
      (ability) =>
        !initialAbilityKey || normalizeAbilityName(ability) !== initialAbilityKey
    );
  }, [sheet?.class, sheet?.selectedAbility]);

  const progressPreview = useMemo(() => {
    const spentAttributeUpgrades = sumValues(progressForm.levelUpAttributes);
    const spentSkillUpgrades = sumValues(progressForm.levelUpSkills);

    const existingAbilityCost = sheet?.progress?.existingAbilityCost ?? 5;
    const customAbilityCost = sheet?.progress?.customAbilityCost ?? 5;
    const staminaUpgradeCost = sheet?.progress?.staminaUpgradeCost ?? 5;
    const staminaUpgradeCount = Array.isArray(sheet?.progress?.staminaUpgradeRolls)
      ? sheet.progress.staminaUpgradeRolls.length
      : 0;

    const totalSpent =
      spentAttributeUpgrades * 2 +
      spentSkillUpgrades * 1 +
      progressForm.boughtAbilities.length * existingAbilityCost +
      progressForm.customAbilities.length * customAbilityCost +
      staminaUpgradeCount * staminaUpgradeCost;

    const totalPoints = sheet?.progress?.progressPoints ?? 0;
    const remaining = totalPoints - totalSpent;
    const invalidSkillsRule = spentSkillUpgrades > spentAttributeUpgrades;

    return {
      spentAttributeUpgrades,
      spentSkillUpgrades,
      existingAbilityCost,
      customAbilityCost,
      staminaUpgradeCost,
      staminaUpgradeCount,
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
    if (!availableClassAbilities.includes(name)) return;
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
    const name = String(progressForm.newCustomAbilityName || "").trim();
    const description = String(
      progressForm.newCustomAbilityDescription || ""
    ).trim();

    if (!name) return;
    if (
      progressForm.customAbilities.some(
        (ability) => customAbilityKey(ability) === customAbilityKey({ name })
      )
    ) return;
    if (progressPreview.remaining < progressPreview.customAbilityCost) return;

    setProgressForm((prev) => ({
      ...prev,
      customAbilities: [...prev.customAbilities, { name, description }],
      newCustomAbilityName: "",
      newCustomAbilityDescription: "",
    }));
  }

  function removeCustomAbility(abilityToRemove) {
    const abilityKey = customAbilityKey(abilityToRemove);
    const isSaved = savedBaseline.customAbilities.some(
      (ability) => customAbilityKey(ability) === abilityKey
    );

    if (isSaved) return;

    setProgressForm((prev) => ({
      ...prev,
      customAbilities: prev.customAbilities.filter(
        (ability) => customAbilityKey(ability) !== abilityKey
      ),
    }));
  }

  async function updateStamina(nextValue) {
    if (!sheet || savingStamina) return;

    setSavingStamina(true);

    try {
      const staminaUrl = masterMode
        ? `/api/master/characters/${sheet.id}/stamina`
        : `/api/characters/${sheet.id}/stamina`;
      const response = await fetch(staminaUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          staminaCurrent: nextValue,
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || !data) {
        alert(data?.error || "Erro ao atualizar fôlego");
        return;
      }

      setSheet(data);
      setStaminaDraft(String(data.staminaCurrent ?? 0));
    } catch (err) {
      alert(`Erro inesperado ao atualizar o fôlego: ${err.message}`);
    } finally {
      setSavingStamina(false);
    }
  }

  async function handleBuyStaminaUpgrade() {
    if (!sheet || masterMode || rollingStaminaUpgrade) return;

    const animationStartedAt = Date.now();
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    try {
      setRollingStaminaUpgrade(true);
      setStaminaUpgradeError("");
      setLatestStaminaRoll(null);

      const response = await fetch(
        `/api/characters/${sheet.id}/progress/stamina`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await safeJson(response);

      if (!response.ok || !data?.sheet || !data?.roll) {
        setStaminaUpgradeError(
          data?.error || "Não foi possível comprar o aumento de fôlego."
        );
        return;
      }

      const minimumAnimationTime = prefersReducedMotion ? 0 : 900;
      const remainingAnimationTime = Math.max(
        0,
        minimumAnimationTime - (Date.now() - animationStartedAt)
      );

      if (remainingAnimationTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingAnimationTime));
      }

      setSheet(data.sheet);
      setStaminaDraft(String(data.sheet.staminaCurrent ?? 0));
      setLatestStaminaRoll(data.roll);
    } catch (err) {
      console.error("STAMINA UPGRADE PURCHASE ERROR:", err);
      setStaminaUpgradeError("Erro inesperado ao comprar fôlego.");
    } finally {
      setRollingStaminaUpgrade(false);
    }
  }

  async function handleDeleteCharacter() {
    if (!masterMode || !sheet || deletingCharacter) return;

    try {
      setDeletingCharacter(true);
      setDeleteError("");

      const response = await fetch(`/api/master/characters/${sheet.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await safeJson(response);

      if (!response.ok) {
        setDeleteError(data?.error || "Não foi possível excluir a ficha.");
        return;
      }

      router.replace("/master");
      router.refresh();
    } catch (err) {
      console.error("MASTER CHARACTER DELETE ERROR:", err);
      setDeleteError("Erro inesperado ao excluir a ficha.");
    } finally {
      setDeletingCharacter(false);
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
        customAbilities: normalizeCustomAbilities(data.progress?.customAbilities),
        newBoughtAbility: "",
        newCustomAbilityName: "",
        newCustomAbilityDescription: "",
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

  async function handleAddPoints() {
    if (!masterMode || savingPoints) return;

    const amount = Number(pointsDelta);
    if (!Number.isFinite(amount) || amount === 0) {
      setMasterError("Informe uma quantidade diferente de zero.");
      setMasterSuccess("");
      return;
    }

    try {
      setSavingPoints(true);
      setMasterError("");
      setMasterSuccess("");

      const response = await fetch(`/api/master/characters/${id}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });
      const data = await safeJson(response);

      if (!response.ok || !data) {
        setMasterError(data?.error || "Não foi possível alterar os pontos.");
        return;
      }

      setSheet((current) => ({
        ...current,
        progress: {
          ...current.progress,
          progressPoints: Number(data.progressPoints || 0),
          progressPointsRemaining: Math.max(
            0,
            Number(data.progressPoints || 0) - Number(current.progress?.totalProgressSpent || 0)
          ),
        },
      }));
      setMasterSuccess(
        amount > 0
          ? `${amount} ponto(s) concedido(s) com sucesso.`
          : `${Math.abs(amount)} ponto(s) removido(s) com sucesso.`
      );
    } catch (err) {
      console.error("MASTER POINTS ERROR:", err);
      setMasterError("Erro inesperado ao alterar os pontos.");
    } finally {
      setSavingPoints(false);
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
      <div className="ui-loading-page" style={styles.loadingPage}>
        <div className="ui-loading-card" role="status" aria-live="polite" style={styles.loadingCard}>
          Carregando ficha...
        </div>
      </div>
    );
  }

  if (error || !sheet) {
    return (
      <div className="ui-loading-page" style={styles.loadingPage}>
        <div style={styles.errorCard}>
          <h1 style={{ marginTop: 0 }}>Não foi possível carregar a ficha</h1>
          <p style={{ color: "#cbd5e1" }}>{error || "Erro desconhecido"}</p>
          <Link href={masterMode ? "/master" : "/"} style={styles.backButton}>
            {masterMode ? "Voltar para o painel" : "Voltar para a home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page" style={styles.page}>
      <div className="ui-orb" style={styles.bgOrbTop} />
      <div className="ui-orb" style={styles.bgOrbBottom} />

      <div className="ui-container" style={styles.container}>
        <AppTopBar
          backHref={masterMode ? "/master" : "/"}
          backLabel={masterMode ? "Mestre" : "Painel"}
          context={masterMode ? "Ficha do jogador" : "Minha ficha"}
        />

        <section className="ui-hero" style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroEyebrow}>
              {masterMode ? "Visualização do mestre" : "Ficha visual"}
            </p>
            <p style={styles.heroMini}>
              {masterMode ? "Acompanhamento do jogador" : "Ficha do jogador"}
            </p>
            <h1 className="ui-title" style={styles.heroTitle}>{sheet.name || "Personagem"}</h1>
            <p style={styles.heroSubtitle}>Classe: {sheet.class || "-"}</p>

            <div style={styles.heroSealRow}>
              {sheet.specialTrait === "genio" ? <Seal label="Gênio" accent="blue" /> : null}
              {sheet.specialTrait === "prodigio" ? <Seal label="Prodígio" accent="green" /> : null}
              {sheet.isAmbidextrous ? <Seal label="Ambidestria" accent="purple" /> : null}
            </div>
          </div>

          <div className="ui-hero-side" style={styles.heroInfoBox}>
            <InfoLine label="Habilidade inicial" value={sheet.selectedAbility || "Não definida"} />
            <InfoLine label="Idade" value={sheet.age ?? "-"} />
            <InfoLine label="Altura" value={sheet.heightCm ? `${sheet.heightCm} cm` : "-"} />
            <InfoLine label="Peso" value={sheet.weightKg ? `${sheet.weightKg} kg` : "-"} />
          </div>
        </section>

        {masterMode ? (
          <MasterSheetActions
            characterName={sheet.name || "Personagem"}
            staminaCurrent={sheet.staminaCurrent ?? 0}
            staminaBase={sheet.staminaBase ?? 0}
            staminaDraft={staminaDraft}
            onStaminaDraftChange={setStaminaDraft}
            onSaveStamina={() => updateStamina(Number(staminaDraft))}
            savingStamina={savingStamina}
            onDeleteCharacter={handleDeleteCharacter}
            deletingCharacter={deletingCharacter}
            deleteError={deleteError}
          />
        ) : null}

        <div className="ui-main-grid" style={styles.mainGrid}>
          <div style={styles.leftColumn}>
            <Card
              className={masterMode ? "ui-master-summary" : ""}
              title="Resumo"
              subtitle="Informações rápidas da ficha"
            >
              <div className="ui-grid-2" style={styles.quickInfoGrid}>
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

            <Card
              className={masterMode ? "ui-master-stamina" : ""}
              title="Fôlego"
              subtitle="Ajuste o fôlego atual do personagem"
            >
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

                <div className="ui-actions" style={styles.staminaActions}>
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

            <CharacterAbilities sheet={sheet} />

            <Card title="Atributos" subtitle="Valores finais">
              <div className="ui-grid" style={styles.attributeGrid}>
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

                    <div className="ui-grid" style={styles.skillGrid}>
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
              <div className="ui-grid" style={styles.progressGrid}>
                <InfoCard label="Pontos totais" value={sheet?.progress?.progressPoints ?? 0} />
                <InfoCard label="Pontos gastos" value={progressPreview.totalSpent} />
                <InfoCard label="Pontos restantes" value={progressPreview.remaining} />
              </div>

              {masterMode ? (
                <MasterProgressDetails sheet={sheet} />
              ) : (
                <>
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

              <StaminaUpgradePurchase
                rolls={sheet?.progress?.staminaUpgradeRolls || []}
                cost={progressPreview.staminaUpgradeCost}
                remainingPoints={progressPreview.remaining}
                staminaBase={sheet.staminaBase ?? 0}
                staminaCurrent={sheet.staminaCurrent ?? 0}
                latestRoll={latestStaminaRoll}
                rolling={rollingStaminaUpgrade}
                error={staminaUpgradeError}
                onRoll={handleBuyStaminaUpgrade}
              />

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
                      <label htmlFor="class-ability-purchase" style={styles.infoLabel}>
                        Habilidade da sua classe
                      </label>
                      <div className="ui-purchase-row" style={styles.purchaseInputRow}>
                        <select
                          id="class-ability-purchase"
                          value={progressForm.newBoughtAbility}
                          onChange={(e) =>
                            setProgressForm((prev) => ({
                              ...prev,
                              newBoughtAbility: e.target.value,
                            }))
                          }
                          style={styles.input}
                        >
                          <option value="">
                            {availableClassAbilities.length
                              ? "Selecione uma habilidade"
                              : "Nenhuma habilidade encontrada para esta classe"}
                          </option>

                          {availableClassAbilities.map((ability) => (
                            <option key={ability} value={ability}>
                              {ability}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={addBoughtAbility}
                          disabled={
                            progressPreview.remaining < progressPreview.existingAbilityCost ||
                            availableClassAbilities.length === 0
                          }
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
                      <p style={styles.infoLabel}>Nova habilidade</p>
                      <div style={styles.customAbilityEditor}>
                        <div style={styles.customAbilityField}>
                          <label htmlFor="custom-ability-name" style={styles.fieldLabel}>
                            Nome
                          </label>
                          <input
                            id="custom-ability-name"
                            type="text"
                            value={progressForm.newCustomAbilityName}
                            onChange={(event) =>
                              setProgressForm((prev) => ({
                                ...prev,
                                newCustomAbilityName: event.target.value,
                              }))
                            }
                            maxLength={MAX_CUSTOM_ABILITY_NAME_LENGTH}
                            style={styles.input}
                            placeholder="Ex.: Visão além do campo"
                          />
                        </div>

                        <div style={styles.customAbilityField}>
                          <label htmlFor="custom-ability-description" style={styles.fieldLabel}>
                            Descrição
                          </label>
                          <textarea
                            id="custom-ability-description"
                            value={progressForm.newCustomAbilityDescription}
                            onChange={(event) =>
                              setProgressForm((prev) => ({
                                ...prev,
                                newCustomAbilityDescription: event.target.value,
                              }))
                            }
                            maxLength={MAX_CUSTOM_ABILITY_DESCRIPTION_LENGTH}
                            rows={4}
                            style={styles.customAbilityTextarea}
                            placeholder="Explique o efeito, quando pode ser usada e suas limitações."
                          />
                          <small style={styles.characterCounter}>
                            {progressForm.newCustomAbilityDescription.length}/
                            {MAX_CUSTOM_ABILITY_DESCRIPTION_LENGTH}
                          </small>
                        </div>

                        <button
                          className="ui-interactive ui-custom-ability-add"
                          type="button"
                          onClick={addCustomAbility}
                          disabled={
                            !progressForm.newCustomAbilityName.trim() ||
                            progressPreview.remaining < progressPreview.customAbilityCost
                          }
                          style={styles.customAbilityAddButton}
                        >
                          Adicionar à progressão
                        </button>
                      </div>

                      <div style={styles.customAbilityList}>
                        {progressForm.customAbilities.length ? (
                          progressForm.customAbilities.map((ability) => {
                            const abilityKey = customAbilityKey(ability);
                            const locked = savedBaseline.customAbilities.some(
                              (savedAbility) =>
                                customAbilityKey(savedAbility) === abilityKey
                            );

                            return (
                              <article key={abilityKey} style={styles.customAbilityCard}>
                                <div style={styles.customAbilityCardHeader}>
                                  <div>
                                    <span style={styles.customAbilityType}>Habilidade criada</span>
                                    <h5 style={styles.customAbilityName}>{ability.name}</h5>
                                  </div>
                                  <span style={locked ? styles.savedPill : styles.pendingPill}>
                                    {locked ? "Salva" : "Pendente"}
                                  </span>
                                </div>

                                <p style={styles.customAbilityDescription}>
                                  {ability.description || "Sem descrição cadastrada."}
                                </p>

                                {!locked ? (
                                  <button
                                    type="button"
                                    onClick={() => removeCustomAbility(ability)}
                                    style={styles.removeCustomAbilityButton}
                                  >
                                    Remover antes de salvar
                                  </button>
                                ) : null}
                              </article>
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

                    <div className="ui-footer-actions" style={styles.purchaseFooter}>
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
                </>
              )}
            </Card>
          </div>

          <div className="ui-sticky-column ui-master-sidebar" style={styles.rightColumn}>
            {masterMode ? (
              <MasterControls
                totalPoints={sheet?.progress?.progressPoints ?? 0}
                spentPoints={progressPreview.totalSpent}
                remainingPoints={progressPreview.remaining}
                pointsDelta={pointsDelta}
                onPointsDeltaChange={setPointsDelta}
                onAddPoints={handleAddPoints}
                saving={savingPoints}
                error={masterError}
                success={masterSuccess}
              />
            ) : null}

            <div className="ui-master-modifiers" style={styles.sidebarStack}>
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
    </div>
  );
}

function Card({ title, subtitle, className = "", children }) {
  return (
    <section className={`ui-card ${className}`.trim()} style={styles.card}>
      <div className="ui-card-header" style={styles.cardHeader}>
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

function CharacterAbilities({ sheet }) {
  const boughtAbilities = Array.isArray(sheet?.progress?.boughtAbilities)
    ? sheet.progress.boughtAbilities
    : [];
  const customAbilities = normalizeCustomAbilities(
    sheet?.progress?.customAbilities
  );
  const hasAbilities = Boolean(sheet?.selectedAbility) ||
    boughtAbilities.length > 0 ||
    customAbilities.length > 0;

  return (
    <Card
      title="Habilidades"
      subtitle="Habilidades iniciais, compradas e criadas do personagem"
    >
      {hasAbilities ? (
        <div className="ui-grid" style={styles.abilityOverviewGrid}>
          {sheet?.selectedAbility ? (
            <AbilityDisplayCard
              type="Inicial"
              name={sheet.selectedAbility}
              accent="blue"
            />
          ) : null}

          {boughtAbilities.map((name) => (
            <AbilityDisplayCard
              key={`bought-${name}`}
              type="Comprada da classe"
              name={name}
              accent="purple"
            />
          ))}

          {customAbilities.map((ability) => (
            <AbilityDisplayCard
              key={`custom-${customAbilityKey(ability)}`}
              type="Criada pelo jogador"
              name={ability.name}
              description={ability.description}
              accent="green"
            />
          ))}
        </div>
      ) : (
        <p style={styles.emptyText}>Nenhuma habilidade cadastrada.</p>
      )}
    </Card>
  );
}

function AbilityDisplayCard({ type, name, description = "", accent = "blue" }) {
  const accentStyle = styles.abilityAccent[accent] || styles.abilityAccent.blue;

  return (
    <article style={{ ...styles.abilityOverviewCard, borderColor: accentStyle.border }}>
      <span style={{ ...styles.abilityOverviewType, color: accentStyle.color }}>
        {type}
      </span>
      <h3 style={styles.abilityOverviewName}>{name}</h3>
      <p style={styles.abilityOverviewDescription}>
        {description || "Sem descrição cadastrada."}
      </p>
    </article>
  );
}

function StaminaUpgradePurchase({
  rolls,
  cost,
  remainingPoints,
  staminaBase,
  staminaCurrent,
  latestRoll,
  rolling,
  error,
  onRoll,
}) {
  const savedRolls = Array.isArray(rolls) ? rolls : [];
  const shownRoll = latestRoll || savedRolls[savedRolls.length - 1] || null;
  const recentRolls = savedRolls.slice(-5).reverse();
  const canBuy = Number(remainingPoints) >= Number(cost);

  return (
    <section className="ui-stamina-purchase" style={styles.staminaPurchaseCard}>
      <div className="ui-stamina-purchase-header" style={styles.staminaPurchaseHeader}>
        <div>
          <span style={styles.staminaPurchaseEyebrow}>Comprar fôlego</span>
          <h4 style={styles.staminaPurchaseTitle}>Role dois dados de 6 lados</h4>
          <p style={styles.staminaPurchaseDescription}>
            O resultado dos dois dados aumenta o fôlego máximo e o atual.
          </p>
        </div>
        <span style={styles.staminaPurchaseCost}>{cost} pontos</span>
      </div>

      <div className="ui-stamina-purchase-grid" style={styles.staminaPurchaseGrid}>
        <div style={styles.dicePanel} aria-live="polite">
          <div
            className={
              rolling
                ? "ui-dice-row is-rolling"
                : latestRoll
                  ? "ui-dice-row is-result"
                  : "ui-dice-row"
            }
            style={styles.diceRow}
          >
            <span className="ui-die" aria-label={shownRoll ? `Primeiro dado: ${shownRoll.die1}` : "Primeiro dado"} style={styles.die}>
              {rolling ? "?" : shownRoll?.die1 ?? "d6"}
            </span>
            <span style={styles.dicePlus}>+</span>
            <span className="ui-die" aria-label={shownRoll ? `Segundo dado: ${shownRoll.die2}` : "Segundo dado"} style={styles.die}>
              {rolling ? "?" : shownRoll?.die2 ?? "d6"}
            </span>
            <span style={styles.diceEquals}>=</span>
            <strong style={styles.diceTotal}>
              {rolling ? "..." : shownRoll ? `+${shownRoll.total}` : "+?"}
            </strong>
          </div>
          <p style={styles.diceHint}>Cada dado pode cair de 1 a 6.</p>
        </div>

        <div style={styles.staminaPurchaseSummary}>
          <InfoLine label="Fôlego atual" value={`${staminaCurrent}/${staminaBase}`} />
          <InfoLine label="Pontos disponíveis" value={remainingPoints} />
          <InfoLine label="Compras realizadas" value={savedRolls.length} />
        </div>
      </div>

      <button
        className="ui-interactive ui-stamina-roll-button"
        type="button"
        onClick={onRoll}
        disabled={rolling || !canBuy}
        style={styles.staminaRollButton}
      >
        {rolling
          ? "Girando os dados..."
          : canBuy
            ? `Girar 2d6 e comprar por ${cost} pontos`
            : `Você precisa de ${cost} pontos disponíveis`}
      </button>

      {latestRoll ? (
        <div role="status" style={styles.staminaRollSuccess}>
          Os dados deram {latestRoll.die1} e {latestRoll.die2}: fôlego aumentado em {latestRoll.total}.
        </div>
      ) : null}
      {error ? <div style={styles.errorBox}>{error}</div> : null}

      {recentRolls.length ? (
        <div style={styles.staminaRollHistory}>
          <span style={styles.infoLabel}>Rolagens recentes</span>
          <div style={styles.staminaRollTags}>
            {recentRolls.map((roll, index) => (
              <span key={`${roll.rolledAt || "roll"}-${savedRolls.length - index}`} style={styles.staminaRollTag}>
                {roll.die1} + {roll.die2} = +{roll.total}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p style={styles.staminaPurchaseWarning}>
        A compra é permanente e não pode ser desfeita depois da rolagem.
      </p>
    </section>
  );
}

function MasterSheetActions({
  characterName,
  staminaCurrent,
  staminaBase,
  staminaDraft,
  onStaminaDraftChange,
  onSaveStamina,
  savingStamina,
  onDeleteCharacter,
  deletingCharacter,
  deleteError,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <section
      className="ui-card ui-master-sheet-actions"
      style={{ ...styles.card, ...styles.masterSheetActionsCard }}
    >
      <div className="ui-card-header" style={styles.masterSheetActionsHeader}>
        <div>
          <p style={styles.masterEyebrow}>Ações do mestre</p>
          <h2 style={styles.cardTitle}>Controle rápido da ficha</h2>
          <p style={styles.cardSubtitle}>
            Atualize o fôlego durante a sessão ou remova esta ficha.
          </p>
        </div>
        <div style={styles.masterStaminaReadout}>
          <span style={styles.infoLabel}>Fôlego atual</span>
          <strong>{staminaCurrent} / {staminaBase}</strong>
        </div>
      </div>

      <div className="ui-master-sheet-actions-grid" style={styles.masterSheetActionsGrid}>
        <div style={styles.masterQuickActionBlock}>
          <label htmlFor="master-stamina-current" style={styles.infoLabel}>
            Definir fôlego atual
          </label>
          <div className="ui-purchase-row" style={styles.masterInputRow}>
            <input
              id="master-stamina-current"
              type="number"
              inputMode="numeric"
              min={0}
              max={staminaBase}
              value={staminaDraft}
              onChange={(event) => onStaminaDraftChange(event.target.value)}
              style={styles.input}
            />
            <button
              className="ui-interactive"
              type="button"
              onClick={onSaveStamina}
              disabled={savingStamina || staminaDraft === ""}
              style={styles.masterActionButton}
            >
              {savingStamina ? "Salvando..." : "Salvar fôlego"}
            </button>
          </div>
          <p style={styles.masterHint}>Aceita valores entre 0 e {staminaBase}.</p>
        </div>

        <div style={styles.masterDangerZone}>
          <div>
            <span style={styles.masterDangerLabel}>Zona de risco</span>
            <p style={styles.masterDangerDescription}>
              A exclusão remove a ficha permanentemente.
            </p>
          </div>

          {confirmingDelete ? (
            <div role="alert" style={styles.masterDeleteConfirmation}>
              <p style={styles.masterDeleteText}>
                Excluir <strong>{characterName}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="ui-actions" style={styles.masterDeleteActions}>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deletingCharacter}
                  style={styles.masterCancelDeleteButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onDeleteCharacter}
                  disabled={deletingCharacter}
                  style={styles.masterConfirmDeleteButton}
                >
                  {deletingCharacter ? "Excluindo..." : "Excluir permanentemente"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="ui-interactive"
              type="button"
              onClick={() => setConfirmingDelete(true)}
              style={styles.masterDeleteButton}
            >
              Excluir ficha
            </button>
          )}

          {deleteError ? <div style={styles.errorBox}>{deleteError}</div> : null}
        </div>
      </div>
    </section>
  );
}

function MasterControls({
  totalPoints,
  spentPoints,
  remainingPoints,
  pointsDelta,
  onPointsDeltaChange,
  onAddPoints,
  saving,
  error,
  success,
}) {
  return (
    <section className="ui-card ui-master-control" style={{ ...styles.card, ...styles.masterControlCard }}>
      <p style={styles.masterEyebrow}>Controles do mestre</p>
      <h2 style={styles.cardTitle}>Gerenciar progressão</h2>
      <p style={styles.cardSubtitle}>
        Consulte o uso dos pontos e conceda novos pontos ao jogador.
      </p>

      <div className="ui-grid ui-compact-stats" style={styles.masterPointsGrid}>
        <InfoCard label="Concedidos" value={totalPoints} />
        <InfoCard label="Gastos" value={spentPoints} />
        <InfoCard label="Disponíveis" value={remainingPoints} />
      </div>

      <div style={styles.masterGrantBox}>
        <label style={styles.infoLabel}>Quantidade de pontos</label>
        <div style={styles.quickPointActions}>
          {[1, 3, 5].map((amount) => (
            <button
              className="ui-interactive"
              key={amount}
              type="button"
              onClick={() => onPointsDeltaChange(amount)}
              style={styles.quickPointButton}
            >
              +{amount}
            </button>
          ))}
        </div>

        <div className="ui-purchase-row" style={styles.masterInputRow}>
          <input
            type="number"
            value={pointsDelta}
            onChange={(event) => onPointsDeltaChange(event.target.value)}
            style={styles.input}
            aria-label="Quantidade de pontos"
          />
          <button
            className="ui-interactive"
            type="button"
            onClick={onAddPoints}
            disabled={saving}
            style={styles.masterActionButton}
          >
            {saving ? "Aplicando..." : "Aplicar"}
          </button>
        </div>

        <p style={styles.masterHint}>
          Use um valor negativo somente quando precisar corrigir pontos concedidos.
        </p>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}
      {success ? <div style={styles.successBox}>{success}</div> : null}
    </section>
  );
}

function MasterProgressDetails({ sheet }) {
  const attributeEntries = Object.entries(sheet?.levelUpAttributes || {}).filter(
    ([, value]) => Number(value || 0) > 0
  );
  const skillEntries = Object.entries(sheet?.levelUpSkills || {}).filter(
    ([, value]) => Number(value || 0) > 0
  );
  const boughtAbilities = sheet?.progress?.boughtAbilities || [];
  const customAbilities = sheet?.progress?.customAbilities || [];
  const staminaUpgradeRolls = sheet?.progress?.staminaUpgradeRolls || [];
  const attributeCount = sumValues(sheet?.levelUpAttributes);
  const skillCount = sumValues(sheet?.levelUpSkills);

  return (
    <div style={styles.masterProgressDetails}>
      <h4 style={styles.rulesTitle}>Detalhamento dos gastos</h4>

      <div className="ui-grid" style={styles.masterBreakdownGrid}>
        <ProgressBreakdown
          label="Atributos"
          quantity={attributeCount}
          cost={attributeCount * 2}
        />
        <ProgressBreakdown label="Perícias" quantity={skillCount} cost={skillCount} />
        <ProgressBreakdown
          label="Habilidades da classe"
          quantity={boughtAbilities.length}
          cost={boughtAbilities.length * Number(sheet?.progress?.existingAbilityCost || 0)}
        />
        <ProgressBreakdown
          label="Habilidades criadas"
          quantity={customAbilities.length}
          cost={customAbilities.length * Number(sheet?.progress?.customAbilityCost || 0)}
        />
        <ProgressBreakdown
          label="Fôlego"
          quantity={staminaUpgradeRolls.length}
          cost={staminaUpgradeRolls.length * Number(sheet?.progress?.staminaUpgradeCost || 0)}
        />
      </div>

      <PurchaseList
        title="Atributos comprados"
        entries={attributeEntries.map(([key, value]) => [attributeLabels[key] || key, value])}
      />
      <PurchaseList
        title="Perícias compradas"
        entries={skillEntries.map(([key, value]) => [skillLabels[key] || key, value])}
      />
      <PurchaseList
        title="Habilidades adquiridas"
        entries={[
          ...boughtAbilities.map((name) => [name, 1]),
          ...customAbilities.map((ability) => [ability.name, 1]),
        ]}
      />
      <PurchaseList
        title="Compras de fôlego"
        entries={staminaUpgradeRolls.map((roll, index) => [
          `Rolagem ${index + 1}: ${roll.die1} + ${roll.die2} = +${roll.total}`,
          1,
        ])}
      />
    </div>
  );
}

function ProgressBreakdown({ label, quantity, cost }) {
  return (
    <div style={styles.breakdownCard}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.breakdownValue}>{cost} pts</strong>
      <small style={styles.breakdownMeta}>{quantity} compra(s)</small>
    </div>
  );
}

function PurchaseList({ title, entries }) {
  return (
    <div style={styles.purchaseSummaryBlock}>
      <h5 style={styles.purchaseSummaryTitle}>{title}</h5>
      {entries.length ? (
        <div style={styles.tagWrap}>
          {entries.map(([label, value]) => (
            <span key={label} style={styles.readOnlyTag}>
              {label}{Number(value) > 1 ? ` ×${value}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <p style={styles.emptyText}>Nenhuma compra registrada.</p>
      )}
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
  sidebarStack: {
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
  fieldLabel: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: 700,
  },
  customAbilityEditor: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(2,6,23,0.34)",
  },
  customAbilityField: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  customAbilityTextarea: {
    width: "100%",
    minHeight: 116,
    resize: "vertical",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f8fafc",
    padding: "12px 14px",
    outline: "none",
    lineHeight: 1.55,
  },
  characterCounter: {
    alignSelf: "flex-end",
    color: "#64748b",
    fontSize: 11,
  },
  customAbilityAddButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#fff",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  customAbilityList: {
    display: "grid",
    gap: 10,
    marginTop: 4,
  },
  customAbilityCard: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(52,211,153,0.2)",
    background: "linear-gradient(145deg, rgba(6,78,59,0.16), rgba(2,6,23,0.32))",
  },
  customAbilityCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  customAbilityType: {
    color: "#6ee7b7",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  customAbilityName: {
    margin: "5px 0 0",
    color: "#f8fafc",
    fontSize: 18,
  },
  customAbilityDescription: {
    margin: "12px 0 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  savedPill: {
    flexShrink: 0,
    border: "1px solid rgba(52,211,153,0.3)",
    borderRadius: 999,
    background: "rgba(16,185,129,0.12)",
    color: "#a7f3d0",
    padding: "6px 9px",
    fontSize: 11,
    fontWeight: 800,
  },
  pendingPill: {
    flexShrink: 0,
    border: "1px solid rgba(251,191,36,0.3)",
    borderRadius: 999,
    background: "rgba(245,158,11,0.12)",
    color: "#fde68a",
    padding: "6px 9px",
    fontSize: 11,
    fontWeight: 800,
  },
  removeCustomAbilityButton: {
    marginTop: 12,
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 12,
    background: "rgba(127,29,29,0.12)",
    color: "#fecaca",
    padding: "9px 11px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
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
  abilityOverviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  abilityOverviewCard: {
    minWidth: 0,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,0.2)",
    background: "rgba(2,6,23,0.36)",
    padding: 16,
  },
  abilityOverviewType: {
    display: "block",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  abilityOverviewName: {
    margin: "7px 0 0",
    fontSize: 17,
    overflowWrap: "anywhere",
  },
  abilityOverviewDescription: {
    margin: "10px 0 0",
    color: "#94a3b8",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  abilityAccent: {
    blue: { border: "rgba(96,165,250,0.24)", color: "#93c5fd" },
    purple: { border: "rgba(192,132,252,0.24)", color: "#d8b4fe" },
    green: { border: "rgba(52,211,153,0.24)", color: "#6ee7b7" },
  },
  staminaPurchaseCard: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    border: "1px solid rgba(52,211,153,0.24)",
    background:
      "linear-gradient(135deg, rgba(6,78,59,0.2), rgba(15,23,42,0.9) 58%, rgba(30,58,138,0.2))",
  },
  staminaPurchaseHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  staminaPurchaseEyebrow: {
    color: "#6ee7b7",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  staminaPurchaseTitle: {
    margin: "6px 0 0",
    color: "#f8fafc",
    fontSize: 20,
  },
  staminaPurchaseDescription: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.55,
  },
  staminaPurchaseCost: {
    flexShrink: 0,
    padding: "8px 11px",
    borderRadius: 999,
    border: "1px solid rgba(52,211,153,0.3)",
    background: "rgba(16,185,129,0.12)",
    color: "#a7f3d0",
    fontSize: 12,
    fontWeight: 800,
  },
  staminaPurchaseGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(220px, 0.75fr)",
    gap: 12,
  },
  dicePanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 132,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,0.2)",
    background: "rgba(2,6,23,0.42)",
  },
  diceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  die: {
    width: 54,
    height: 54,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    border: "1px solid rgba(147,197,253,0.32)",
    background: "linear-gradient(145deg, #1d4ed8, #312e81)",
    color: "#fff",
    boxShadow: "0 12px 28px rgba(37,99,235,0.25)",
    fontSize: 22,
    fontWeight: 900,
  },
  dicePlus: {
    color: "#64748b",
    fontSize: 20,
    fontWeight: 800,
  },
  diceEquals: {
    color: "#64748b",
    fontSize: 18,
    fontWeight: 800,
  },
  diceTotal: {
    minWidth: 56,
    color: "#6ee7b7",
    fontSize: 26,
    textAlign: "center",
  },
  diceHint: {
    margin: 0,
    color: "#64748b",
    fontSize: 12,
  },
  staminaPurchaseSummary: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.025)",
  },
  staminaRollButton: {
    minHeight: 52,
    width: "100%",
    border: "none",
    borderRadius: 16,
    background: "linear-gradient(135deg, #059669, #2563eb)",
    color: "#fff",
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 32px rgba(5,150,105,0.2)",
  },
  staminaRollSuccess: {
    padding: 13,
    borderRadius: 14,
    border: "1px solid rgba(52,211,153,0.3)",
    background: "rgba(16,185,129,0.12)",
    color: "#a7f3d0",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  staminaRollHistory: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  staminaRollTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  staminaRollTag: {
    display: "inline-flex",
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(37,99,235,0.1)",
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: 700,
  },
  staminaPurchaseWarning: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
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
  masterInputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 140px",
    gap: 10,
    alignItems: "center",
  },
  masterActionButton: {
    minHeight: 48,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#fff",
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  masterSheetActionsCard: {
    border: "1px solid rgba(96,165,250,0.3)",
    background:
      "linear-gradient(135deg, rgba(30,58,138,0.25), rgba(15,23,42,0.96) 55%, rgba(69,10,10,0.2))",
  },
  masterSheetActionsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  masterStaminaReadout: {
    minWidth: 132,
    padding: "12px 16px",
    borderRadius: 16,
    border: "1px solid rgba(96,165,250,0.22)",
    background: "rgba(37,99,235,0.12)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    textAlign: "right",
  },
  masterSheetActionsGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
    gap: 16,
    marginTop: 18,
  },
  masterQuickActionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(96,165,250,0.18)",
    background: "rgba(2,6,23,0.34)",
  },
  masterDangerZone: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(248,113,113,0.25)",
    background: "rgba(127,29,29,0.12)",
  },
  masterDangerLabel: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  masterDangerDescription: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.5,
  },
  masterDeleteButton: {
    minHeight: 48,
    border: "1px solid rgba(248,113,113,0.38)",
    borderRadius: 14,
    background: "rgba(127,29,29,0.3)",
    color: "#fecaca",
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
  },
  masterDeleteConfirmation: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  masterDeleteText: {
    margin: 0,
    color: "#fee2e2",
    fontSize: 13,
    lineHeight: 1.5,
  },
  masterDeleteActions: {
    display: "flex",
    gap: 8,
  },
  masterCancelDeleteButton: {
    flex: 1,
    minHeight: 44,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    color: "#e2e8f0",
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  masterConfirmDeleteButton: {
    flex: 1.4,
    minHeight: 44,
    border: "1px solid rgba(248,113,113,0.42)",
    borderRadius: 12,
    background: "linear-gradient(135deg, #991b1b, #b91c1c)",
    color: "#fff",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  masterControlCard: {
    border: "1px solid rgba(96,165,250,0.3)",
    background:
      "linear-gradient(180deg, rgba(30,58,138,0.3), rgba(15,23,42,0.92))",
  },
  masterEyebrow: {
    margin: "0 0 8px",
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  masterPointsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginTop: 18,
  },
  masterGrantBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    background: "rgba(2,6,23,0.42)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  quickPointActions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  quickPointButton: {
    border: "1px solid rgba(96,165,250,0.22)",
    borderRadius: 12,
    background: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    padding: "9px 10px",
    fontWeight: 800,
    cursor: "pointer",
  },
  masterHint: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
  },
  masterProgressDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    background: "rgba(2,6,23,0.32)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  masterBreakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  breakdownCard: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  breakdownValue: {
    fontSize: 20,
    color: "#dbeafe",
  },
  breakdownMeta: {
    color: "#64748b",
    fontSize: 12,
  },
  purchaseSummaryBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  purchaseSummaryTitle: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: 14,
  },
  readOnlyTag: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "7px 10px",
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(96,165,250,0.18)",
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: 700,
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
