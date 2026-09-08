require('dotenv').config();
const { sendRegistrationOtpEmail } = require('../services/mailService');

const targetEmail = process.argv[2] || 'princebammite@gmail.com';
const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

console.log('----------------------------------------------------');
console.log('🚀 Test d\'envoi d\'email via Resend / JogaLook');
console.log('----------------------------------------------------');
console.log(`📧 Destinataire : ${targetEmail}`);
console.log(`🔑 Clé Resend détectée : ${process.env.cle_resend || process.env.CLE_RESEND || process.env.RESEND_API_KEY ? 'Oui ✅ (re_...)' : 'Non ❌ (vérifiez votre .env)'}`);
console.log(`🔢 Code OTP test : ${testOtp}`);
console.log('----------------------------------------------------');

async function run() {
  try {
    const result = await sendRegistrationOtpEmail({
      to: targetEmail,
      code: testOtp,
    });
    console.log('\nRésultat :');
    console.log(result);
    console.log('\n✅ Si aucune erreur n\'apparaît, vérifiez la boîte de réception (et les spams) de', targetEmail);
  } catch (error) {
    console.error('\n❌ Erreur lors du test :', error.message);
  }
}

run();
