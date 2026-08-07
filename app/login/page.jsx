"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import authStyles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      tag="Acesso"
      title="Entrar"
      subtitle="Acesse sua ficha e continue sua jornada em Keys Lock."
      footer={
        <>
          <span>Não tem uma conta?</span>
          <Link className="ui-interactive" href="/register">Cadastre-se</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={authStyles.form}>
        <div className={authStyles.field}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className={authStyles.input}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className={authStyles.field}>
          <div className={authStyles.fieldHeader}>
            <label htmlFor="password">Senha</label>
            <Link className={`ui-interactive ${authStyles.inlineLink}`} href="/forgot-password">
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            className={authStyles.input}
            required
            autoComplete="current-password"
          />
        </div>

        <label className={authStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassword((previous) => !previous)}
          />
          <span>Mostrar senha</span>
        </label>

        {error ? <p role="alert" className={authStyles.error}>{error}</p> : null}

        <button
          className={`ui-interactive ${authStyles.primaryButton}`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className={authStyles.divider}>ou continue com</div>
      <GoogleSignInButton mode="login" />
    </AuthShell>
  );
}
