import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.",
    );
  }

  // Modificación que debes tener aplicada:
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === "true",
    logger: true,
    debug: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  } as any);

  return transporter;
};

const getFromAddress = (): string => {
  const { EMAIL_FROM, SMTP_USER } = process.env;
  const from = EMAIL_FROM ?? SMTP_USER;
  if (!from) {
    throw new Error(
      "EMAIL_FROM or SMTP_USER environment variable must be defined to send emails.",
    );
  }
  return from;
};

export const sendVerificationCodeEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  const transporterInstance = getTransporter();
  const from = getFromAddress();

  await transporterInstance.sendMail({
    from,
    to,
    subject: "Código de verificación XUPER",
    text: `Tu código de verificación es ${code}. Es válido por 15 minutos.`,
    html: `<p>Tu código de verificación es <strong>${code}</strong>.</p><p>Este código vence en 15 minutos.</p>`,
  });
};

export default sendVerificationCodeEmail;

