import nodemailer from "nodemailer";

/**
 * Same Gmail-via-nodemailer pattern already used for lead notifications
 * (app/api/leads/route.ts) — reused here so auth emails go out through the
 * one already-configured, already-working transport instead of a second
 * one. Silently no-ops when EMAIL_USER isn't configured, same as that path,
 * rather than throwing and taking down the request that triggered it.
 */
export async function sendMail(input: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!process.env.EMAIL_USER) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Drive Prime Motors" <${process.env.EMAIL_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return true;
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
