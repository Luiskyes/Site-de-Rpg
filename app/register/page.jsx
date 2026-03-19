"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao cadastrar");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("Erro inesperado ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlow} />

      <section style={styles.card}>
        <div style={styles.header}>
          <p style={styles.tag}>Cadastro</p>
          <h1 style={styles.title}>Criar conta</h1>
          <p style={styles.subtitle}>
            Crie sua conta para começar a montar sua ficha e entrar no sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={styles.input}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              style={styles.input}
              required
              autoComplete="new-password"
            />
          </div>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((prev) => !prev)}
            />
            <span>Mostrar senha</span>
          </label>

          {error ? <p style={styles.error}>{error}</p> : null}

          <button type="submit" style={styles.primaryButton} disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Já tem conta?</span>
          <Link href="/login" style={styles.footerLink}>
            Faça login
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), #0b1120",
    color: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.10), transparent 25%), radial-gradient(circle at 80% 30%, rgba(37,99,235,0.08), transparent 25%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "460px",
    background: "linear-gradient(135deg, #111827, #172033)",
    borderRadius: "28px",
    padding: "32px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  header: {
    marginBottom: "24px",
  },
  tag: {
    margin: 0,
    marginBottom: "8px",
    color: "#86efac",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  input: {
    padding: "14px",
    borderRadius: "14px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#f8fafc",
    outline: "none",
    fontSize: "15px",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#cbd5e1",
    fontSize: "14px",
  },
  primaryButton: {
    marginTop: "6px",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background: "#059669",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#f87171",
    fontSize: "14px",
    margin: 0,
  },
  footer: {
    marginTop: "22px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  footerText: {
    color: "#cbd5e1",
  },
  footerLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontWeight: "bold",
  },
};