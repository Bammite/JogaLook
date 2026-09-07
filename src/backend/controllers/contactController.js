const { sendContactRequestEmails } = require('../services/mailService');

const ADMIN_EMAIL = 'princebammite@gmail.com';

/**
 * POST /api/contact
 * body: { type, name, email, phone?, organization?, message, subject?, quantity?, city? }
 * type: 'WHOLESALER' | 'CLUB' | 'SCHOOL' | 'GENERAL'
 */
async function submitContact(req, res) {
  try {
    const { type = 'GENERAL', name, email, phone, organization, message, quantity, city, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants (nom, email, message).' });
    }

    const validTypes = ['WHOLESALER', 'CLUB', 'SCHOOL', 'GENERAL'];
    const resolvedType = validTypes.includes(type) ? type : 'GENERAL';

    const typeLabels = {
      WHOLESALER: 'Commande revendeur',
      CLUB:       'Partenariat club',
      SCHOOL:     'Lot scolaire / équipe',
      GENERAL:    subject ? `Contact — ${subject}` : 'Message de contact',
    };

    const payload = {
      type: resolvedType,
      typeLabel: typeLabels[resolvedType],
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      organization: organization ? organization.trim() : '',
      quantity: quantity || '',
      city: city ? city.trim() : '',
      subject: subject ? subject.trim() : '',
      message: message.trim(),
    };

    await sendContactRequestEmails({ adminEmail: ADMIN_EMAIL, payload });

    return res.json({
      success: true,
      message: 'Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.',
    });
  } catch (err) {
    console.error('[contactController] submitContact error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de votre message. Veuillez réessayer ultérieurement.',
    });
  }
}

module.exports = { submitContact };
