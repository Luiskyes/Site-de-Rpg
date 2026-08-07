"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import authStyles from "../auth.module.css";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ mode = "login" }) {
  const router = useRouter();
  const hostRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError("O Google não retornou uma credencial válida.");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const loginResponse = await fetch("/api/auth/google", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await loginResponse.json();

        if (!loginResponse.ok) {
          setError(data.error || "Não foi possível entrar com o Google.");
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError("Não foi possível conectar ao Google agora.");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const renderButton = useCallback(() => {
    const host = hostRef.current;
    const google = window.google;
    if (!clientId || !host || !google?.accounts?.id) return;

    host.replaceChildren();
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    google.accounts.id.renderButton(host, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "register" ? "signup_with" : "signin_with",
      shape: "pill",
      logo_alignment: "left",
      width: Math.min(Math.floor(host.getBoundingClientRect().width), 400),
      locale: "pt_BR",
    });
  }, [handleCredential, mode]);

  useEffect(() => {
    if (!scriptReady || !clientId) return undefined;
    renderButton();
    return undefined;
  }, [renderButton, scriptReady]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
    }
  }, []);

  if (!clientId) {
    return (
      <div className={authStyles.googleUnavailable}>
        Google disponível após configurar o Client ID
      </div>
    );
  }

  return (
    <div className={authStyles.googleArea} aria-busy={loading}>
      <Script
        src="https://accounts.google.com/gsi/client?hl=pt-BR"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={hostRef} className={authStyles.googleHost}>
        {!scriptReady || loading ? (
          <span className={authStyles.googleLoading}>
            {loading ? "Validando conta Google..." : "Carregando Google..."}
          </span>
        ) : null}
      </div>
      {error ? <p role="alert" className={authStyles.error}>{error}</p> : null}
    </div>
  );
}
