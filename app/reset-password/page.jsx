"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell from "../components/AuthShell";
import authStyles from "../auth.module.css";
import { validatePassword } from "../../lib/password-policy";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "O link de recuperação está incompleto.");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Não foi possível redefinir a senha.");
        return;
      }

      setMessage(data.message);
      setPassword("");
      setConfirmation("");
    } catch {
      setError("Não foi possível redefinir a senha agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      tag="Nova senha"
      title="Redefinir senha"
      subtitle="Crie uma nova senha para voltar à sua conta. O link só poderá ser usado uma vez."
      footer={<Link className="ui-interactive" href="/login">Voltar para o login</Link>}
    >
      {message ? (
        <div className={authStyles.form}>
          <p role="status" className={authStyles.success}>{message}</p>
          <Link className={`ui-interactive ${authStyles.primaryButton}`} href="/login">
            Entrar com a nova senha
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={authStyles.form}>
          <div className={authStyles.field}>
            <label htmlFor="new-password">Nova senha</label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={authStyles.input}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              autoFocus
              disabled={!token}
            />
          </div>

          <div className={authStyles.field}>
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className={authStyles.input}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              disabled={!token}
            />
            <p className={authStyles.passwordHint}>Use pelo menos 8 caracteres, com uma letra e um número.</p>
          </div>

          <label className={authStyles.checkboxRow}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((previous) => !previous)}
            />
            <span>Mostrar senhas</span>
          </label>

          {error ? <p role="alert" className={authStyles.error}>{error}</p> : null}

          <button
            className={`ui-interactive ${authStyles.primaryButton}`}
            type="submit"
            disabled={loading || !token}
          >
            {loading ? "Redefinindo..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function ResetPasswordLoading() {
  return (
    <AuthShell
      tag="Nova senha"
      title="Carregando..."
      subtitle="Validando o link de recuperação."
    >
      <p className={authStyles.notice}>Preparando redefinição segura...</p>
    </AuthShell>
  );
}
