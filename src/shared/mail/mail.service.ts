import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { getEmailVerificationTemplate } from "./templates/email-verification.js";
import { getPasswordResetTemplate } from "./templates/password-reset.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth:
    env.SMTP_USER && env.SMTP_PASSWORD
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD
        }
      : undefined
});

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendMail(input: SendMailInput) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    ...input
  });
}

export async function sendEmailVerificationMail(input: {
  to: string;
  name: string;
  code: string;
}) {
  const template = getEmailVerificationTemplate({
    name: input.name,
    code: input.code
  });

  await sendMail({
    to: input.to,
    ...template
  });
}

export async function sendPasswordResetMail(input: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${env.APP_ORIGIN}/reset-password?token=${encodeURIComponent(input.token)}`;
  const template = getPasswordResetTemplate({
    name: input.name,
    resetUrl
  });

  await sendMail({
    to: input.to,
    ...template
  });
}
