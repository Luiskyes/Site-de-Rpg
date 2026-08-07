function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPasswordResetEmail({ to, resetUrl, requestId }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;

  if (!apiKey || !from) {
    return { delivered: false, reason: "not_configured" };
  }

  const safeUrl = escapeHtml(resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset-${requestId}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Redefina sua senha — Keys Lock",
      html: `
        <div style="background:#0b1120;color:#e2e8f0;padding:32px;font-family:Arial,sans-serif">
          <div style="max-width:560px;margin:auto;background:#111827;border:1px solid #24324a;border-radius:20px;padding:28px">
            <div style="font-weight:800;color:#93c5fd;letter-spacing:.08em">KEYS LOCK</div>
            <h1 style="font-size:26px;color:#fff;margin:18px 0 10px">Redefinição de senha</h1>
            <p style="line-height:1.6;color:#cbd5e1">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p style="margin:26px 0">
              <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Criar nova senha</a>
            </p>
            <p style="line-height:1.6;color:#94a3b8;font-size:13px">O link expira em 30 minutos e só pode ser usado uma vez. Se você não solicitou a alteração, ignore este e-mail.</p>
          </div>
        </div>
      `,
      text: `Redefina sua senha do Keys Lock: ${resetUrl}\n\nO link expira em 30 minutos e só pode ser usado uma vez.`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha ao enviar e-mail de recuperação (${response.status}): ${detail}`);
  }

  return { delivered: true };
}
