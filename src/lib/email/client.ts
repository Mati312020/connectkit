import { Resend } from "resend";
import { appConfig } from "@/config/app.config";

// Instanciación lazy para evitar error en build sin API key configurada
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  const resend = getResend();
  return resend.emails.send({
    from: appConfig.email.from,
    replyTo: appConfig.email.replyTo,
    to: params.to,
    subject: params.subject,
    react: params.react,
  });
}
