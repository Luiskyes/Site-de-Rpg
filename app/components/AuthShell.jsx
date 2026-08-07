"use client";

import { Brand } from "./AppTopBar";
import authStyles from "../auth.module.css";

export default function AuthShell({ tag, title, subtitle, accent = "blue", children, footer }) {
  return (
    <main className={`ui-auth-page ${authStyles.page}`}>
      <div className={authStyles.glow} aria-hidden="true" />
      <section className={`ui-auth-card ${authStyles.card}`}>
        <div className={authStyles.brand}>
          <Brand />
        </div>
        <div className={authStyles.header}>
          <p className={`${authStyles.tag} ${accent === "green" ? authStyles.tagGreen : ""}`}>
            {tag}
          </p>
          <h1 className={`ui-title ${authStyles.title}`}>{title}</h1>
          <p className={authStyles.subtitle}>{subtitle}</p>
        </div>
        {children}
        {footer ? <div className={authStyles.footer}>{footer}</div> : null}
      </section>
    </main>
  );
}
