"use client";

import { useEffect, useState } from "react";
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

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>Carregando home...</div>
      </main>
    );
  }

  const hasCharacter = !!character;
  const mainHref = hasCharacter
    ? `/characters/${character.id}`
    : "/characters/create";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topBar}>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            disabled={loggingOut}
          >
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </header>

        <section style={styles.heroCard}>
          <div>
            <p style={styles.heroTag}>Painel Principal</p>
            <h1 style={styles.heroTitle}>
              Bem-vindo{user?.email ? `, ${user.email}` : ""}
            </h1>
            <p style={styles.heroSubtitle}>
              Gerencie sua ficha, acompanhe seus atributos e entre no jogo com tudo pronto.
            </p>
          </div>

          <div style={styles.heroInfoBox}>
            <span style={styles.heroInfoLabel}>Status da ficha</span>
            <span style={styles.heroInfoValue}>
              {hasCharacter ? "Ficha criada" : "Sem ficha"}
            </span>

            {hasCharacter ? (
              <small style={styles.heroInfoMeta}>
                {character.name} • {character.class}
              </small>
            ) : (
              <small style={styles.heroInfoMeta}>
                Crie sua primeira ficha para começar
              </small>
            )}
          </div>
        </section>

        <section style={styles.quickStatsGrid}>
          <InfoCard label="Conta" value={user?.email || "-"} small />
          <InfoCard label="Personagem" value={hasCharacter ? character.name : "Nenhum"} />
          <InfoCard label="Classe" value={hasCharacter ? character.class : "-"} />
          <InfoCard label="Nível" value={hasCharacter ? String(character.level ?? 1) : "-"} />
        </section>

        <section style={styles.actionsGrid}>
          <Link href={mainHref} style={styles.primaryActionCard}>
            <div style={styles.actionContent}>
              <span style={styles.actionTag}>Jogador</span>
              <h2 style={styles.actionTitle}>
                {hasCharacter ? "Ver Jogador" : "Criar Ficha"}
              </h2>
              <p style={styles.actionText}>
                {hasCharacter
                  ? "Abra a ficha completa do seu personagem com atributos e perícias."
                  : "Você ainda não tem ficha. Clique para criar e começar."}
              </p>
            </div>

            <div style={styles.actionSide}>
              <span style={styles.actionArrow}>→</span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value, small = false }) {
  return (
    <div style={styles.infoCard}>
      <span style={styles.infoLabel}>{label}</span>
      <span
        style={{
          ...styles.infoValue,
          fontSize: small ? "18px" : styles.infoValue.fontSize,
        }}
      >
        {value}
      </span>
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
  topBar: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  logoutButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "bold",
    cursor: "pointer",
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
    maxWidth: "760px",
  },
  heroInfoBox: {
    minWidth: "250px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  heroInfoLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroInfoValue: {
    fontSize: "22px",
    fontWeight: "bold",
  },
  heroInfoMeta: {
    color: "#cbd5e1",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  quickStatsGrid: {
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
    wordBreak: "break-word",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
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
    borderRadius: "24px",
    padding: "28px",
    minHeight: "230px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  actionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "380px",
  },
  actionTag: {
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    opacity: 0.9,
  },
  actionTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.1,
  },
  actionText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.6,
    opacity: 0.96,
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
};