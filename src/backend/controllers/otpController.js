const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// OTP (ONE-TIME PASSWORD) - CONTROLLER CRUD
// ==============================================================================

exports.sendOtp = async (req, res) => {
  try {
    const { user_id, recipient, purpose } = req.body;
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const { data, error } = await supabaseAdmin
      .from('otps')
      .insert([{
        user_id: user_id || null,
        recipient,
        code_hash: generatedCode, // Dans une prod sécurisée, vous pouvez hasher le code
        purpose: purpose || 'LOGIN',
        expires_at,
        is_used: false,
        attempts: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // En environnement de dev / démo, on retourne le code généré dans la réponse JSON
    return res.status(201).json({
      success: true,
      message: `Code OTP généré avec succès pour ${recipient}`,
      code: generatedCode,
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { recipient, code, purpose } = req.body;

    const { data: otp, error } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('recipient', recipient)
      .eq('purpose', purpose || 'LOGIN')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !otp) {
      return res.status(400).json({ success: false, message: 'Code OTP invalide ou expiré' });
    }

    if (otp.code_hash !== code) {
      // Incrémenter les tentatives
      await supabaseAdmin.from('otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      return res.status(400).json({ success: false, message: 'Code OTP incorrect' });
    }

    // Marquer l'OTP comme utilisé
    await supabaseAdmin.from('otps').update({ is_used: true }).eq('id', otp.id);

    return res.json({ success: true, message: 'OTP vérifié avec succès' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
