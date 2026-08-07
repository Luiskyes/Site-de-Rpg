"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppTopBar from "./components/AppTopBar";
import homeStyles from "./home.module.css";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        setUser(data.user ?? null);
        setCharacter(data.character ?? null);
        setCampaign(data.campaign ?? null);
        setRanking(data.ranking ?? null);
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("HOME LOAD ERROR:", error);
        router.replace("/login");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, [router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  const hasCharacter = Boolean(character);
  const isMaster = Boolean(user?.isMaster);
  const characterHref = hasCharacter
    ? `/characters/${character.id}`
    : "/characters/create";

  const hero = useMemo(() => {
    if (isMaster) {
      return {
        eyebrow: "Central da campanha",
        title: "A mesa está pronta.",
        description:
          "Conduza a campanha, acompanhe cada jogador e mantenha o ritmo da próxima sessão em um só lugar.",
        status: "Visão do mestre ativa",
      };
    }

    if (hasCharacter) {
      return {
        eyebrow: "Jornada em andamento",
        title: `${character.name} volta ao campo.`,
        description:
          "Sua ficha, seu progresso e cada nova escolha estão reunidos para você continuar exatamente de onde parou.",
        status: "Ficha pronta para jogar",
      };
    }

    return {
      eyebrow: "O início da jornada",
      title: "Toda lenda começa com uma ficha.",
      description:
        "Crie seu personagem, escolha sua classe e prepare a primeira decisão da sua história em Keys Lock.",
      status: "Aguardando personagem",
    };
  }, [character, hasCharacter, isMaster]);

  const overview = useMemo(() => {
    if (isMaster) {
      return [
        {
          label: "Fichas na campanha",
          value: campaign?.characterCount ?? 0,
          meta: "personagens registrados",
          tone: "blue",
        },
        {
          label: "Jogadores",
          value: campaign?.playerCount ?? 0,
          meta: "com ficha vinculada",
          tone: "cyan",
        },
        {
          label: "Sua ficha",
          value: hasCharacter ? character.name : "Não criada",
          meta: hasCharacter ? character.class || "Sem classe" : "opcional para o mestre",
          tone: "violet",
          compact: true,
        },
        {
          label: "Acesso",
          value: "Mestre",
          meta: "controle da campanha",
          tone: "slate",
        },
      ];
    }

    return [
      {
        label: "Personagem",
        value: hasCharacter ? character.name : "Não criado",
        meta: hasCharacter ? "ficha ativa" : "comece sua jornada",
        tone: "blue",
        compact: true,
      },
      {
        label: "Classe",
        value: hasCharacter ? character.class || "—" : "—",
        meta: "função em campo",
        tone: "cyan",
      },
      {
        label: "Nível",
        value: hasCharacter ? character.level ?? 1 : "—",
        meta: "progressão atual",
        tone: "violet",
      },
      {
        label: "Status",
        value: hasCharacter ? "Pronto" : "Pendente",
        meta: hasCharacter ? "ficha disponível" : "crie sua ficha",
        tone: "slate",
      },
    ];
  }, [campaign, character, hasCharacter, isMaster]);

  if (loading) {
    return (
      <div className="ui-loading-page" style={loadingStyles.page}>
        <div
          className={`ui-loading-card ${homeStyles.loadingCard}`}
          role="status"
          aria-live="polite"
        >
          <span className={homeStyles.loadingMark}>K</span>
          <span>Preparando seu painel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ui-page ${homeStyles.page}`}>
      <div className={`${homeStyles.orb} ${homeStyles.orbTop}`} aria-hidden="true" />
      <div className={`${homeStyles.orb} ${homeStyles.orbBottom}`} aria-hidden="true" />
      <div className={homeStyles.fieldLines} aria-hidden="true" />

      <div className={`ui-container ${homeStyles.container}`}>
        <AppTopBar
          context="Painel principal"
          action={
            <button
              className={`ui-interactive ${homeStyles.logoutButton}`}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          }
        />

        <main className={homeStyles.main}>
          <section className={`ui-hero ${homeStyles.hero}`}>
            <div className={homeStyles.heroCopy}>
              <div className={homeStyles.commandLine}>
                <span className={homeStyles.liveDot} aria-hidden="true" />
                <span>{hero.eyebrow}</span>
                <span className={homeStyles.commandCode}>KL / 01</span>
              </div>

              <h1 className={`ui-title ${homeStyles.heroTitle}`}>{hero.title}</h1>
              <p className={homeStyles.heroDescription}>{hero.description}</p>

              <div className={homeStyles.heroActions}>
                <Link
                  href={isMaster ? "/master" : characterHref}
                  className={`ui-interactive ${homeStyles.primaryButton}`}
                >
                  {isMaster
                    ? "Abrir painel do mestre"
                    : hasCharacter
                      ? "Continuar personagem"
                      : "Criar meu personagem"}
                  <ArrowIcon />
                </Link>

                {isMaster ? (
                  <Link
                    href={characterHref}
                    className={`ui-interactive ${homeStyles.ghostButton}`}
                  >
                    {hasCharacter ? "Ver minha ficha" : "Criar minha ficha"}
                  </Link>
                ) : hasCharacter ? (
                  <Link
                    href="/characters"
                    className={`ui-interactive ${homeStyles.ghostButton}`}
                  >
                    Visão geral
                  </Link>
                ) : null}
              </div>

              <p className={`ui-break-word ${homeStyles.accountLine}`}>
                <span>Conta conectada</span>
                {user?.email || "—"}
              </p>
            </div>

            <div className={`ui-hero-side ${homeStyles.identityPanel}`}>
              <div className={homeStyles.sigil} aria-hidden="true">
                <span className={homeStyles.sigilOrbit} />
                <span className={homeStyles.sigilCore}>K</span>
                <span className={homeStyles.sigilIndex}>01</span>
              </div>

              <div className={homeStyles.identityCopy}>
                <span className={homeStyles.identityEyebrow}>
                  {isMaster ? "Visão do mestre" : "Ficha em foco"}
                </span>
                <h2>
                  {isMaster
                    ? "Campanha Keys Lock"
                    : hasCharacter
                      ? character.name
                      : "Novo personagem"}
                </h2>
                <p>
                  {isMaster
                    ? `${campaign?.characterCount ?? 0} ${
                        Number(campaign?.characterCount || 0) === 1 ? "ficha ativa" : "fichas ativas"
                      } na campanha.`
                    : hasCharacter
                      ? `${character.class || "Sem classe"} · Nível ${character.level ?? 1}`
                      : "O primeiro capítulo ainda está em branco."}
                </p>
                <div className={homeStyles.identityStatus}>
                  <span aria-hidden="true" />
                  {hero.status}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="overview-title" className={homeStyles.section}>
            <SectionHeading
              index="02"
              eyebrow="Leitura rápida"
              title="Tudo que importa, sem perder o ritmo."
              id="overview-title"
            />

            <div className={homeStyles.overviewGrid}>
              {overview.map((item, index) => (
                <MetricCard key={item.label} index={index + 1} {...item} />
              ))}
            </div>
          </section>

          <section aria-labelledby="routes-title" className={homeStyles.section}>
            <SectionHeading
              index="03"
              eyebrow="Próximo movimento"
              title="Escolha sua rota."
              id="routes-title"
            />

            <div className={homeStyles.routeGrid}>
              <RouteCard
                href={characterHref}
                index="01"
                eyebrow="Área do jogador"
                title={hasCharacter ? "Abrir ficha" : "Criar ficha"}
                description={
                  hasCharacter
                    ? "Entre na ficha completa para consultar atributos, habilidades, fôlego e progressão."
                    : "Defina classe, atributos e habilidade inicial para colocar seu personagem em campo."
                }
                footer={hasCharacter ? character.name : "Começar agora"}
                accent="blue"
              />

              {isMaster ? (
                <RouteCard
                  href="/master"
                  index="02"
                  eyebrow="Área do mestre"
                  title="Conduzir campanha"
                  description="Distribua pontos, acompanhe o fôlego e consulte cada ficha sem interromper a sessão."
                  footer={`${campaign?.playerCount ?? 0} ${
                    Number(campaign?.playerCount || 0) === 1 ? "jogador" : "jogadores"
                  } na mesa`}
                  accent="violet"
                />
              ) : (
                <PlayerRanking ranking={ranking} />
              )}
            </div>
          </section>

          <footer className={homeStyles.manifesto}>
            <span className={homeStyles.manifestoLine} aria-hidden="true" />
            <p>Leia o campo. Escolha o momento. Deixe sua marca.</p>
            <span className={homeStyles.manifestoCode}>KEYS / LOCK</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SectionHeading({ index, eyebrow, title, id }) {
  return (
    <div className={homeStyles.sectionHeading}>
      <span className={homeStyles.sectionIndex}>{index}</span>
      <div>
        <p>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  );
}

function MetricCard({ index, label, value, meta, tone, compact = false }) {
  return (
    <article className={`${homeStyles.metricCard} ${homeStyles[`metric_${tone}`]}`}>
      <div className={homeStyles.metricTopline}>
        <span>{String(index).padStart(2, "0")}</span>
        <span className={homeStyles.metricPulse} aria-hidden="true" />
      </div>
      <p>{label}</p>
      <strong className={compact ? homeStyles.metricCompact : undefined}>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}

function RouteCard({ href, index, eyebrow, title, description, footer, accent }) {
  return (
    <Link
      href={href}
      className={`ui-interactive ${homeStyles.routeCard} ${homeStyles[`route_${accent}`]}`}
    >
      <div className={homeStyles.routeTopline}>
        <span>{index}</span>
        <span>{eyebrow}</span>
      </div>
      <div className={homeStyles.routeBody}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={homeStyles.routeFooter}>
        <span>{footer}</span>
        <span className={homeStyles.routeArrow} aria-hidden="true">
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

const PLAYER_RANKING_TABS = [
  { key: "scorers", label: "Artilharia", metric: "Gols" },
  { key: "assists", label: "Mestre das Assistências", metric: "Assist." },
  { key: "bestPlayers", label: "Melhores Jogadores", metric: "Nota" },
];

function formatRankingValue(value, category) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";

  if (category === "bestPlayers") {
    return numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  return numericValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function PlayerRanking({ ranking }) {
  const [activeTab, setActiveTab] = useState("scorers");
  const isPublished = Boolean(ranking?.isPublished);
  const activeDefinition =
    PLAYER_RANKING_TABS.find((tab) => tab.key === activeTab) || PLAYER_RANKING_TABS[0];
  const entries = isPublished
    ? ranking?.categories?.[activeTab] || []
    : [];

  return (
    <article className={homeStyles.rankingCard}>
      <div className={homeStyles.rankingHeader}>
        <div>
          <span className={homeStyles.rankingIndex}>02 / RANKING</span>
          <h3>Ranking da campanha</h3>
        </div>
        <span
          className={
            isPublished ? homeStyles.rankingLive : homeStyles.rankingPrivate
          }
        >
          <span aria-hidden="true" />
          {isPublished ? "Publicado" : "Privado"}
        </span>
      </div>

      {isPublished ? (
        <>
          <div
            className={homeStyles.rankingTabs}
            role="tablist"
            aria-label="Categorias do ranking"
          >
            {PLAYER_RANKING_TABS.map((tab) => (
              <button
                className={
                  activeTab === tab.key
                    ? homeStyles.rankingTabActive
                    : homeStyles.rankingTab
                }
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

          <div className={homeStyles.rankingList}>
            {entries.length ? (
              entries.map((entry, index) => (
                <div className={homeStyles.rankingRow} key={`${activeTab}-${entry.characterId}`}>
                  <span className={homeStyles.rankingPosition}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{entry.name}</strong>
                    <span>{entry.class || "Sem classe"}</span>
                  </div>
                  <div className={homeStyles.rankingValue}>
                    <strong>{formatRankingValue(entry.value, activeTab)}</strong>
                    <span>{activeDefinition.metric}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={homeStyles.rankingEmpty}>
                Nenhum jogador lançado nesta categoria.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={homeStyles.rankingLocked}>
          <span className={homeStyles.rankingLock} aria-hidden="true">K</span>
          <div>
            <strong>Ranking em atualização</strong>
            <p>O mestre ainda não desprivou os resultados da campanha.</p>
          </div>
        </div>
      )}
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const loadingStyles = {
  page: {
    minHeight: "100vh",
    background: "#060c18",
    color: "#f8fafc",
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
};
