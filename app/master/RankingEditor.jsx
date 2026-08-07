"use client";

import { useMemo, useState } from "react";
import styles from "./ranking-editor.module.css";

const TABS = [
  { key: "scorers", label: "Artilharia", metric: "Gols" },
  { key: "assists", label: "Mestre das Assistências", metric: "Assistências" },
  { key: "bestPlayers", label: "Melhores Jogadores", metric: "Nota" },
];

const EMPTY_RANKINGS = {
  scorers: [],
  assists: [],
  bestPlayers: [],
};

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function copyDraft(value) {
  return {
    scorers: [...(value?.scorers || [])],
    assists: [...(value?.assists || [])],
    bestPlayers: [...(value?.bestPlayers || [])],
  };
}

export default function RankingEditor({ characters, initialRanking }) {
  const [activeTab, setActiveTab] = useState("scorers");
  const [board, setBoard] = useState(
    initialRanking || { isPublished: false, draft: EMPTY_RANKINGS }
  );
  const [draft, setDraft] = useState(
    copyDraft(initialRanking?.draft || EMPTY_RANKINGS)
  );
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeDefinition = TABS.find((tab) => tab.key === activeTab) || TABS[0];
  const activeEntries = draft[activeTab] || [];
  const selectedIds = useMemo(
    () => new Set(activeEntries.map((entry) => Number(entry.characterId))),
    [activeEntries]
  );
  const firstAvailableCharacter = characters.find(
    (character) => !selectedIds.has(Number(character.id))
  );
  const isPublished = Boolean(board?.isPublished);
  const isBusy = Boolean(busyAction);

  function updateEntry(index, field, value) {
    if (isPublished) return;

    setDraft((current) => ({
      ...current,
      [activeTab]: current[activeTab].map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: field === "characterId" ? Number(value) : value,
            }
          : entry
      ),
    }));
    setMessage("");
  }

  function addEntry() {
    if (isPublished || !firstAvailableCharacter) return;

    setDraft((current) => ({
      ...current,
      [activeTab]: [
        ...current[activeTab],
        { characterId: Number(firstAvailableCharacter.id), value: 0 },
      ],
    }));
    setMessage("");
  }

  function removeEntry(index) {
    if (isPublished) return;

    setDraft((current) => ({
      ...current,
      [activeTab]: current[activeTab].filter((_, entryIndex) => entryIndex !== index),
    }));
    setMessage("");
  }

  function applyServerBoard(data) {
    setBoard(data);
    setDraft(copyDraft(data?.draft || EMPTY_RANKINGS));
  }

  async function saveDraft() {
    if (isPublished || isBusy) return;

    try {
      setBusyAction("save");
      setError("");
      setMessage("");

      const response = await fetch("/api/master/rankings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankings: draft }),
      });
      const data = await safeJson(response);

      if (!response.ok || !data) {
        setError(data?.error || "Não foi possível salvar o rascunho.");
        return;
      }

      applyServerBoard(data);
      setMessage("Rascunho privado salvo.");
    } catch (err) {
      console.error("RANKING DRAFT SAVE ERROR:", err);
      setError("Erro inesperado ao salvar o rascunho.");
    } finally {
      setBusyAction("");
    }
  }

  async function togglePrivacy() {
    if (isBusy) return;

    const action = isPublished ? "privatize" : "publish";

    try {
      setBusyAction(action);
      setError("");
      setMessage("");

      const response = await fetch("/api/master/rankings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rankings: draft }),
      });
      const data = await safeJson(response);

      if (!response.ok || !data) {
        setError(data?.error || "Não foi possível alterar a privacidade.");
        return;
      }

      applyServerBoard(data);
      setMessage(
        action === "publish"
          ? "Ranking desprivado e publicado para os jogadores."
          : "Ranking privado. Agora você pode atualizá-lo."
      );
    } catch (err) {
      console.error("RANKING PRIVACY ERROR:", err);
      setError("Erro inesperado ao alterar a privacidade do ranking.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className={`ui-card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Central de rankings</p>
          <h2>Ranking dos jogadores</h2>
          <p>
            Preencha o rascunho em privado e desprive-o somente quando estiver pronto.
          </p>
        </div>

        <span className={isPublished ? styles.publicStatus : styles.privateStatus}>
          <span aria-hidden="true" />
          {isPublished ? "Público" : "Privado"}
        </span>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Categorias do ranking">
        {TABS.map((tab) => (
          <button
            className={activeTab === tab.key ? styles.activeTab : styles.tab}
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.editorHeader}>
        <div>
          <span>Categoria ativa</span>
          <strong>{activeDefinition.label}</strong>
        </div>
        <button
          className={`ui-interactive ${styles.addButton}`}
          type="button"
          onClick={addEntry}
          disabled={isPublished || !firstAvailableCharacter || isBusy}
        >
          + Adicionar jogador
        </button>
      </div>

      {isPublished ? (
        <div className={styles.lockedNotice}>
          O ranking está visível aos jogadores. Prive-o para alterar nomes ou valores.
        </div>
      ) : null}

      <div className={styles.entries}>
        {activeEntries.length ? (
          activeEntries.map((entry, index) => (
            <div className={styles.entry} key={`${activeTab}-${index}`}>
              <span className={styles.position}>{String(index + 1).padStart(2, "0")}</span>

              <label>
                <span>Jogador</span>
                <select
                  value={entry.characterId}
                  onChange={(event) => updateEntry(index, "characterId", event.target.value)}
                  disabled={isPublished || isBusy}
                >
                  {characters.map((character) => (
                    <option
                      key={character.id}
                      value={character.id}
                      disabled={
                        Number(character.id) !== Number(entry.characterId) &&
                        selectedIds.has(Number(character.id))
                      }
                    >
                      {character.name} · {character.class || "Sem classe"}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.valueField}>
                <span>{activeDefinition.metric}</span>
                <input
                  type="number"
                  min={0}
                  max={activeTab === "bestPlayers" ? 10 : 999999}
                  step={activeTab === "bestPlayers" ? 0.1 : 1}
                  inputMode={activeTab === "bestPlayers" ? "decimal" : "numeric"}
                  value={entry.value}
                  onChange={(event) => updateEntry(index, "value", event.target.value)}
                  disabled={isPublished || isBusy}
                />
              </label>

              <button
                className={styles.removeButton}
                type="button"
                onClick={() => removeEntry(index)}
                disabled={isPublished || isBusy}
                aria-label={`Remover posição ${index + 1}`}
              >
                Remover
              </button>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <strong>Nenhum jogador nesta categoria.</strong>
            <span>Adicione uma ficha e informe o valor para montar o ranking.</span>
          </div>
        )}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {message ? <div className={styles.success}>{message}</div> : null}

      <div className={styles.footer}>
        <p>
          {isPublished
            ? "A versão publicada permanece travada até você privar novamente."
            : "Enquanto estiver privado, nenhuma alteração aparece para os jogadores."}
        </p>

        <div className={styles.actions}>
          <button
            className={`ui-interactive ${styles.saveButton}`}
            type="button"
            onClick={saveDraft}
            disabled={isPublished || isBusy}
          >
            {busyAction === "save" ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            className={`ui-interactive ${isPublished ? styles.privateButton : styles.publishButton}`}
            type="button"
            onClick={togglePrivacy}
            disabled={isBusy}
          >
            {busyAction === "publish"
              ? "Desprivando..."
              : busyAction === "privatize"
                ? "Privando..."
                : isPublished
                  ? "Privar para atualizar"
                  : "Desprivar e publicar"}
          </button>
        </div>
      </div>
    </section>
  );
}
