const { supabaseAdmin } = require('../supabaseClient');
const { sendMail } = require('../services/mailService');

const ADMIN_EMAIL = 'princebammite@gmail.com';

const REPORT_REASONS = {
  INAPPROPRIATE_CONTENT: 'Contenu inapproprié',
  COPYRIGHT_INFRINGEMENT: 'Atteinte aux droits d’auteur',
  COUNTERFEIT_OR_TRADEMARK: 'Contrefaçon ou atteinte à une marque',
  MISLEADING_OR_FRAUDULENT: 'Information trompeuse ou fraude',
  PRIVACY_OR_PERSONAL_DATA: 'Données personnelles ou vie privée',
  OTHER: 'Autre motif',
};

function cleanText(value, maxLength = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function productDetails(productName, productId) {
  const name = cleanText(productName, 255) || 'Produit non précisé';
  const id = cleanText(productId, 100) || '—';
  return { name, id };
}

async function submitReport(req, res) {
  try {
    const { productId, productName, reason, contact, description } = req.body;
    if (!REPORT_REASONS[reason]) {
      return res.status(400).json({ success: false, message: 'Veuillez sélectionner un motif de signalement valide.' });
    }

    const product = productDetails(productName, productId);
    const reporterContact = cleanText(contact, 255);
    const reportDescription = cleanText(description);

    const { error } = await supabaseAdmin
      .from('content_reports')
      .insert([{
        content_type: 'product',
        content_reference: product.id,
        product_id: productId || null,
        product_name: product.name,
        reason,
        reporter_contact: reporterContact || null,
        description: reportDescription || null,
      }]);

    if (error) throw error;

    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[JogaLook] Signalement — ${REPORT_REASONS[reason]}`,
      text: `Nouveau signalement produit\nProduit : ${product.name}\nID : ${product.id}\nMotif : ${REPORT_REASONS[reason]}\nContact : ${reporterContact || 'Non renseigné'}\nDescription : ${reportDescription || 'Non renseignée'}`,
      html: `
        <h2>Nouveau signalement produit</h2>
        <p><strong>Produit :</strong> ${escapeHtml(product.name)}</p>
        <p><strong>ID :</strong> ${escapeHtml(product.id)}</p>
        <p><strong>Motif :</strong> ${escapeHtml(REPORT_REASONS[reason])}</p>
        <p><strong>Contact :</strong> ${escapeHtml(reporterContact || 'Non renseigné')}</p>
        <p><strong>Description :</strong><br>${escapeHtml(reportDescription || 'Non renseignée').replace(/\n/g, '<br>')}</p>
      `,
    });

    return res.status(201).json({ success: true, message: 'Votre signalement a bien été reçu.' });
  } catch (error) {
    console.error('[productFeedbackController] submitReport:', error);
    return res.status(500).json({ success: false, message: 'Le signalement n’a pas pu être envoyé. Veuillez réessayer.' });
  }
}

async function submitInquiry(req, res) {
  try {
    const { productId, productName, contact, message } = req.body;
    const customerContact = cleanText(contact, 255);
    const inquiryMessage = cleanText(message);

    if (!customerContact || !inquiryMessage) {
      return res.status(400).json({ success: false, message: 'Votre moyen de contact et votre message sont requis.' });
    }

    const product = productDetails(productName, productId);
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[JogaLook] Renseignement produit — ${product.name}`,
      text: `Nouvelle demande de renseignement\nProduit : ${product.name}\nID : ${product.id}\nContact : ${customerContact}\nMessage : ${inquiryMessage}`,
      html: `
        <h2>Nouvelle demande de renseignement</h2>
        <p><strong>Produit :</strong> ${escapeHtml(product.name)}</p>
        <p><strong>ID :</strong> ${escapeHtml(product.id)}</p>
        <p><strong>Contact :</strong> ${escapeHtml(customerContact)}</p>
        <p><strong>Message :</strong><br>${escapeHtml(inquiryMessage).replace(/\n/g, '<br>')}</p>
      `,
    });

    return res.status(201).json({ success: true, message: 'Votre demande a bien été envoyée.' });
  } catch (error) {
    console.error('[productFeedbackController] submitInquiry:', error);
    return res.status(500).json({ success: false, message: 'La demande n’a pas pu être envoyée. Veuillez réessayer.' });
  }
}

module.exports = { submitReport, submitInquiry };
