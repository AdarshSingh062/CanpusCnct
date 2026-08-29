const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Sends an email. Fails softly (logs) in development if SMTP isn't configured,
 * so the rest of the app flow (e.g. registration) isn't blocked.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[EMAIL] SMTP not configured — skipping email to ${to}: "${subject}"`);
    return { skipped: true };
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = sendEmail;
