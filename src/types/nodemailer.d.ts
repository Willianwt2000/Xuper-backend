declare module "nodemailer" {
  interface AuthOptions {
    user: string;
    pass: string;
  }

  interface TransportOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth?: AuthOptions;
  }

  interface SendMailOptions {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
  }

  interface SentMessageInfo {
    messageId?: string;
    response?: string;
    [key: string]: unknown;
  }

  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
  }

  export function createTransport(options: TransportOptions): Transporter;
}

