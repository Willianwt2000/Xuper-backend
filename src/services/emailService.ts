import Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export const sendVerificationCodeEmail = async (
  to: string,
  code: string
): Promise<void> => {
  try {
    await apiInstance.sendTransacEmail({
      sender: { email: process.env.EMAIL_FROM! },
      to: [{ email: to }],
      subject: "Código de verificación XUPER",
      htmlContent: `
        
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu cuenta Xuper</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Arial', sans-serif;">
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0a; padding: 40px 0;">
        <tr>
          <td align="center">
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #111111; border: 1px solid #333333; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);">
              
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                    XUPER <span style="color: #00F0FF;">TV</span>
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <p style="color: #888888; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
                    Hola, usa el siguiente código para completar tu inicio de sesión o registro en <strong>Xuper TV</strong>.
                  </p>

                  <div style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #00F0FF; letter-spacing: 8px; display: block;">
                      ${code}
                    </span>
                  </div>

                  <p style="color: #666666; font-size: 14px; margin: 0;">
                    Este código expirará en <strong>15 minutos</strong>.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #0f0f0f; padding: 20px; text-align: center; border-top: 1px solid #222;">
                  <p style="color: #444444; font-size: 12px; margin: 0;">
                    Si no solicitaste este código, puedes ignorar este correo de forma segura.
                  </p>
                  <p style="color: #444444; font-size: 12px; margin-top: 10px;">
                    © ${new Date().getFullYear()} Xuper TV Inc.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  
      `,
    });

    console.log(`📧 Email enviado a ${to}`);
  } catch (error) {
    console.error("❌ Error enviando el correo:", error);
  }
};
