const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
} = process.env;

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
  const displayName = SMTP_FROM_NAME?.trim() || 'JogaLook';
  return `${displayName} <${SMTP_FROM_EMAIL || 'no-reply@jogalook.local'}>`;
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

  if (!transporter) {
    console.warn('⚠️ SMTP non configuré. Email OTP en mode console :');
    console.warn(`Envoyer à ${to}`);
    console.warn(text);
    return {
      skipped: true,
      message: 'SMTP non configuré, email OTP affiché dans la console.',
    };
  }

  const info = await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  return {
    skipped: false,
    message: 'Email OTP envoyé avec succès.',
    info,
  };
}

module.exports = {
  sendOtpEmail,
  isConfigured: hasSmtpConfig,
};
