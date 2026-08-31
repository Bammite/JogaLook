/**
 * Utilitaire d'upload de fichiers vers Supabase Storage via l'API JogaLook
 * @param {File|Blob} file - Le fichier image à uploader
 * @param {string} [bucket='articles'] - Le bucket cible (articles, products, categories, misc)
 * @returns {Promise<{ publicUrl: string, path: string, originalName: string }>}
 */
export async function uploadImageFile(file, bucket = 'articles') {
  if (!file) {
    throw new Error('Aucun fichier sélectionné.');
  }

  // Vérification de la taille (max 5 Mo)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Le fichier est trop volumineux (5 Mo maximum).');
  }

  const formData = new FormData();
  formData.append('file', file, file.name || `image-${Date.now()}.png`);
  formData.append('bucket', bucket);

  const token = localStorage.getItem('jogalook-token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.success || !json.data?.publicUrl) {
    throw new Error(json.message || 'Échec de l’upload du fichier vers le serveur.');
  }

  return {
    publicUrl: json.data.publicUrl,
    path: json.data.path,
    originalName: json.data.originalName,
  };
}
