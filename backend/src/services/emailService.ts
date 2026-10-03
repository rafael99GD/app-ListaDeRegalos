import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';

export type OtpEmailType = 'REGISTRATION' | 'PASSWORD_RESET';

export interface SendOtpEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let lastConfigKey = '';

/**
 * Retorna el transporte SMTP de Nodemailer configurado con Brevo u otro proveedor SMTP,
 * o null si no se han especificado credenciales (SMTP_USER y SMTP_PASS).
 */
const getSmtpTransporter = (): Transporter | null => {
  const host = process.env.SMTP_HOST?.trim() || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  // Si no hay credenciales SMTP configuradas, retornamos null para activar el fallback
  if (!user || !pass) {
    return null;
  }

  const currentKey = `${host}:${port}:${user}:${pass}`;
  if (!cachedTransporter || lastConfigKey !== currentKey) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // false para 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 segundos max
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
    lastConfigKey = currentKey;
  }

  return cachedTransporter;
};

/**
 * Obtiene la dirección del remitente formateada con el nombre de la app.
 */
const getFromAddress = (): string => {
  const rawFrom =
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'Wishlist Hub <no-reply@wishlisthub.app>';

  return rawFrom.includes('<') ? rawFrom : `Wishlist Hub <${rawFrom}>`;
};

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
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #18181b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #27272a;">
          
          <!-- Encabezado con estética dark gaming de Wishlist Hub -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #09090b 0%, #18181b 100%); border-bottom: 1px solid #27272a;">
              <div style="display: inline-block; background-color: #0ea5e9; color: #09090b; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 800; margin-bottom: 12px; letter-spacing: 0.5px;">
                🎁 Wishlist Hub
              </div>
              <h1 style="margin: 0; color: #f4f4f5; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #e4e4e7;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                ${explanation}
              </p>

              <!-- Bloque Destacado de Código OTP -->
              <div style="background-color: #09090b; border: 1px solid #0ea5e9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 1px; margin-bottom: 8px;">
                  ${badgeText}
                </span>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0ea5e9; padding: 4px 0;">
                  ${otpCode}
                </div>
              </div>

              <!-- Indicador de Expiración -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #27272a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #d4d4d8;">
                    ⏱️ <strong>Importante:</strong> Este código expira en <strong>10 minutos</strong>. Si no lo utilizas a tiempo, deberás solicitar uno nuevo.
                  </td>
                </tr>
              </table>

              <!-- Aviso de Seguridad -->
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #71717a;">
                Si tú no has solicitado este código, puedes desestimar este mensaje de forma segura. Nadie puede acceder a tus listas sin confirmación.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="padding: 20px 32px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #a1a1aa;">
                Wishlist Hub 2026 — Tu lista de regalos perfecta
              </p>
              <p style="margin: 0; font-size: 11px; color: #71717a;">
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
 * Función principal para envío de correos OTP con soporte prioritario para Brevo SMTP (Nodemailer),
 * compatibilidad con Resend y fallback seguro a consola en desarrollo.
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
  console.log('[EMAIL] Intentando enviar correo a:', to);

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

  const fromEmail = getFromAddress();
  const html = generateHtmlOtpEmail(otpCode, userName, type);
  const text = generatePlainTextOtpEmail(otpCode, userName, type);

  // 1. Intentar envío prioritario a través de SMTP (Brevo / Nodemailer)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const info = await Promise.race([
        smtpTransporter.sendMail({
          from: fromEmail,
          to,
          subject,
          html,
          text,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP timeout: el servidor de correo no respondió a tiempo')), 15000)
        ),
      ]);

      console.log(`✅ [EMAIL SMTP ENVIADO] OTP enviado exitosamente a ${to} (MessageId: ${info.messageId})`);
      return { success: true, id: info.messageId };
    } catch (error: any) {
      console.error('[EMAIL ERROR]:', error);
      // Fallback de seguridad en consola para no bloquear la experiencia de desarrollo
      console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
      return { success: false, error: error.message || 'Error al enviar correo vía SMTP' };
    }
  }

  // 2. Soporte híbrido: Si no hay SMTP pero se dispone de RESEND_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      });

      if (error) {
        console.error('❌ Error devuelto por Resend API:', error);
        console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
        return { success: false, error: error.message };
      }

      console.log(`✅ [EMAIL RESEND ENVIADO] OTP enviado exitosamente a ${to} (ID: ${data?.id})`);
      return { success: true, id: data?.id };
    } catch (error: any) {
      console.error('❌ Excepción al enviar correo vía Resend:', error.message || error);
      console.log(`[DEV EMAIL FALLBACK] Código OTP para ${to}: ${otpCode}`);
      return { success: false, error: error.message || 'Error al enviar correo vía Resend' };
    }
  }

  // 3. Fallback a consola si no hay credenciales SMTP ni Resend (entorno de pruebas local)
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
  console.log('[EMAIL] Intentando enviar correo a:', to);
  const subject = `🎅 ¡Sorteo de Amigo Invisible en "${groupTitle}"!`;
  const url = appUrl || process.env.FRONTEND_URL || 'http://localhost:5173/secret-santa';
  const budgetText = budget && budget > 0 ? `${budget} €` : 'Sin límite';
  const dateText = exchangeDate ? new Date(exchangeDate).toLocaleDateString() : 'Por definir';
  const fromEmail = getFromAddress();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; margin: 0; font-size: 26px;">🎅 ¡El Sorteo ha comenzado!</h1>
        <p style="color: #a1a1aa; font-size: 15px; margin-top: 6px;">Evento: <strong style="color: #f4f4f5;">${groupTitle}</strong></p>
      </div>
      <div style="background: #18181b; border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); border: 1px solid #27272a;">
        <p style="font-size: 16px; color: #f4f4f5;">¡Hola <strong>@${recipientUsername}</strong>!</p>
        <p style="font-size: 15px; color: #a1a1aa; line-height: 1.5;">El sorteo del Amigo Invisible para <strong>${groupTitle}</strong> se ha completado con éxito. Ha llegado el momento de revelar tu persona asignada:</p>
        <div style="background: #09090b; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Tu amigo invisible secreto es:</p>
          <p style="margin: 8px 0 0; font-size: 26px; font-weight: 800; color: #0ea5e9;">🎁 @${assignedUsername}</p>
        </div>
        <div style="margin-top: 16px; padding: 12px 16px; background-color: #27272a; border-radius: 10px; font-size: 13px; color: #d4d4d8;">
          <p style="margin: 4px 0;"><strong>💰 Presupuesto sugerido:</strong> ${budgetText}</p>
          <p style="margin: 4px 0;"><strong>📅 Fecha de entrega:</strong> ${dateText}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${url}" style="display: inline-block; background: #0ea5e9; color: #09090b; padding: 12px 28px; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);">
            Ver su lista de deseos en Wishlist Hub 🎁
          </a>
        </div>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 12px; margin-top: 24px;">Wishlist Hub 2026 — Amigo Invisible</p>
    </div>
  `;

  const text = `¡Hola @${recipientUsername}!\n\nEn el evento "${groupTitle}", tu amigo invisible secreto es: @${assignedUsername}\nPresupuesto: ${budgetText}\nFecha: ${dateText}\n\nConsulta su lista de regalos en: ${url}`;

  // 1. Intentar envío prioritario por SMTP (Brevo / Nodemailer)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const info = await Promise.race([
        smtpTransporter.sendMail({
          from: fromEmail,
          to,
          subject,
          html,
          text,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP timeout: el servidor de correo no respondió a tiempo')), 15000)
        ),
      ]);

      console.log(`✅ [EMAIL SMTP ENVIADO] Amigo Invisible enviado a ${to} (MessageId: ${info.messageId})`);
      return { success: true, id: info.messageId };
    } catch (err: any) {
      console.error('[EMAIL ERROR]:', err);
      return { success: false, error: err.message };
    }
  }

  // 2. Soporte híbrido: Si no hay SMTP pero se dispone de RESEND_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
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

      console.log(`✅ [EMAIL RESEND ENVIADO] Amigo Invisible enviado a ${to} (ID: ${data?.id})`);
      return { success: true, id: data?.id };
    } catch (err: any) {
      console.error('❌ Excepción al enviar Secret Santa email vía Resend:', err.message || err);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback a consola en desarrollo
  console.log('\n======================================================');
  console.log(` 🎅 [AMIGO INVISIBLE - EMAIL NOTIFICATION]`);
  console.log(` 📧 Destinatario: ${to} (@${recipientUsername})`);
  console.log(` 🎁 Evento: "${groupTitle}"`);
  console.log(` 🤫 ¡Te ha tocado regalar a: @${assignedUsername}!`);
  console.log(` 💰 Presupuesto: ${budgetText} | 📅 Fecha: ${dateText}`);
  console.log(` 🔗 Entra a la app: ${url}`);
  console.log(' ======================================================\n');
  return { success: true };
};

/**
 * Objeto exportado para mantener retrocompatibilidad con las importaciones previas
 */
export const emailService = {
  sendOtpEmail,
  sendSecretSantaNotification,
};

export default emailService;
