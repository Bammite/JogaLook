require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../supabaseClient');

const ADMIN_EMAIL = 'princebammite@gmail.com';
const ADMIN_PASSWORD = 'qwerty';
const ADMIN_FIRST_NAME = 'Prince';
const ADMIN_LAST_NAME = 'Bammite';
const ADMIN_PERMISSIONS = ['SUPER_ADMIN'];
const ADMIN_DEPARTMENT = 'Administration';

async function upsertAdmin() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const email = ADMIN_EMAIL.toLowerCase();

  const { data: existingUsers, error: findError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (findError) {
    throw new Error(`Impossible de rechercher l'utilisateur : ${findError.message}`);
  }

  let user;

  if (existingUsers && existingUsers.length > 0) {
    user = existingUsers[0];
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Impossible de mettre à jour l'utilisateur existant : ${updateError.message}`);
    }

    user = updatedUser;
    console.log(`Utilisateur existant mis à jour : ${email}`);
  } else {
    const { data: createdUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{ 
        email,
        password_hash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
      }])
      .select()
      .single();

    if (createError) {
      throw new Error(`Impossible de créer l'utilisateur : ${createError.message}`);
    }

    user = createdUser;
    console.log(`Nouvel utilisateur créé : ${email}`);
  }

  const { data: existingAdmin, error: adminFindError } = await supabaseAdmin
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .limit(1);

  if (adminFindError) {
    throw new Error(`Impossible de rechercher le rôle admin : ${adminFindError.message}`);
  }

  if (existingAdmin && existingAdmin.length > 0) {
    console.log(`L'utilisateur est déjà administrateur : ${email}`);
    return;
  }

  const { data: createdAdmin, error: adminCreateError } = await supabaseAdmin
    .from('admins')
    .insert([{
      user_id: user.id,
      permissions: ADMIN_PERMISSIONS,
      department: ADMIN_DEPARTMENT,
    }])
    .select()
    .single();

  if (adminCreateError) {
    throw new Error(`Impossible de créer le rôle admin : ${adminCreateError.message}`);
  }

  console.log(`Rôle admin créé pour ${email} (${createdAdmin.id})`);
}

upsertAdmin()
  .then(() => {
    console.log('Script terminé.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
