import nodemailer from 'nodemailer';

// Any SMTP provider works here (Gmail app password, Mailtrap/Ethereal in dev,
// SES/SendGrid SMTP relay in prod) — no vendor SDK lock-in.
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined,
});
