"use client";

import Link from "next/link";

export function Brand({ compact = false }) {
  return (
    <Link
      href="/"
      className={`app-brand${compact ? " app-brand--compact" : ""}`}
      aria-label="Keys Lock — página inicial"
    >
      <span className="app-brand__mark" aria-hidden="true">
        K
      </span>
      <span className="app-brand__copy">
        <strong>Keys Lock</strong>
        {!compact ? <small>Ficha-Web</small> : null}
      </span>
    </Link>
  );
}

export default function AppTopBar({
  backHref,
  backLabel = "Voltar",
  context,
  action,
}) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__main">
        {backHref ? (
          <Link href={backHref} className="app-back-link">
            <span aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
        ) : null}

        <Brand compact={Boolean(backHref)} />

        {context ? <span className="app-topbar__context">{context}</span> : null}
      </div>

      {action ? <div className="app-topbar__action">{action}</div> : null}
    </header>
  );
}
