"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!userResponse.ok) {
          router.push("/login");
          return;
        }

        const userData = await userResponse.json();
        setUser(userData);

        const characterResponse = await fetch("/api/characters/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (characterResponse.ok) {
          const characterData = await characterResponse.json();
          setCharacter(characterData);
        } else {
          setCharacter(null);
        }
      } catch (error) {
        console.error("HOME LOAD ERROR:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadData();
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

  const hasCharacter = !!character;
  const mainHref = hasCharacter ? `/characters/${character.id}` : "/characters/create";

  const homeStats = useMemo(() => {
    return [
      {
        label: "Conta",
        value: user?.email || "-",
        small: true,
      },
      {
        label: "Status",
        value: hasCharacter ? "Ficha criada" : "Sem ficha",
      },
      {
        label: "Classe",
        value: hasCharacter ? character.class || "-" : "-",
      },
      {
        label: "Perfil",
        value: user?.isMaster ? "Mestre" : "Jogador",
      },
    ];
  }, [user, character, hasCharacter]);

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando home...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgOrbTop} />
      <div style={styles.bgOrbBottom} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={styles.logoutButton}
          >
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>

        <section style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroTag}>Painel Principal</p>
            <h1 style={styles.heroTitle}>
              Bem-vindo{user?.email ? `, ${user.email}` : ""}
            </h1>
            <p style={styles.heroSubtitle}>
              Gerencie sua ficha, acompanhe o progresso do personagem e, se for
              mestre, controle as configurações do jogo e visualize todas as fichas.
            </p>

            <div style={styles.heroBadgeRow}>
              <Badge label={hasCharacter ? "Ficha ativa" : "Sem ficha"} accent="blue" />
              {user?.isMaster ? <Badge label="Acesso de Mestre" accent="purple" /> : null}
            </div>
          </div>

          <div style={styles.heroInfoBox}>
            <span style={styles.heroInfoLabel}>Status da ficha</span>
            <strong style={styles.heroInfoValue}>
              {hasCharacter ? character.name : "Nenhuma ficha"}
            </strong>
            <p style={styles.heroInfoMeta}>
              {hasCharacter
                ? `${character.class || "-"} • Abra a ficha completa do personagem`
                : "Crie sua primeira ficha para começar"}
            </p>
          </div>
        </section>

        <section style={styles.quickStatsGrid}>
          {homeStats.map((item) => (
            <InfoCard
              key={item.label}
              label={item.label}
              value={item.value}
              small={item.small}
            />
          ))}
        </section>

        <section style={styles.actionsGrid}>
          <Link href={mainHref} style={styles.primaryActionCard}>
            <div style={styles.actionContent}>
              <span style={styles.actionTag}>Jogador</span>
              <h2 style={styles.actionTitle}>
                {hasCharacter ? "Ver Ficha" : "Criar Ficha"}
              </h2>
              <p style={styles.actionText}>
                {hasCharacter
                  ? "Abra a ficha completa do personagem com atributos, perícias e fôlego."
                  : "Você ainda não tem ficha. Clique para criar e começar."}
              </p>
            </div>
            <div style={styles.actionSide}>
              <span style={styles.actionArrow}>→</span>
            </div>
          </Link>

          {user?.isMaster ? (
            <Link href="/master" style={styles.secondaryActionCard}>
              <div style={styles.actionContent}>
                <span style={styles.actionTag}>Mestre</span>
                <h2 style={styles.actionTitleDark}>Painel do Mestre</h2>
                <p style={styles.actionTextDark}>
                  Ajuste os pontos globais do sistema e visualize todas as fichas dos jogadores.
                </p>
              </div>
              <div style={styles.actionSide}>
                <span style={styles.actionArrowDark}>↗</span>
              </div>
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value, small = false }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={{ ...styles.infoValue, fontSize: small ? 18 : 26 }}>
        {value}
      </strong>
    </div>
  );
}

function Badge({ label, accent = "blue" }) {
  const accents = {
    blue: {
      bg: "rgba(37,99,235,0.16)",
      border: "rgba(96,165,250,0.35)",
      color: "#bfdbfe",
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
    maxWidth: "1360px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    position: "relative",
    zIndex: 1,
  },
  loadingPage: {
    minHeight: "100vh",
    background: "#060c18",
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
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoutButton: {
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(220,38,38,0.22)",
  },
  heroCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.88))",
    borderRadius: "28px",
    padding: "30px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
  },
  heroTag: {
    margin: 0,
    marginBottom: "8px",
    color: "#93c5fd",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  heroTitle: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1.08,
  },
  heroSubtitle: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#cbd5e1",
    fontSize: "17px",
    maxWidth: "760px",
    lineHeight: 1.7,
  },
  heroBadgeRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  heroInfoBox: {
    minWidth: "280px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "22px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  heroInfoLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroInfoValue: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  heroInfoMeta: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: 0,
  },
  quickStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    background: "rgba(15,23,42,0.88)",
    borderRadius: "22px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
  },
  infoLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  infoValue: {
    fontWeight: "bold",
    wordBreak: "break-word",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  primaryActionCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "28px",
    padding: "28px",
    minHeight: "220px",
    boxShadow: "0 14px 34px rgba(37,99,235,0.26)",
  },
  secondaryActionCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.96))",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "28px",
    padding: "28px",
    minHeight: "220px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
  },
  actionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "420px",
  },
  actionTag: {
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    opacity: 0.9,
    fontWeight: 700,
  },
  actionTitle: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
  },
  actionTitleDark: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
    color: "#f8fafc",
  },
  actionText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.7,
    opacity: 0.96,
  },
  actionTextDark: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.7,
    color: "#cbd5e1",
  },
  actionSide: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  actionArrow: {
    fontSize: "44px",
    fontWeight: "bold",
    opacity: 0.95,
  },
  actionArrowDark: {
    fontSize: "40px",
    fontWeight: "bold",
    color: "#93c5fd",
  },
};