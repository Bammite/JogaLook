# -*- coding: utf-8 -*-
"""
Générateur des documents légaux personnalisés pour JogaLook.
Génère les 5 documents légaux complets avec branding, favicons et textes 100% sur-mesure.
"""

import os
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
LEGAL_SRC_DIR = os.path.join(BASE_DIR, "legal")
LEGAL_FRONTEND_DIR = os.path.join(BASE_DIR, "src", "frontend", "legal")

COMMON_CSS = """
        :root {
            --primary: #f15a24;
            --primary-hover: #d94815;
            --primary-light: rgba(241, 90, 36, 0.1);
            --dark: #0b1329;
            --dark-surface: #131c38;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text: #334155;
            --text-heading: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --accent-green: #10b981;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
            --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
            --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.8;
            color: var(--text);
            background-color: var(--bg);
            -webkit-font-smoothing: antialiased;
        }

        h1, h2, h3, h4, .nav-logo, .hero-badge, .tab-btn, .section-number {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-heading);
            font-weight: 700;
        }

        /* Navbar Header */
        .navbar {
            background-color: var(--dark);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 1.1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.45rem;
            font-weight: 800;
            text-decoration: none;
            color: #ffffff;
            letter-spacing: -0.5px;
        }

        .nav-logo svg, .nav-logo img {
            height: 28px;
            width: auto;
        }

        .nav-logo span {
            color: var(--primary);
        }

        .nav-links {
            display: flex;
            gap: 1.25rem;
            align-items: center;
        }

        .nav-links a {
            text-decoration: none;
            color: #94a3b8;
            font-size: 0.92rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .nav-links a:hover {
            color: #ffffff;
        }

        .nav-links .btn-primary {
            background-color: var(--primary);
            color: #ffffff;
            padding: 0.55rem 1.15rem;
            border-radius: 8px;
            font-weight: 600;
        }

        .nav-links .btn-primary:hover {
            background-color: var(--primary-hover);
        }

        /* Hero Banner */
        .hero-banner {
            background: linear-gradient(135deg, var(--dark) 0%, #152244 100%);
            color: #ffffff;
            padding: 3.5rem 1.5rem 2.5rem;
            text-align: center;
            position: relative;
            overflow: hidden;
            border-bottom: 3px solid var(--primary);
        }

        .hero-banner::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(241, 90, 36, 0.08) 0%, transparent 60%);
            pointer-events: none;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(241, 90, 36, 0.15);
            border: 1px solid rgba(241, 90, 36, 0.35);
            color: #ff9d75;
            padding: 0.35rem 0.95rem;
            border-radius: 9999px;
            font-size: 0.82rem;
            font-weight: 600;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .hero-banner h1 {
            color: #ffffff;
            font-size: 2.35rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            letter-spacing: -0.5px;
        }

        .hero-banner p {
            color: #cbd5e1;
            font-size: 1.05rem;
            max-width: 680px;
            margin: 0 auto;
        }

        /* Nav Pills for Legal Navigation */
        .legal-nav {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 0.6rem;
            margin-top: 2rem;
        }

        .legal-nav a {
            text-decoration: none;
            color: #e2e8f0;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 0.45rem 1rem;
            border-radius: 8px;
            font-size: 0.88rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .legal-nav a:hover {
            background: rgba(255, 255, 255, 0.18);
            color: #ffffff;
        }

        .legal-nav a.active {
            background: var(--primary);
            border-color: var(--primary);
            color: #ffffff;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(241, 90, 36, 0.35);
        }

        /* Main Container & Articles */
        .container {
            max-width: 960px;
            margin: 2.5rem auto 4rem;
            padding: 0 1.5rem;
        }

        .legal-meta-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            box-shadow: var(--shadow-sm);
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 600;
            margin-bottom: 0.2rem;
        }

        .meta-value {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--text-heading);
        }

        .legal-section {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 2.25rem;
            margin-bottom: 1.75rem;
            box-shadow: var(--shadow-sm);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .legal-section:hover {
            box-shadow: var(--shadow-md);
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.25rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }

        .section-badge {
            background: var(--primary-light);
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: 700;
            padding: 0.35rem 0.75rem;
            border-radius: 8px;
            white-space: nowrap;
        }

        .section-header h2 {
            font-size: 1.35rem;
            color: var(--text-heading);
            line-height: 1.3;
        }

        .legal-section p {
            margin-bottom: 1rem;
            font-size: 0.98rem;
        }

        .legal-section p:last-child {
            margin-bottom: 0;
        }

        .legal-section ul, .legal-section ol {
            margin: 1rem 0 1rem 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .legal-section li {
            font-size: 0.96rem;
        }

        .highlight-box {
            background: #fff7ed;
            border-left: 4px solid var(--primary);
            border-radius: 0 8px 8px 0;
            padding: 1rem 1.25rem;
            margin: 1.25rem 0;
            font-size: 0.94rem;
            color: #9a3412;
        }

        .info-box {
            background: #f0fdf4;
            border-left: 4px solid var(--accent-green);
            border-radius: 0 8px 8px 0;
            padding: 1rem 1.25rem;
            margin: 1.25rem 0;
            font-size: 0.94rem;
            color: #166534;
        }

        /* Tables */
        .table-responsive {
            overflow-x: auto;
            margin: 1.25rem 0;
            border-radius: 8px;
            border: 1px solid var(--border);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.92rem;
        }

        th {
            background-color: #f1f5f9;
            color: var(--text-heading);
            font-weight: 700;
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--border);
        }

        td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:nth-child(even) td {
            background-color: #f8fafc;
        }

        /* Footer */
        .footer {
            background-color: var(--dark);
            color: #94a3b8;
            padding: 3rem 1.5rem 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 0.9rem;
        }

        .footer-content {
            max-width: 960px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            text-align: center;
        }

        .footer-links {
            display: flex;
            flex-wrap: wrap;
            gap: 1.25rem;
            justify-content: center;
        }

        .footer-links a {
            color: #cbd5e1;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .footer-links a:hover {
            color: var(--primary);
        }

        .footer-copy {
            font-size: 0.85rem;
            color: #64748b;
        }

        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
            }
            .hero-banner h1 {
                font-size: 1.85rem;
            }
            .legal-section {
                padding: 1.5rem;
            }
            .section-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
"""

def generate_header(title, badge_text, active_slug):
    nav_items = [
        ("cgu.html", "Conditions Générales d'Utilisation", "CGU"),
        ("cgv.html", "Conditions Générales de Vente", "CGV"),
        ("politique_confidentialite.html", "Politique de Confidentialité", "Confidentialité"),
        ("mentions_legales.html", "Mentions Légales", "Mentions Légales"),
        ("politique_cookies.html", "Politique des Cookies", "Cookies"),
    ]
    
    pills_html = []
    for url, full_name, short_name in nav_items:
        is_active = "active" if url == active_slug else ""
        pills_html.append(f'<a href="{url}" class="{is_active}" title="{full_name}">{short_name}</a>')
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — JogaLook</title>
    <meta name="description" content="{title} officielles de la plateforme JogaLook, opérée par ATTIC SA à Dakar, Sénégal.">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" href="/favicon.svg">
    <link rel="shortcut icon" href="/favicon.svg">
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    
    <!-- Polices Google -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
{COMMON_CSS}
    </style>
</head>
<body>

    <!-- Header Navbar -->
    <nav class="navbar">
        <a href="/" class="nav-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px;">
                <circle cx="24" cy="24" r="24" fill="#0b1329"/>
                <path d="M10 14 L14 10 L18 13 C19.5 14 20.5 14 24 14 C27.5 14 28.5 14 30 13 L34 10 L38 14 L33 18 L33 38 L15 38 L15 18 Z" fill="#f15a24"/>
                <path d="M20 14 Q24 17 28 14" stroke="#0b1329" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            </svg>
            Joga<span>Look</span>
        </a>
        <div class="nav-links">
            <a href="/">← Retour à la boutique</a>
            <a href="/contact" class="btn-primary">Support & Contact</a>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="hero-banner">
        <div class="hero-badge">{badge_text}</div>
        <h1>{title}</h1>
        <p>Document officiel encadrant les services de vente et de personnalisation de maillots de sport sur JogaLook.</p>
        
        <div class="legal-nav">
            {"".join(pills_html)}
        </div>
    </header>

    <main class="container">
"""

def generate_footer():
    return """
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-links">
                <a href="/">Boutique</a>
                <a href="/contact">Contact</a>
                <a href="cgu.html">CGU</a>
                <a href="cgv.html">CGV</a>
                <a href="politique_confidentialite.html">Confidentialité</a>
                <a href="mentions_legales.html">Mentions Légales</a>
                <a href="politique_cookies.html">Cookies</a>
            </div>
            <p class="footer-copy">&copy; 2026 JogaLook — Propriété exclusive de ATTIC SA. Tous droits réservés. Dakar, Sénégal.</p>
        </div>
    </footer>

</body>
</html>
"""

# ==============================================================================
# 1. CGU (Conditions Générales d'Utilisation)
# ==============================================================================
def build_cgu_content():
    return """
        <div class="legal-meta-card">
            <div class="meta-item">
                <span class="meta-label">Société éditrice</span>
                <span class="meta-value">ATTIC SA (JogaLook)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Siège social</span>
                <span class="meta-value">Dakar, HLM-Bentaly, Sénégal</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Date d'effet</span>
                <span class="meta-value">1er Mars 2026</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Contact juridique</span>
                <span class="meta-value">contact@jogalook.com</span>
            </div>
        </div>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 1</span>
                <h2>Objet et Acceptation des Conditions</h2>
            </div>
            <p>Les présentes <strong>Conditions Générales d’Utilisation (CGU)</strong> ont pour objet de définir les modalités et conditions dans lesquelles la société <strong>ATTIC SA</strong> (ci-après <em>« JogaLook »</em> ou <em>« la Société »</em>) met à la disposition des internautes (ci-après <em>« l’Utilisateur »</em>) sa plateforme e-commerce accessible à l’adresse <a href="https://www.jogalook.com" target="_blank">www.jogalook.com</a>.</p>
            <p>Toute navigation, consultation du catalogue, inscription ou utilisation des fonctionnalités interactives de JogaLook implique l'adhésion pleine, entière et sans réserve de l'Utilisateur aux présentes CGU. Si l'Utilisateur n'accepte pas ces conditions, il doit renoncer immédiatement à l'utilisation du Site.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 2</span>
                <h2>Présentation des Services JogaLook</h2>
            </div>
            <p>JogaLook est une plateforme sénégalaise spécialisée dans :</p>
            <ul>
                <li><strong>La commercialisation de maillots de football et de sport authentiques</strong> : maillots de clubs nationaux et internationaux, sélections nationales, éditions rétro, spéciales et d'entraînement.</li>
                <li><strong>L'Atelier de Flocage & Personnalisation</strong> : un outil interactif permettant à l'Utilisateur de configurer des maillots personnalisés en y apposant un nom, un numéro officiel et des badges de ligues ou tournois.</li>
                <li><strong>Le suivi interactif de commande</strong> : gestion de panier d'achat, historique des achats et suivi d'acheminement de la livraison à Dakar et dans toutes les régions du Sénégal.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 3</span>
                <h2>Accès au Site et Authentification par OTP</h2>
            </div>
            <p>L’accès au catalogue public et aux articles du blog sportif est libre et gratuit pour tout internaute disposant d’une connexion Internet.</p>
            <p>Pour passer commande, sauvegarder son panier ou accéder à son espace client, JogaLook propose un système d’authentification sécurisé et simplifié <strong>sans mot de passe</strong> :</p>
            <ul>
                <li>L’Utilisateur renseigne son adresse email valide.</li>
                <li>Un <strong>code d’authentification à usage unique (OTP)</strong> à 6 chiffres lui est instantanément expédié par voie électronique via notre partenaire certifié Resend.</li>
                <li>La saisie correcte de ce code génère un jeton de session chiffré (JWT) garantissant l'accès sécurisé à son compte.</li>
            </ul>
            <div class="highlight-box">
                <strong>Sécurité de l'OTP :</strong> Le code OTP est strictement personnel et confidentiel. Il expire automatiquement après un délai de 10 minutes. L'Utilisateur est seul responsable de la confidentialité de sa boîte de réception électronique.
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 4</span>
                <h2>Engagements et Comportement de l'Utilisateur</h2>
            </div>
            <p>En utilisant la plateforme JogaLook, l'Utilisateur s'engage formellement à :</p>
            <ol>
                <li>Fournir des informations exactes, complètes et à jour (notamment concernant l'adresse de livraison et le numéro de téléphone pour la réception des colis).</li>
                <li>Ne pas utiliser l'Atelier de Flocage pour générer des inscriptions injurieuses, diffamatoires, racistes, incitant à la haine ou portant atteinte aux bonnes mœurs et à l'ordre public sénégalais.</li>
                <li>Ne pas tenter de contourner les systèmes de sécurité, de procéder à des attaques par déni de service, ou d'extraire de manière automatisée (scraping) le contenu, les visuels ou les bases de données du Site.</li>
                <li>Ne pas usurper l'identité d'un tiers lors de la connexion OTP ou de la passation de commande.</li>
            </ol>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 5</span>
                <h2>Propriété Intellectuelle</h2>
            </div>
            <p>L’ensemble des éléments constituant le site JogaLook — incluant sans s'y limiter : l'architecture logicielle, le design UI/UX, le code source, la marque JogaLook, le logo, les visuels exclusifs, les maquettes 2D/3D de l'Atelier de personnalisation et les textes éditoriaux — sont la propriété exclusive de la société <strong>ATTIC SA</strong> ou de ses partenaires techniques sous licence.</p>
            <p>Toute reproduction, distribution, modification, adaptation ou exploitation commerciale totale ou partielle de ces éléments, sans autorisation écrite préalable de la direction de ATTIC SA, est constitutive de contrefaçon et passible de poursuites judiciaires conformément à l'Accord de Bangui révisé (OAPI) et au Code pénal sénégalais.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 6</span>
                <h2>Disponibilité du Service et Maintenance</h2>
            </div>
            <p>JogaLook s'efforce de maintenir un accès continu au service 24h/24 et 7j/7 grâce à une infrastructure cloud moderne propulsée par Vercel et Supabase. Cependant, la Société se réserve le droit d’interrompre temporairement l’accès au site pour des opérations de maintenance programmée, de mise à jour technique ou en cas de force majeure indépendante de sa volonté.</p>
            <p>ATTIC SA ne saurait être tenue pour responsable des ralentissements, dysfonctionnements de réseau Internet ou interruptions temporaires du service.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 7</span>
                <h2>Protection des Données Personnelles</h2>
            </div>
            <p>Le traitement des données à caractère personnel collectées sur la plateforme est soumis à la législation sénégalaise en vigueur (Loi n° 2008-12 du 25 janvier 2008). Pour comprendre les modalités de collecte, de stockage et d'exercice de vos droits (accès, rectification, suppression), veuillez consulter notre <a href="politique_confidentialite.html">Politique de Confidentialité</a>.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 8</span>
                <h2>Modification des CGU</h2>
            </div>
            <p>ATTIC SA se réserve la faculté de faire évoluer les présentes CGU à tout moment afin de prendre en compte les améliorations fonctionnelles du Site ou l'évolution des réglementations en vigueur. La version opposable à l'Utilisateur est celle accessible en ligne à la date de son utilisation du Site.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 9</span>
                <h2>Droit Applicable et Résolution des Différends</h2>
            </div>
            <p>Les présentes CGU sont régies et interprétées selon le <strong>droit de la République du Sénégal</strong>.</p>
            <p>En cas de litige relatif à l’interprétation ou à l’exécution des présentes, les parties s'engagent à privilégier une solution amiable. À défaut d’accord amiable dans un délai de 30 jours, le litige sera soumis à la compétence exclusive des juridictions compétentes du <strong>Ressort du Tribunal de Commerce de Dakar</strong>.</p>
        </section>
"""

# ==============================================================================
# 2. CGV (Conditions Générales de Vente)
# ==============================================================================
def build_cgv_content():
    return """
        <div class="legal-meta-card">
            <div class="meta-item">
                <span class="meta-label">Vendeur</span>
                <span class="meta-value">ATTIC SA (JogaLook)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">RCCM / NINEA</span>
                <span class="meta-value">SN STL 2025 A 1556 / 012216314</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Devise & Prix</span>
                <span class="meta-value">Franc CFA (XOF) TTC</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Service Client</span>
                <span class="meta-value">+221 78 194 13 51 / +221 71 031 69 39</span>
            </div>
        </div>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 1</span>
                <h2>Dispositions Générales et Champ d'Application</h2>
            </div>
            <p>Les présentes <strong>Conditions Générales de Vente (CGV)</strong> s'appliquent sans restriction ni réserve à l'ensemble des ventes conclues par la société <strong>ATTIC SA</strong> (opérant sous la marque commerciale <em>« JogaLook »</em>) auprès de tout acheteur majeur (ci-après <em>« le Client »</em>), via le site Internet <a href="https://www.jogalook.com">www.jogalook.com</a>.</p>
            <p>La validation définitive d'une commande par le Client vaut acceptation pleine et entière des présentes CGV, dont il reconnaît avoir pris connaissance préalablement à son achat.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 2</span>
                <h2>Caractéristiques des Produits & Authenticité</h2>
            </div>
            <p>JogaLook propose des articles de sport premium :</p>
            <ul>
                <li><strong>Maillots officiels et répliques authentiques :</strong> modèles domicile (Home), extérieur (Away), troisième maillot (Third), pré-match et éditions collectors de clubs et d'équipes nationales.</li>
                <li><strong>Tailles disponibles :</strong> standardisées du XS au 3XL (selon guide des tailles consultable sur chaque fiche produit).</li>
                <li><strong>Visuels et descriptions :</strong> Les photographies et maquettes présentées sont les plus fidèles possibles. Toutefois, de légères variations de nuances de couleurs peuvent survenir selon l'écran ou l'éclairage.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 3</span>
                <h2>Atelier de Flocage & Personnalisation sur-mesure</h2>
            </div>
            <p>JogaLook met à la disposition du Client un service d'atelier de flocage permettant d'ajouter :</p>
            <ul>
                <li>Un nom personnalisé ou nom de joueur officiel</li>
                <li>Un numéro personnalisé</li>
                <li>Des badges de manches officiels (Ligue 1, Champions League, Coupe du Monde, etc.)</li>
            </ul>
            <div class="highlight-box">
                <strong>Attention — Dispositions spécifiques aux produits personnalisés :</strong><br>
                Conformément aux usages commerciaux et aux règles de protection du consommateur relatives aux biens confectionnés nettement sur-mesure, <strong>les articles ayant fait l'objet d'un flocage personnalisé ne peuvent être ni échangés, ni repris, ni remboursés</strong>, sauf défaut avéré imputable à l'impression par nos ateliers. Le Client est invité à vérifier scrupuleusement l'orthographe et les numéros avant validation de sa commande.
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 4</span>
                <h2>Tarifs et Monnaie de Facturation</h2>
            </div>
            <p>Les prix des produits sont indiqués sur le Site en <strong>Francs CFA (XOF)</strong>, toutes taxes comprises (TTC). Les frais de livraison sont calculés et affichés distinctement avant la validation finale de la commande, en fonction de la localité géographique sélectionnée.</p>
            <p>JogaLook se réserve le droit de modifier ses prix à tout moment. Les produits seront cependant facturés sur la base des tarifs en vigueur au moment de l'enregistrement de la commande.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 5</span>
                <h2>Processus de Commande</h2>
            </div>
            <p>Pour passer commande sur JogaLook, le Client suit le parcours suivant :</p>
            <ol>
                <li>Sélection des articles (taille, quantité, options de flocage le cas échéant) et ajout au panier.</li>
                <li>Authentification rapide par email via notre système sécurisé de code OTP.</li>
                <li>Renseignement de l'adresse exacte de livraison et du numéro de téléphone joignable (WhatsApp/Appels).</li>
                <li>Choix du mode de paiement.</li>
                <li>Vérification du récapitulatif de commande et confirmation finale.</li>
            </ol>
            <p>Dès confirmation, un email récapitulatif contenant le numéro unique de commande est adressé au Client.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 6</span>
                <h2>Modalités de Paiement</h2>
            </div>
            <p>JogaLook met à disposition plusieurs modes de règlement sécurisés :</p>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Mode de Paiement</th>
                            <th>Description & Sécurité</th>
                            <th>Frais additionnels</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Paiement à la livraison (Cash on Delivery)</strong></td>
                            <td>Règlement en espèces directement auprès de notre livreur partenaire au moment de la réception du colis.</td>
                            <td>Aucun</td>
                        </tr>
                        <tr>
                            <td><strong>Mobile Money (Wave & Orange Money)</strong></td>
                            <td>Paiement instantané via votre compte mobile sénégalais via passerelle dédiée.</td>
                            <td>Aucun</td>
                        </tr>
                        <tr>
                            <td><strong>Carte Bancaire (Visa / Mastercard)</strong></td>
                            <td>Transaction chiffrée via la passerelle de paiement sécurisée PayBammite aux normes PCI-DSS.</td>
                            <td>Aucun</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 7</span>
                <h2>Livraison et Délais d'Acheminement</h2>
            </div>
            <p>JogaLook assure la livraison de ses commandes partout au Sénégal :</p>
            <ul>
                <li><strong>Région de Dakar :</strong> Expédition express en <strong>24 à 48 heures ouvrées</strong>.</li>
                <li><strong>Autres Régions du Sénégal :</strong> Acheminement sous <strong>48 à 72 heures ouvrées</strong> via nos transporteurs relais partenaires.</li>
                <li><strong>Délais supplémentaires Atelier Flocage :</strong> Tout article floqué nécessite un temps de confection artisanale additionnel de 24h à 48h.</li>
            </ul>
            <p>Le livreur contacte systématiquement le destinataire par téléphone préalablement à son passage. En cas d'absence injustifiée lors de deux présentations consécutives, la commande sera réacheminée en agence.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 8</span>
                <h2>Droit de Rétractation et Retours</h2>
            </div>
            <p>Pour les <strong>articles standards non personnalisés</strong>, le Client bénéficie d'un délai de <strong>sept (7) jours ouvrés</strong> à compter de la réception pour demander un échange ou un remboursement.</p>
            <p><strong>Conditions impératives de reprise :</strong></p>
            <ul>
                <li>Le maillot doit être dans son état d'origine neuf, non porté, non lavé, exempt de parfum ou de tâche.</li>
                <li>Toutes les étiquettes et emballages d'origine doivent être parfaitement intacts.</li>
                <li>Les frais de retour sont à la charge du Client, sauf erreur avérée de préparation commise par JogaLook.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 9</span>
                <h2>Garanties Légales et Réclamations</h2>
            </div>
            <p>Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés. En cas de non-conformité avérée (défaut de couture, erreur de référence reçue, erreur de flocage par rapport au bon de commande), JogaLook s'engage à échanger le produit sans frais ou à rembourser l'intégralité de la commande.</p>
            <p>Toute réclamation doit être notifiée par email à <a href="mailto:contact@jogalook.com">contact@jogalook.com</a> ou par WhatsApp au <strong>+221 78 194 13 51</strong> dans les 48h suivant la livraison, avec photos justificatives.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 10</span>
                <h2>Droit Applicable et Juridiction</h2>
            </div>
            <p>Les présentes CGV sont soumises à la législation de la <strong>République du Sénégal</strong> (Code des Obligations Civiles et Commerciales). Tout litige qui ne trouverait pas d'issue amiable sera soumis à la juridiction exclusive du <strong>Tribunal de Commerce de Dakar</strong>.</p>
        </section>
"""

# ==============================================================================
# 3. Politique de Confidentialité
# ==============================================================================
def build_privacy_content():
    return """
        <div class="legal-meta-card">
            <div class="meta-item">
                <span class="meta-label">Responsable du traitement</span>
                <span class="meta-value">ATTIC SA (JogaLook)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Délégué aux Données (DPO)</span>
                <span class="meta-value">dpo@jogalook.com</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Cadre légal</span>
                <span class="meta-value">Loi sénégalaise n° 2008-12 (CDP)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Sécurité</span>
                <span class="meta-value">Chiffrement TLS & Base PostgreSQL Supabase</span>
            </div>
        </div>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 1</span>
                <h2>Engagement de JogaLook pour la Vie Privée</h2>
            </div>
            <p>La société <strong>ATTIC SA</strong> (ci-après <em>« JogaLook »</em>) accorde une importance primordiale à la protection et à la confidentialité des données à caractère personnel de ses utilisateurs et clients.</p>
            <p>La présente Politique de Confidentialité décrit avec précision et transparence les catégories de données collectées, les finalités de leur traitement, ainsi que les mesures de sécurité et les droits dont vous disposez, conformément aux dispositions de la <strong>Loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> portant sur la protection des données à caractère personnel et aux recommandations de la <strong>Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 2</span>
                <h2>Catégories de Données Personnelles Collectées</h2>
            </div>
            <p>Dans le cadre de l’exploitation de notre plateforme, nous collectons les données suivantes :</p>
            <ul>
                <li><strong>Données d’identification et de contact :</strong> Adresse email (utilisée pour l'envoi de l'OTP de connexion sécurisé et des confirmations de commande), nom, prénom, numéro de téléphone portable (joignable pour la coordination des livraisons).</li>
                <li><strong>Données de livraison et facturation :</strong> Adresse postale complète de livraison (ville, quartier, repère géographique pour Dakar et régions).</li>
                <li><strong>Données de personnalisation d'atelier :</strong> Textes et numéros de flocage transmis lors de la commande de maillots personnalisés.</li>
                <li><strong>Données de transactions financières :</strong> Références de commande, montant facturé, statut du paiement (veuillez noter que les données de cartes bancaires sont traitées directement par les passerelles bancaires certifiées sans que JogaLook n'y ait jamais accès).</li>
                <li><strong>Données techniques de connexion :</strong> Adresse IP, type d'appareil, navigateur et logs d'authentification OTP pour prévenir les fraudes.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 3</span>
                <h2>Finalités des Traitements et Bases Légales</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Finalité du traitement</th>
                            <th>Base Légale</th>
                            <th>Durée de conservation</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Authentification sans mot de passe (OTP)</strong></td>
                            <td>Exécution contractuelle & Sécurité</td>
                            <td>Durée d'activité du compte utilisateur</td>
                        </tr>
                        <tr>
                            <td><strong>Gestion & Livraison des commandes</strong></td>
                            <td>Exécution du contrat de vente</td>
                            <td>Durée de la relation + 5 ans (obligations comptables)</td>
                        </tr>
                        <tr>
                            <td><strong>Service client & Suivi réclamations</strong></td>
                            <td>Intérêt légitime / Relation client</td>
                            <td>3 ans après le dernier contact</td>
                        </tr>
                        <tr>
                            <td><strong>Prévention de la fraude & Sécurité</strong></td>
                            <td>Intérêt légitime & Obligations légales</td>
                            <td>1 an pour les logs de connexion</td>
                        </tr>
                        <tr>
                            <td><strong>Communications d'offres promotionnelles</strong></td>
                            <td>Consentement préalable de l'utilisateur</td>
                            <td>Jusqu'au retrait du consentement / désabonnement</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 4</span>
                <h2>Destinataires des Données et Sous-traitants Techniques</h2>
            </div>
            <p>JogaLook ne vend, ne loue, ni ne cède aucune donnée personnelle à des courtiers ou à des régies publicitaires tierces. Les données sont partagées uniquement avec nos sous-traitants techniques strictement nécessaires au fonctionnement du service :</p>
            <ul>
                <li><strong>Vercel Inc. :</strong> Hébergement du frontend et du réseau de distribution de contenu (CDN) sécurisé.</li>
                <li><strong>Supabase Inc. :</strong> Hébergement de la base de données PostgreSQL chiffrée avec politiques de sécurité RLS (Row Level Security).</li>
                <li><strong>Resend Inc. :</strong> Infrastructure certifiée pour l’envoi ultra-sécurisé des emails transactionnels et des codes OTP.</li>
                <li><strong>Partenaires logistiques et livreurs :</strong> Uniquement le nom, le numéro de téléphone et l'adresse de destination pour assurer la remise physique du colis.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 5</span>
                <h2>Mesures de Sécurité des Données</h2>
            </div>
            <p>Nous appliquons les standards de cybersécurité les plus stricts :</p>
            <div class="info-box">
                <strong>Garanties de sécurité :</strong>
                <ul style="margin: 0.5rem 0 0 1rem;">
                    <li>Chiffrement systématique de toutes les communications via protocole <strong>HTTPS / TLS 1.3</strong>.</li>
                    <li>Authentification par OTP à usage unique, éliminant les risques de vol de mot de passe.</li>
                    <li>Tokens de session JWT signés cryptographiquement.</li>
                    <li>Accès à la base de données restreint aux microservices autorisés via des clés de service ultra-sécurisées.</li>
                </ul>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 6</span>
                <h2>Vos Droits sur Vos Données Personnelles</h2>
            </div>
            <p>Conformément à la législation sénégalaise, vous bénéficiez des droits suivants :</p>
            <ul>
                <li><strong>Droit d'accès et de communication :</strong> Vous pouvez demander une copie intégrale des données que nous détenons vous concernant.</li>
                <li><strong>Droit de rectification :</strong> Vous pouvez demander la mise à jour ou la correction de vos coordonnées.</li>
                <li><strong>Droit à l'effacement (« droit à l'oubli ») :</strong> Vous pouvez demander la suppression définitive de votre compte et de vos données, sous réserve de nos obligations légales de conservation des factures.</li>
                <li><strong>Droit d'opposition :</strong> Vous pouvez vous opposer à tout moment à la réception d'emails promotionnels en cliquant sur le lien de désinscription ou en nous écrivant.</li>
            </ul>
            <p>Pour exercer l'un de ces droits, adressez simplement votre demande par email à <a href="mailto:contact@jogalook.com">contact@jogalook.com</a> avec une pièce justificative d'identité. Nous nous engageons à vous répondre dans un délai maximal de <strong>30 jours</strong>.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 7</span>
                <h2>Recours auprès de l'Autorité de Contrôle</h2>
            </div>
            <p>Si vous estimez que le traitement de vos données personnelles par JogaLook n'est pas conforme aux exigences légales, vous avez le droit d'introduire une réclamation auprès de la <strong>Commission de Protection des Données Personnelles (CDP) du Sénégal</strong> (site web : <a href="https://www.cdp.sn" target="_blank" rel="noopener">www.cdp.sn</a>).</p>
        </section>
"""

# ==============================================================================
# 4. Mentions Légales
# ==============================================================================
def build_mentions_content():
    return """
        <div class="legal-meta-card">
            <div class="meta-item">
                <span class="meta-label">Éditeur du site</span>
                <span class="meta-value">ATTIC SA (JogaLook)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Registre du Commerce</span>
                <span class="meta-value">SN STL 2025 A 1556</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Numéro d'Identification (NINEA)</span>
                <span class="meta-value">012216314</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Juridiction</span>
                <span class="meta-value">Dakar, République du Sénégal</span>
            </div>
        </div>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Section 1</span>
                <h2>Identification de la Société Éditrice</h2>
            </div>
            <p>Le site Internet accessible à l'adresse <a href="https://www.jogalook.com">www.jogalook.com</a> est édité et exploité par la société <strong>ATTIC SA</strong> :</p>
            <div class="table-responsive">
                <table>
                    <tbody>
                        <tr>
                            <td style="width: 35%;"><strong>Raison sociale</strong></td>
                            <td><strong>ATTIC SA</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Nom commercial / Enseigne</strong></td>
                            <td>JogaLook</td>
                        </tr>
                        <tr>
                            <td><strong>Forme juridique</strong></td>
                            <td>Société Anonyme (SA) de droit sénégalais</td>
                        </tr>
                        <tr>
                            <td><strong>Registre du Commerce et du Crédit Mobilier (RCCM)</strong></td>
                            <td>SN STL 2025 A 1556</td>
                        </tr>
                        <tr>
                            <td><strong>Numéro NINEA</strong></td>
                            <td>012216314</td>
                        </tr>
                        <tr>
                            <td><strong>Siège social</strong></td>
                            <td>Dakar, HLM-Bentaly, République du Sénégal</td>
                        </tr>
                        <tr>
                            <td><strong>Courriel de contact</strong></td>
                            <td><a href="mailto:contact@jogalook.com">contact@jogalook.com</a></td>
                        </tr>
                        <tr>
                            <td><strong>Téléphone & Assistance</strong></td>
                            <td>+221 78 194 13 51 / +221 71 031 69 39</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Section 2</span>
                <h2>Direction de la Publication</h2>
            </div>
            <p>Le Directeur de la publication du site JogaLook est le représentant légal de la société <strong>ATTIC SA</strong> en sa qualité d'administrateur général. Pour toute demande éditoriale ou partenariat média, veuillez adresser vos correspondances à <a href="mailto:contact@jogalook.com">contact@jogalook.com</a>.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Section 3</span>
                <h2>Prestataires d'Hébergement et d'Infrastructure</h2>
            </div>
            <p>La plateforme JogaLook s'appuie sur une infrastructure cloud moderne et hautement sécurisée assurée par les prestataires de classe mondiale suivants :</p>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Rôle technique</th>
                            <th>Prestataire</th>
                            <th>Adresse & Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Hébergement Frontend & CDN</strong></td>
                            <td><strong>Vercel Inc.</strong></td>
                            <td>340 S Lemon Ave #4133, Walnut, CA 91789, USA — <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></td>
                        </tr>
                        <tr>
                            <td><strong>Base de données & Stockage Cloud</strong></td>
                            <td><strong>Supabase Inc.</strong></td>
                            <td>970 Toa Payoh North #07-04, Singapour 318992 — <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a></td>
                        </tr>
                        <tr>
                            <td><strong>Infrastructure Email Transactionnelle (OTP)</strong></td>
                            <td><strong>Resend Inc.</strong></td>
                            <td>San Francisco, CA, USA — <a href="https://resend.com" target="_blank" rel="noopener">resend.com</a></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Section 4</span>
                <h2>Propriété Intellectuelle et Droits Réservés</h2>
            </div>
            <p>Les marques, logos, slogans, chartes graphiques, photographies de maillots, maquettes de prévisualisation de l'Atelier de flocage, textes éditoriaux et logiciels intégrés sur le Site constituent des créations protégées par les lois sénégalaises et internationales régissant la propriété littéraire, artistique et industrielle (Accords OAPI).</p>
            <p>Toute reproduction intégrale ou partielle, par quelque procédé que ce soit, faite sans le consentement préalable écrit de <strong>ATTIC SA</strong> est illicite et constitue une contrefaçon sanctionnée pénalement.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Section 5</span>
                <h2>Signaler un Contenu ou une Anomalie</h2>
            </div>
            <p>Conformément aux règles applicables aux services en ligne, tout utilisateur constatant une erreur, un contenu inapproprié ou une violation de droits de propriété est invité à en informer la direction technique à l'adresse <a href="mailto:contact@jogalook.com">contact@jogalook.com</a> avec l'objet <em>« Signalement Contenu »</em>.</p>
        </section>
"""

# ==============================================================================
# 5. Politique des Cookies & Stockage Local
# ==============================================================================
def build_cookies_content():
    return """
        <div class="legal-meta-card">
            <div class="meta-item">
                <span class="meta-label">Site concerné</span>
                <span class="meta-value">www.jogalook.com</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Technologie client</span>
                <span class="meta-value">LocalStorage & JWT Session</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Traceurs publicitaires</span>
                <span class="meta-value">Aucun traceur tiers intrusif</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Mise à jour</span>
                <span class="meta-value">Septembre 2026</span>
            </div>
        </div>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 1</span>
                <h2>Comprendre les Cookies et le Stockage Local</h2>
            </div>
            <p>Lors de votre navigation sur <a href="https://www.jogalook.com">www.jogalook.com</a>, des informations relatives à votre session peuvent être temporairement ou durablement stockées sur votre appareil (ordinateur, smartphone, tablette) via des traceurs ou des technologies de <strong>stockage web local (LocalStorage / SessionStorage)</strong>.</p>
            <p>Contrairement aux sites e-commerce traditionnels qui multiplient les cookies publicitaires et trackers intrusifs, <strong>JogaLook privilégie une architecture moderne et respectueuse de votre vie privée</strong> basée sur le stockage local nécessaire au fonctionnement strict de votre expérience d'achat.</p>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 2</span>
                <h2>Inventaire des Technologies de Stockage Utilisées par JogaLook</h2>
            </div>
            <p>Voici la liste exhaustive et transparente des éléments stockés sur votre navigateur lorsque vous utilisez JogaLook :</p>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Clé de Stockage</th>
                            <th>Type de technologie</th>
                            <th>Finalité & Rôle</th>
                            <th>Caractère Obligatoire</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>jl_token / auth_token</strong></td>
                            <td>LocalStorage (JWT)</td>
                            <td>Maintient votre session connectée après validation de votre code OTP sans vous redemander de vous reconnecter à chaque page.</td>
                            <td><span style="color: var(--primary); font-weight:700;">Strictement Nécessaire</span></td>
                        </tr>
                        <tr>
                            <td><strong>jl_cart / cart_items</strong></td>
                            <td>LocalStorage (JSON)</td>
                            <td>Sauvegarde la liste des maillots et les personnalisations de flocage ajoutés dans votre panier, même si vous rechargez la page ou quittez le site.</td>
                            <td><span style="color: var(--primary); font-weight:700;">Strictement Nécessaire</span></td>
                        </tr>
                        <tr>
                            <td><strong>jl_user_info</strong></td>
                            <td>LocalStorage</td>
                            <td>Pré-remplit vos informations de livraison (nom, téléphone, adresse à Dakar/régions) pour faciliter vos futures commandes.</td>
                            <td>Fonctionnel (Confort)</td>
                        </tr>
                        <tr>
                            <td><strong>jl_theme / filters</strong></td>
                            <td>SessionStorage</td>
                            <td>Mémorise vos filtres de recherche (tailles, clubs, championnats) pendant votre session active.</td>
                            <td>Fonctionnel</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 3</span>
                <h2>Absence de Traceurs Publicitaires Tiers</h2>
            </div>
            <div class="info-box">
                <strong>Garantie JogaLook :</strong>
                JogaLook n'implémente <strong>aucun pixel espion tiers</strong> (Facebook Pixel, Google Ads Remarketing, trackers de courtiers en données) visant à profiler vos habitudes de consommation en dehors de notre boutique. Vos données de navigation restent confinées à l'expérience JogaLook.
            </div>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 4</span>
                <h2>Comment Gérer et Supprimer vos Données de Stockage Local ?</h2>
            </div>
            <p>Vous pouvez à tout moment inspecter, désactiver ou supprimer les données stockées par JogaLook dans votre navigateur :</p>
            <ul>
                <li><strong>Déconnexion manuelle :</strong> En cliquant sur le bouton « Déconnexion » dans votre profil, votre jeton d'authentification est automatiquement supprimé de votre navigateur.</li>
                <li><strong>Vider le panier :</strong> En supprimant les articles de votre panier, les données locales associées sont instantanément effacées.</li>
                <li><strong>Paramètres du navigateur :</strong> Vous pouvez supprimer les cookies et les « Données de site web » dans les paramètres de confidentialité de Chrome, Safari, Firefox ou Edge. Veuillez noter que la suppression totale empêchera le maintien de votre session et réinitialisera votre panier.</li>
            </ul>
        </section>

        <section class="legal-section">
            <div class="section-header">
                <span class="section-badge">Article 5</span>
                <h2>Contact & Informations Complémentaires</h2>
            </div>
            <p>Pour toute question relative à l'utilisation de nos technologies de session et de stockage local, vous pouvez contacter notre équipe technique à <a href="mailto:contact@jogalook.com">contact@jogalook.com</a>.</p>
        </section>
"""

# ==============================================================================
# Programme principal d'écriture des fichiers
# ==============================================================================
def main():
    os.makedirs(LEGAL_SRC_DIR, exist_ok=True)
    os.makedirs(LEGAL_FRONTEND_DIR, exist_ok=True)
    
    docs = [
        {
            "filename": "cgu.html",
            "title": "Conditions Générales d'Utilisation",
            "badge": "Mise à jour : Mars 2026",
            "content": build_cgu_content()
        },
        {
            "filename": "cgv.html",
            "title": "Conditions Générales de Vente",
            "badge": "Mise à jour : Mars 2026",
            "content": build_cgv_content()
        },
        {
            "filename": "politique_confidentialite.html",
            "title": "Politique de Confidentialité",
            "badge": "Conforme Loi Sénégalaise 2008-12",
            "content": build_privacy_content()
        },
        {
            "filename": "mentions_legales.html",
            "title": "Mentions Légales",
            "badge": "Société ATTIC SA",
            "content": build_mentions_content()
        },
        {
            "filename": "politique_cookies.html",
            "title": "Politique des Cookies & Stockage Local",
            "badge": "Gestion des traceurs et session",
            "content": build_cookies_content()
        }
    ]
    
    for doc in docs:
        html_code = generate_header(doc["title"], doc["badge"], doc["filename"])
        html_code += doc["content"]
        html_code += generate_footer()
        
        # Écriture dans legal/
        dest_root = os.path.join(LEGAL_SRC_DIR, doc["filename"])
        with open(dest_root, "w", encoding="utf-8") as f:
            f.write(html_code)
            
        # Écriture dans src/frontend/legal/
        dest_front = os.path.join(LEGAL_FRONTEND_DIR, doc["filename"])
        with open(dest_front, "w", encoding="utf-8") as f:
            f.write(html_code)
            
        print(f"✅ Généré: {doc['filename']} ({len(html_code)} octets)")

    # Alias ccg.html vers cgv.html pour rétro-compatibilité
    cgv_src = os.path.join(LEGAL_SRC_DIR, "cgv.html")
    with open(cgv_src, "r", encoding="utf-8") as f:
        cgv_content = f.read()
    with open(os.path.join(LEGAL_SRC_DIR, "ccg.html"), "w", encoding="utf-8") as f:
        f.write(cgv_content)
    with open(os.path.join(LEGAL_FRONTEND_DIR, "ccg.html"), "w", encoding="utf-8") as f:
        f.write(cgv_content)
    print("✅ Alias ccg.html généré")

if __name__ == "__main__":
    main()
