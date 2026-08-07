"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "../components/AuthShell";
import authStyles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [developmentResetUrl, setDevelopmentResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setDevelopmentResetUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Não foi possível solicitar a recuperação.");
        return;
      }

      setMessage(data.message);
      setDevelopmentResetUrl(data.developmentResetUrl || "");
    } catch {
      setError("Não foi possível solicitar a recuperação agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      tag="Recuperação"
      title="Recuperar senha"
      subtitle="Informe seu e-mail. Se a conta existir, enviaremos um link válido por 30 minutos."
      footer={<Link className="ui-interactive" href="/login">Voltar para o login</Link>}
    >
      <form onSubmit={handleSubmit} className={authStyles.form}>
        <div className={authStyles.field}>
          <label htmlFor="recovery-email">E-mail</label>
          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authStyles.input}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {message ? <p role="status" className={authStyles.success}>{message}</p> : null}
        {error ? <p role="alert" className={authStyles.error}>{error}</p> : null}

        <button
          className={`ui-interactive ${authStyles.primaryButton}`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>

      {developmentResetUrl ? (
        <div className={authStyles.devLinkBox}>
          <strong>Teste local — nenhum e-mail foi enviado</strong>
          <Link href={developmentResetUrl}>Abrir link seguro de redefinição</Link>
        </div>
      ) : null}
    </AuthShell>
  );
}
