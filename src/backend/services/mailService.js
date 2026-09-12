const nodemailer = require('nodemailer');

const {
  cle_resend,
  CLE_RESEND,
  RESEND_API_KEY,
  RESEND_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
} = process.env;

const resendApiKey = (cle_resend || CLE_RESEND || RESEND_API_KEY || RESEND_KEY || '').trim();
const hasResendConfig = Boolean(resendApiKey);

const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_USERNAME && SMTP_PASSWORD && SMTP_FROM_EMAIL);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USERNAME,
        pass: SMTP_PASSWORD,
      },
    })
  : null;

function getFromAddress() {
  const displayName = (process.env.RESEND_FROM_NAME || process.env.SMTP_FROM_NAME || 'JogaLook').trim();
  const email = (process.env.RESEND_FROM_EMAIL || 'contact@jogalook.com').trim();
  return `${displayName} <${email}>`;
}

/**
 * Envoie un email via Resend (en priorité), via SMTP (fallback), ou en console (dev).
 */
async function sendMail({ to, subject, text, html }) {
  const recipient = Array.isArray(to) ? to : [to];
  const from = getFromAddress();

  // 1. Envoi prioritaire via l'API Resend
  if (hasResendConfig) {
    try {
      console.log(`📡 [Resend] Envoi en cours depuis "${from}" vers : ${recipient.join(', ')}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipient,
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ [Resend] Erreur API lors de l'envoi depuis "${from}":`, data);
        throw new Error(data.message || `Erreur Resend (${response.status})`);
      }

      console.log(`✅ [Resend] Email envoyé avec succès (${data.id}) depuis "${from}" à ${recipient.join(', ')}`);
      return {
        skipped: false,
        provider: 'resend',
        id: data.id,
        message: 'Email envoyé avec succès via Resend.',
      };
    } catch (err) {
      console.error('❌ Échec de l\'envoi Resend:', err.message);
      if (!transporter) throw err;
      console.warn('🔄 Tentative de fallback sur SMTP...');
    }
  }

  // 2. Envoi via SMTP (Nodemailer)
  if (transporter) {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return {
      skipped: false,
      provider: 'smtp',
      info,
      message: 'Email envoyé avec succès via SMTP.',
    };
  }

  // 3. Fallback développement / console
  console.warn('⚠️ Aucun service d\'email configuré (ni Resend cle_resend, ni SMTP). Email en mode console :');
  console.warn(`[Destinataire] ${to}`);
  console.warn(`[Sujet] ${subject}`);
  console.warn(text || html);
  return {
    skipped: true,
    provider: 'console',
    message: 'Email affiché dans la console (aucun provider configuré).',
  };
}

async function sendOtpEmail({ to, code, recipientName }) {
  const formattedName = recipientName ? recipientName.trim() : 'Administrateur';
  const subject = 'Votre code de connexion JogaLook';
  const text = `Bonjour ${formattedName},\n\nVotre code de connexion administrateur JogaLook est : ${code}\n\nCe code expirera dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez ce message.\n\nCordialement,\nL'équipe JogaLook`;
  const html = `
    <div style="font-family: sans-serif; color: #1f2937; line-height: 1.5;">
      <p>Bonjour ${formattedName},</p>
      <p>Votre code de connexion administrateur JogaLook est :</p>
      <p style="font-size: 1.5rem; font-weight: 700; margin: 16px 0;">${code}</p>
      <p>Ce code expirera dans 10 minutes.</p>
      <p>Si vous n'avez pas demandé ce code, ignorez simplement ce message.</p>
      <p>Cordialement,<br/>L'équipe JogaLook</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
}

async function sendRegistrationOtpEmail({ to, code }) {
  const subject = `${code} est votre code de confirmation JogaLook`;
  const text = `Bonjour,\n\nVoici votre code de vérification pour finaliser votre inscription sur JogaLook : ${code}\n\nCe code est valable pendant 10 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\nL'équipe JogaLook`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 30px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 440px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
              <!-- Top Banner -->
              <tr>
                <td style="background-color: #0f172a; padding: 24px 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
                    JOGA<span style="color: #f15a24;">LOOK</span>
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 28px 24px;">
                  <h2 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #0f172a;">
                    Code de confirmation
                  </h2>
                  <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.5; color: #4b5563;">
                    Bienvenue sur <strong>JogaLook</strong>. Saisissez ce code pour valider votre adresse email et finaliser la création de votre compte :
                  </p>

                  <!-- Code box -->
                  <div style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f15a24; display: inline-block;">
                      ${code}
                    </span>
                  </div>

                  <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                    ⏱️ Expire dans <strong>10 minutes</strong>. Ne partagez ce code avec personne.
                  </p>
                </td>
              </tr>

              <!-- Minimal Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #f3f4f6;">
                  <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                    © ${new Date().getFullYear()} JogaLook • Équipements sportifs & maillots authentiques
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendMail({ to, subject, text, html });
}


/**
 * Envoie (1) une notification détaillée à l'admin et (2) un accusé de réception au demandeur.
 * payload: { type, typeLabel, name, email, phone, organization, quantity, city, message }
 */
async function sendContactRequestEmails({ adminEmail, payload }) {
  const { typeLabel, name, email, phone, organization, quantity, city, subject, message } = payload;

  const year = new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── Helpers HTML ──────────────────────────────────────────────────────────
  const row = (label, value) => value
    ? `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;width:140px;vertical-align:top;">${label}</td><td style="padding:6px 12px;color:#111827;font-size:13px;font-weight:600;">${value}</td></tr>`
    : '';

  const inlineDetails = [
    row('Type de demande', typeLabel),
    row('Sujet', subject),
    row('Nom / Prénom', name),
    row('Email', email),
    row('Téléphone', phone || '—'),
    row('Organisation', organization || '—'),
    row('Quantité', quantity || '—'),
    row('Ville', city || '—'),
  ].join('');

  const headerBrand = `<h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px;">JOGA<span style="color:#f15a24;">LOOK</span></h1>`;

  // ── Email admin ──────────────────────────────────────────────────────────
  const adminHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:30px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0f172a;padding:24px 20px;text-align:center;">${headerBrand}</td></tr>
          <tr><td style="padding:28px 28px 0;">
            <h2 style="margin:0 0 6px;font-size:17px;color:#0f172a;">🔔 Nouveau message — <span style="color:#f15a24;">${subject || typeLabel}</span></h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">Reçu le ${dateStr}</p>
            <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
              ${inlineDetails}
            </table>
            <div style="margin:20px 0 0;background:#f8fafc;border-left:4px solid #f15a24;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Message</p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
            </div>
          </td></tr>
          <tr><td style="padding:20px 28px 28px;">
            <a href="mailto:${email}" style="display:inline-block;padding:12px 28px;background:#f15a24;color:#fff;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">Répondre à ${name}</a>
          </td></tr>
          <tr><td style="background:#f9fafb;padding:14px 20px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${year} JogaLook • Notification interne</p>
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;

  // ── Email utilisateur ────────────────────────────────────────────────────
  const userHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:30px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0f172a;padding:24px 20px;text-align:center;">${headerBrand}</td></tr>
          <tr><td style="padding:32px 28px 0;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Merci pour votre message, ${name} ! ✅</h2>
            <p style="margin:0 0 18px;color:#4b5563;font-size:14px;line-height:1.6;">
              Votre message concernant <strong>${(subject || typeLabel).toLowerCase()}</strong> a bien été reçu. Notre équipe l'examinera dans les plus brefs délais et vous recontactera à cette adresse : <strong>${email}</strong>.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
              <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
                🕐 Délai de réponse habituel : <strong>Moins de 24 heures</strong>.<br>
                Pour toute urgence, vous pouvez également nous joindre directement au <strong>+221 78 194 13 51</strong>.
              </p>
            </div>
            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
              Si vous avez des questions supplémentaires, n'hésitez pas à répondre à cet email ou à nous écrire à <a href="mailto:${adminEmail}" style="color:#f15a24;">${adminEmail}</a>.
            </p>
          </td></tr>
          <tr><td style="padding:24px 28px 28px;">
            <a href="/" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;font-weight:700;font-size:14px;border-radius:50px;text-decoration:none;">Retour sur JogaLook</a>
          </td></tr>
          <tr><td style="background:#f9fafb;padding:14px 20px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">© ${year} JogaLook • Équipements sportifs &amp; maillots authentiques</p>
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;

  await Promise.all([
    sendMail({
      to: adminEmail,
      subject: `[JogaLook] ${subject ? subject : typeLabel} (${name})`,
      html: adminHtml,
      text: `Nouvelle demande ${typeLabel} de ${name} (${email}, ${phone || 'sans tél'}) : ${message}`,
    }),
    sendMail({
      to: email,
      subject: `Votre message a bien été reçu — JogaLook`,
      html: userHtml,
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message concernant "${subject || typeLabel}". Notre équipe vous répondra sous 24h ouvrées.\n\nL'équipe JogaLook`,
    }),
  ]);

  return { skipped: false };
}

module.exports = {
  sendMail,
  sendOtpEmail,
  sendRegistrationOtpEmail,
  sendContactRequestEmails,
  isConfigured: Boolean(hasResendConfig || hasSmtpConfig),
};
