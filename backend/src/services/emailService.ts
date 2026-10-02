import { Resend } from 'resend';

export type OtpEmailType = 'REGISTRATION' | 'PASSWORD_RESET';

export interface SendOtpEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Genera el cuerpo en texto plano del correo de OTP
 */
const generatePlainTextOtpEmail = (
  otpCode: string,
  userName?: string,
  type: OtpEmailType = 'REGISTRATION'
): string => {
  const isRegistration = type === 'REGISTRATION';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const actionText = isRegistration
    ? 'Gracias por unirte a Wishlist Hub. Para verificar tu cuenta y comenzar a crear tus listas de regalos, introduce el siguiente código:'
    : 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Wishlist Hub. Introduce el siguiente código de seguridad:';

  return `
Wishlist Hub — Código de Verificación

${greeting}

${actionText}

----------------------------------------
CÓDIGO DE VERIFICACIÓN: ${otpCode}
----------------------------------------

⏱️ Este código expira en 10 minutos.

Si no has solicitado este código, puedes ignorar este mensaje de forma segura. Nadie podrá acceder a tu cuenta sin él.

---
Wishlist Hub 2026 — Tu lista de regalos perfecta
  `.trim();
};

/**
 * Genera la plantilla HTML moderna y responsive con el diseño de Wishlist Hub
 */
const generateHtmlOtpEmail = (
  otpCode: string,
  userName?: string,
  type: OtpEmailType = 'REGISTRATION'
): string => {
  const isRegistration = type === 'REGISTRATION';
  const greeting = userName ? `¡Hola, <strong>${userName}</strong>!` : '¡Hola!';
  const badgeText = isRegistration ? 'Verificación de Cuenta' : 'Recuperación de Contraseña';
  const title = isRegistration ? 'Verifica tu cuenta de correo' : 'Restablece tu contraseña';
  const explanation = isRegistration
    ? 'Gracias por unirte a <strong>Wishlist Hub</strong>. Para completar tu registro y mantener tus listas de regalos seguras, introduce el siguiente código de verificación:'
    : 'Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en <strong>Wishlist Hub</strong>. Usa el siguiente código de seguridad para continuar:';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con degradado Wishlist Hub -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #6366f1 100%);">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 12px; letter-spacing: 0.5px;">
                🎁 Wishlist Hub
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #334155;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #475569;">
                ${explanation}
              </p>

              <!-- Bloque Destacado de Código OTP -->
              <div style="background-color: #fdf2f8; border: 2px dashed #f472b6; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #be185d; letter-spacing: 1px; margin-bottom: 8px;">
                  ${badgeText}
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #db2777; padding: 4px 0;">
                  ${otpCode}
                </div>
              </div>

              <!-- Indicador de Expiración -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #f1f5f9; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #64748b;">
                    ⏱️ <strong>Importante:</strong> Este código expira en <strong>10 minutos</strong>. Si no lo utilizas a tiempo, deberás solicitar uno nuevo.
                  </td>
                </tr>
              </table>

              <!-- Aviso de Seguridad -->
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                Si tú no has solicitado este código, puedes desestimar este mensaje de forma segura. Nadie puede acceder a tus listas sin confirmación.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #64748b;">
                Wishlist Hub 2026 — Tu lista de regalos perfecta
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Este es un mensaje transaccional automatizado, por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * Función principal para envío de correos OTP con soporte para Resend y fallback seguro a consola
 *
 * @param to Dirección de correo destinatario
 * @param otpCode Código numérico OTP de 6 dígitos
 * @param userNameOrType Nombre del usuario o tipo de OTP (para retrocompatibilidad)
 * @param typeParam Tipo explícito de OTP ('REGISTRATION' | 'PASSWORD_RESET')
 */
export const sendOtpEmail = async (
  to: string,
  otpCode: string,
  userNameOrType?: string | OtpEmailType,
  typeParam?: OtpEmailType
): Promise<SendOtpEmailResult> => {
  // Resolver parámetros
  let userName: string | undefined;
  let type: OtpEmailType = 'REGISTRATION';

  if (userNameOrType === 'REGISTRATION' || userNameOrType === 'PASSWORD_RESET') {
    type = userNameOrType;
  } else if (typeof userNameOrType === 'string') {
    userName = userNameOrType;
    if (typeParam) {
      type = typeParam;
    }
  }

  const isRegistration = type === 'REGISTRATION';
  const subject = isRegistration
    ? '🎁 Tu código de verificación en Wishlist Hub'
    : '🔑 Recuperación de contraseña en Wishlist Hub';

  // Leer variables de entorno dinámicamente en tiempo de ejecución
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. Fallback a consola si no hay API Key configurada
  if (!resendApiKey) {
    console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
    console.log('\n======================================================');
    console.log(` 📧 [DEV EMAIL FALLBACK] -> Destinatario: ${to}`);
    if (userName) console.log(` 👤 Usuario: ${userName}`);
    console.log(` 📌 Asunto: ${subject}`);
    console.log(' ------------------------------------------------------');
    console.log(` 🔑 [DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
    console.log(` ⏱️ Válido durante 10 minutos`);
    console.log(' ======================================================\n');

    return { success: true };
  }

  // 2. Envío real a través de Resend
  try {
    const resend = new Resend(resendApiKey);
    const rawFrom = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
    const fromEmail = rawFrom.includes('<') ? rawFrom : `Wishlist Hub <${rawFrom}>`;
    const html = generateHtmlOtpEmail(otpCode, userName, type);
    const text = generatePlainTextOtpEmail(otpCode, userName, type);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('❌ Error devuelto por Resend API:', error);
      // Fallback de seguridad en consola para no bloquear la experiencia de desarrollo
      console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ [EMAIL ENVIADO] OTP enviado exitosamente a ${to} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('❌ Excepción al intentar enviar correo vía Resend:', error.message || error);
    // Fallback de seguridad en consola para no bloquear la experiencia de desarrollo
    console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
    return { success: false, error: error.message || 'Error desconocido al enviar email' };
  }
};

export interface SendSecretSantaEmailParams {
  to: string;
  recipientUsername: string;
  groupTitle: string;
  assignedUsername: string;
  budget?: number;
  exchangeDate?: Date | null;
  appUrl?: string;
}

export const sendSecretSantaNotification = async ({
  to,
  recipientUsername,
  groupTitle,
  assignedUsername,
  budget,
  exchangeDate,
  appUrl,
}: SendSecretSantaEmailParams): Promise<{ success: boolean; id?: string; error?: string }> => {
  const subject = `🎅 ¡Sorteo de Amigo Invisible en "${groupTitle}"!`;
  const url = appUrl || process.env.FRONTEND_URL || 'http://localhost:5173/secret-santa';
  const budgetText = budget && budget > 0 ? `${budget} €` : 'Sin límite';
  const dateText = exchangeDate ? new Date(exchangeDate).toLocaleDateString() : 'Por definir';

  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // Fallback a consola si no hay API key o en dev
  if (!resendApiKey) {
    console.log('\n======================================================');
    console.log(` 🎅 [AMIGO INVISIBLE - EMAIL NOTIFICATION]`);
    console.log(` 📧 Destinatario: ${to} (@${recipientUsername})`);
    console.log(` 🎁 Evento: "${groupTitle}"`);
    console.log(` 🤫 ¡Te ha tocado regalar a: @${assignedUsername}!`);
    console.log(` 💰 Presupuesto: ${budgetText} | 📅 Fecha: ${dateText}`);
    console.log(` 🔗 Entra a la app: ${url}`);
    console.log(' ======================================================\n');
    return { success: true };
  }

  try {
    const resend = new Resend(resendApiKey);
    const rawFrom = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
    const fromEmail = rawFrom.includes('<') ? rawFrom : `Wishlist Hub <${rawFrom}>`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e11d48; margin: 0; font-size: 26px;">🎅 ¡El Sorteo ha comenzado!</h1>
          <p style="color: #64748b; font-size: 15px; margin-top: 6px;">Evento: <strong>${groupTitle}</strong></p>
        </div>
        <div style="background: white; border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1e293b;">¡Hola <strong>@${recipientUsername}</strong>!</p>
          <p style="font-size: 15px; color: #475569; line-height: 1.5;">El sorteo del Amigo Invisible para <strong>${groupTitle}</strong> se ha completado con éxito. Ha llegado el momento de revelar tu persona asignada:</p>
          <div style="background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #be123c; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Tu amigo invisible secreto es:</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: #e11d48;">🎁 @${assignedUsername}</p>
          </div>
          <div style="margin-top: 16px; padding: 12px 16px; background-color: #f1f5f9; border-radius: 10px; font-size: 13px; color: #475569;">
            <p style="margin: 4px 0;"><strong>💰 Presupuesto máximo:</strong> ${budgetText}</p>
            <p style="margin: 4px 0;"><strong>📅 Fecha de entrega:</strong> ${dateText}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${url}" style="display: inline-block; background: #e11d48; color: white; padding: 12px 28px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 10px; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.3);">
              Ver su lista de deseos en la App 🎁
            </a>
          </div>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">Wishlist Hub 2026 — Amigo Invisible</p>
      </div>
    `;

    const text = `¡Hola @${recipientUsername}!\n\nEn el evento "${groupTitle}", tu amigo invisible secreto es: @${assignedUsername}\nPresupuesto: ${budgetText}\nFecha: ${dateText}\n\nConsulta su lista de regalos en: ${url}`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('❌ Error en envío Resend Secret Santa:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Excepción al enviar Secret Santa email:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Objeto exportado para mantener retrocompatibilidad con las importaciones previas
 */
export const emailService = {
  sendOtpEmail,
  sendSecretSantaNotification,
};

export default emailService;
