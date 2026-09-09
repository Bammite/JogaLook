import { useEffect, useRef, useState } from 'react';
import { uploadImageFile } from '../../utils/uploadUtil';
import { CameraIcon, CheckCircleIcon, AlertTriangleIcon } from '../../components/icons/AppIcons';

/**
 * Composant TinyEditor pour la rédaction d'articles sportifs.
 * Intègre l'upload automatique d'images vers Supabase Storage avec retour d'URL publique.
 */
export default function TinyEditor({ value, onChange, placeholder = 'Rédigez votre article sportif ici...' }) {
  const containerRef = useRef(null);
  const editorIdRef = useRef(`tinymce-editor-${Math.random().toString(36).slice(2, 9)}`);
  const [tinyLoaded, setTinyLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  const editorInstanceRef = useRef(null);
  const fallbackRef = useRef(null);
  const fileInputRef = useRef(null);

  // Charger TinyMCE 6 depuis le CDN officiel
  useEffect(() => {
    if (window.tinymce) {
      setTinyLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js';
    script.referrerPolicy = 'origin';
    script.async = true;
    script.onload = () => setTinyLoaded(true);
    script.onerror = () => {
      console.warn('TinyMCE CDN inaccessible, passage en mode éditeur HTML natif.');
      setTinyLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  // Initialisation de TinyMCE une fois le script chargé
  useEffect(() => {
    if (!tinyLoaded || !window.tinymce) return;

    const editorId = editorIdRef.current;

    if (window.tinymce.get(editorId)) {
      window.tinymce.get(editorId).remove();
    }

    window.tinymce.init({
      selector: `#${editorId}`,
      height: 440,
      menubar: 'edit insert format table',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'media', 'table', 'wordcount'
      ],
      toolbar: 'undo redo | blocks fontfamily fontsize | ' +
        'bold italic underline strikethrough | forecolor backcolor | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | link image media table blockquote | ' +
        'removeformat code preview fullscreen',
      // Handler d'upload automatique pour glisser-déposer, copier-coller et boîte de dialogue image
      images_upload_handler: async (blobInfo) => {
        try {
          const file = blobInfo.blob();
          const res = await uploadImageFile(file, 'articles');
          return res.publicUrl;
        } catch (err) {
          throw new Error('Échec upload image : ' + (err.message || 'Erreur inconnue'));
        }
      },
      automatic_uploads: true,
      image_title: true,
      file_picker_types: 'image',
      content_style: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.75;
          color: #1A1A2E;
          padding: 16px;
        }
        h1, h2, h3 { color: #0F172A; margin-top: 1.3em; margin-bottom: 0.6em; }
        p { margin-bottom: 1.1em; }
        img { max-width: 100%; height: auto; border-radius: 10px; margin: 12px 0; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
        blockquote { border-left: 4px solid #F15A24; background: #FFF7ED; padding: 14px 18px; margin: 18px 0; border-radius: 0 10px 10px 0; color: #9A3412; font-style: italic; }
      `,
      placeholder,
      branding: false,
      promotion: false,
      statusbar: true,
      setup: (editor) => {
        editorInstanceRef.current = editor;

        editor.on('init', () => {
          setEditorReady(true);
          if (value) {
            editor.setContent(value);
          }
        });

        editor.on('change keyup input', () => {
          const content = editor.getContent();
          onChange(content);
        });
      },
    });

    return () => {
      if (window.tinymce && window.tinymce.get(editorId)) {
        window.tinymce.get(editorId).remove();
      }
      editorInstanceRef.current = null;
      setEditorReady(false);
    };
  }, [tinyLoaded]);

  // Synchronisation si le form parent modifie la valeur
  useEffect(() => {
    if (editorReady && editorInstanceRef.current) {
      const current = editorInstanceRef.current.getContent();
      if (value !== current && (value || '') !== (current || '')) {
        editorInstanceRef.current.setContent(value || '');
      }
    }
  }, [value, editorReady]);

  // Méthode dédiée pour uploader un fichier depuis le bouton rapide et l'insérer à l'endroit du curseur
  const handleDirectImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadFeedback(null);

    try {
      const result = await uploadImageFile(file, 'articles');
      const imgHtml = `<img src="${result.publicUrl}" alt="${file.name.replace(/\.[^/.]+$/, '')}" style="max-width: 100%; border-radius: 10px; margin: 12px 0;" />`;

      if (editorInstanceRef.current) {
        editorInstanceRef.current.insertContent(imgHtml);
      } else if (fallbackRef.current) {
        document.execCommand('insertHTML', false, imgHtml);
        onChange(fallbackRef.current.innerHTML);
      }

      setUploadFeedback({ type: 'success', text: 'Image uploadée et insérée avec succès !' });
      setTimeout(() => setUploadFeedback(null), 3500);
    } catch (err) {
      setUploadFeedback({ type: 'error', text: err.message || 'Erreur lors de l’upload de l’image.' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fallback : Actions pour l'éditeur natif
  const execFallback = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    if (fallbackRef.current) {
      onChange(fallbackRef.current.innerHTML);
    }
  };

  return (
    <div className="tiny-editor-container" ref={containerRef}>
      {/* Barre d'actions rapides (Upload direct d'images) */}
      <div className="tiny-editor-quickbar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,image/gif"
          style={{ display: 'none' }}
          onChange={handleDirectImageUpload}
        />
        <button
          type="button"
          className="tiny-quick-upload-btn"
          disabled={uploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingImage ? (
            <>
              <span className="admin-spinner-inline" style={{ width: 14, height: 14 }} />
              Upload vers Supabase en cours…
            </>
          ) : (
            <>
              <CameraIcon size={16} /> <strong>Uploader & Insérer une image</strong>
            </>
          )}
        </button>

        <span className="tiny-quick-hint">
          {uploadFeedback ? (
            <span className={`tiny-feedback tiny-feedback--${uploadFeedback.type}`}>
              {uploadFeedback.type === 'success' ? (
                <CheckCircleIcon size={14} />
              ) : (
                <AlertTriangleIcon size={14} />
              )}
              {uploadFeedback.text}
            </span>
          ) : (
            'Glissez-déposez ou collez directement des images dans l’éditeur'
          )}
        </span>
      </div>

      {tinyLoaded ? (
        <textarea
          id={editorIdRef.current}
          defaultValue={value}
          style={{ width: '100%', minHeight: '400px', visibility: 'hidden' }}
        />
      ) : (
        /* Éditeur enrichi autonome de secours */
        <div className="native-rich-editor">
          <div className="native-rich-toolbar">
            <button type="button" onClick={() => execFallback('bold')} title="Gras"><strong>B</strong></button>
            <button type="button" onClick={() => execFallback('italic')} title="Italique"><em>I</em></button>
            <button type="button" onClick={() => execFallback('underline')} title="Souligné"><u>U</u></button>
            <span className="native-rich-divider" />
            <button type="button" onClick={() => execFallback('formatBlock', 'h2')} title="Titre 2">H2</button>
            <button type="button" onClick={() => execFallback('formatBlock', 'h3')} title="Titre 3">H3</button>
            <button type="button" onClick={() => execFallback('formatBlock', 'p')} title="Paragraphe">¶</button>
            <button type="button" onClick={() => execFallback('formatBlock', 'blockquote')} title="Citation">❝</button>
            <span className="native-rich-divider" />
            <button type="button" onClick={() => execFallback('justifyLeft')} title="Aligner à gauche">⬅</button>
            <button type="button" onClick={() => execFallback('justifyCenter')} title="Centrer">⬌</button>
            <button type="button" onClick={() => execFallback('justifyRight')} title="Aligner à droite">➡</button>
            <span className="native-rich-divider" />
            <button type="button" onClick={() => execFallback('insertUnorderedList')} title="Puces">• Liste</button>
            <button type="button" onClick={() => execFallback('insertOrderedList')} title="Numéros">1. Liste</button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('URL du lien :');
                if (url) execFallback('createLink', url);
              }}
              title="Insérer un lien"
            >
              🔗 Lien
            </button>
          </div>
          <div
            ref={fallbackRef}
            className="native-rich-canvas"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onChange(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: value || '' }}
          />
        </div>
      )}
    </div>
  );
}
