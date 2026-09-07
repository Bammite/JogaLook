'use strict';

const SMS_API_URL = 'https://sms.bammite.com/api.php';

function getConfig() {
  return {
    apiKey: process.env.BAMMITE_SMS_API_KEY || process.env.SMS_API_KEY,
    privateKey: process.env.BAMMITE_SMS_PRIVATE_KEY || process.env.SMS_PRIVATE_KEY,
    senderName: process.env.BAMMITE_SMS_SENDER_NAME || process.env.SMS_SENDER_NAME,
  };
}

function normalizePhone(phone) {
  let value = String(phone || '').trim().replace(/[\s().-]/g, '');
  if (!value) throw new Error('Le numéro de téléphone est requis.');
  if (/^(70|75|76|77|78)\d{7}$/.test(value)) value = `+221${value}`;
  if (!/^\+\d{8,15}$/.test(value)) {
    throw new Error('Le numéro doit être international ou un numéro sénégalais à 9 chiffres.');
  }
  return value;
}

/**
 * Envoie un SMS via l'API Bammite.
 * Les clés restent exclusivement côté serveur.
 */
async function sendSms({ telephone, message, name } = {}) {
  const { apiKey, privateKey, senderName } = getConfig();
  if (!apiKey || !privateKey) {
    throw new Error('Le service SMS Bammite n’est pas configuré.');
  }

  const normalizedPhone = normalizePhone(telephone);
  const text = String(message || '').trim();
  if (!text) throw new Error('Le message SMS est requis.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-PRIVATE-KEY': privateKey,
      },
      body: JSON.stringify({
        telephone: normalizedPhone,
        message: text,
        ...(name || senderName ? { name: name || senderName } : {}),
      }),
      signal: controller.signal,
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Réponse invalide de l’API SMS (${response.status}).`);
    }

    if (!response.ok || result.success !== true) {
      throw new Error(result.message || `Échec de l’envoi SMS (${response.status}).`);
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Le service SMS Bammite n’a pas répondu dans le délai prévu.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  sendSms,
  normalizePhone,
  smsApiUrl: SMS_API_URL,
};
