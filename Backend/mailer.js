import nodemailer from "nodemailer";

// Sends email through the SMTP server in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
// If SMTP is not configured, emails are printed to the backend console instead (development mode).
let transporter = null;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter && mailConfigured()) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function verifyMailer() {
  if (!mailConfigured()) {
    console.warn("SMTP not configured - verification codes will be printed here instead of emailed");
    return;
  }
  try {
    await getTransporter().verify();
    console.log(`Email sending ready (${process.env.SMTP_USER})`);
  } catch (err) {
    console.error("SMTP login failed - check SMTP_* values in .env:", err.message);
  }
}

export async function sendVerificationCode({ email, username, code }) {
  const subject = "Your GovAlert verification code";
  username = String(username).replace(/[\r\n]+/g, " ").slice(0, 50);
  const text = `Hi ${username},\n\nYour GovAlert verification code is: ${code}\n\nIt expires in 10 minutes. If you did not sign up for GovAlert, you can ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#111827;color:#e5e7eb;border-radius:8px">
      <h2 style="color:#60a5fa;margin-top:0">Verify your GovAlert account</h2>
      <p>Hi ${escapeHtml(username)},</p>
      <p>Use this code to verify your email address:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#fff;text-align:center;background:#1f2937;padding:16px;border-radius:8px">${code}</p>
      <p style="color:#9ca3af;font-size:13px">The code expires in 10 minutes. If you did not sign up for GovAlert, you can ignore this email.</p>
    </div>`;

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP is not configured"); // never log codes in production
    console.log(`\n[email not configured] Verification code for ${email}: ${code}\n`);
    return { delivered: false };
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || `GovAlert <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    text,
    html,
  });
  return { delivered: true };
}
