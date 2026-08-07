"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../components/AuthShell";
import GoogleSignInButton from "../components/GoogleSignInButton";
import authStyles from "../auth.module.css";
import { validatePassword } from "../../lib/password-policy";

export default function RegisterPage() {
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

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao cadastrar");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro inesperado ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      tag="Cadastro"
      title="Criar conta"
      subtitle="Crie sua conta para montar a ficha e entrar em campo."
      accent="green"
      footer={
        <>
          <span>Já tem uma conta?</span>
          <Link className="ui-interactive" href="/login">Faça login</Link>
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
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            className={authStyles.input}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
          <p className={authStyles.passwordHint}>Use pelo menos 8 caracteres, com uma letra e um número.</p>
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
          className={`ui-interactive ${authStyles.primaryButton} ${authStyles.primaryButtonGreen}`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className={authStyles.divider}>ou cadastre-se com</div>
      <GoogleSignInButton mode="register" />
    </AuthShell>
  );
}
