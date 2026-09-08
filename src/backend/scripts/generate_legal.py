# -*- coding: utf-8 -*-
import os

TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — JogaLook</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --primary: #f15a24;
            --primary-hover: #d94815;
            --primary-light: rgba(241, 90, 36, 0.12);
            --dark: #0f172a;
            --dark-surface: #1e293b;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text: #334155;
            --text-heading: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.75;
            color: var(--text);
            background-color: var(--bg);
            -webkit-font-smoothing: antialiased;
        }}

        h1, h2, h3, h4, .nav-logo, .hero-badge {{
            font-family: "Plus Jakarta Sans", sans-serif;
            color: var(--text-heading);
            font-weight: 700;
        }}

        /* Header Navbar */
        .navbar {{
            background-color: #0b1329;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .nav-logo {{
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 1.45rem;
            font-weight: 800;
            text-decoration: none;
            color: #ffffff;
            letter-spacing: -0.5px;
        }}

        .nav-logo span {{
            color: var(--primary);
        }}

        .nav-links {{
            display: flex;
            gap: 1.1rem;
            align-items: center;
        }}

        .nav-links a {{
            text-decoration: none;
            color: #94a3b8;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            padding: 6px 12px;
            border-radius: 6px;
        }}

        .nav-links a:hover {{
            color: #ffffff;
            background: rgba(255, 255, 255, 0.06);
        }}

        .nav-links a.active {{
            color: #ffffff;
            background: var(--primary);
            font-weight: 600;
        }}

        .nav-back {{
            background: rgba(241, 90, 36, 0.15) !important;
            color: var(--primary) !important;
            border: 1px solid rgba(241, 90, 36, 0.3) !important;
            font-weight: 600 !important;
        }}

        .nav-back:hover {{
            background: var(--primary) !important;
            color: #ffffff !important;
        }}

        /* Hero Banner */
        .hero {{
            background: linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e293b 100%);
            color: #ffffff;
            padding: 4.5rem 1.5rem 5rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}

        .hero::before {{
            content: "";
            position: absolute;
            top: -40%;
            right: -10%;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(241, 90, 36, 0.18) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }}

        .hero-badge {{
            display: inline-block;
            padding: 6px 18px;
            background: rgba(241, 90, 36, 0.18);
            border: 1px solid rgba(241, 90, 36, 0.35);
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--primary);
            margin-bottom: 1.1rem;
        }}

        .hero h1 {{
            font-size: clamp(2.2rem, 4vw, 3rem);
            color: #ffffff;
            margin-bottom: 0.8rem;
            font-weight: 800;
        }}

        .hero p {{
            color: #94a3b8;
            font-size: 1.05rem;
            max-width: 650px;
            margin: 0 auto;
        }}

        /* Main Container */
        .container {{
            max-width: 960px;
            margin: -2.8rem auto 4.5rem;
            padding: 0 1.5rem;
            position: relative;
            z-index: 10;
        }}

        .document-card {{
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: 0 12px 30px -6px rgba(15, 23, 42, 0.07), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
            border: 1px solid var(--border);
            padding: 3.5rem 3rem;
        }}

        .document-meta {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            padding-bottom: 2rem;
            margin-bottom: 2.5rem;
            border-bottom: 2px solid var(--border);
        }}

        .meta-pill {{
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .meta-pill span {{
            color: var(--primary);
            font-weight: 700;
        }}

        .print-btn {{
            background: #f1f5f9;
            color: var(--text);
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }}

        .print-btn:hover {{
            background: #e2e8f0;
            color: #0f172a;
        }}

        /* Articles & Content */
        .article {{
            margin-bottom: 3rem;
        }}

        .article:last-child {{
            margin-bottom: 0;
        }}

        .article h2 {{
            font-size: 1.45rem;
            color: #0f172a;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 0.6rem;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        .article h2::before {{
            content: "";
            display: inline-block;
            width: 6px;
            height: 22px;
            background: var(--primary);
            border-radius: 4px;
        }}

        .article h3 {{
            font-size: 1.15rem;
            color: #1e293b;
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
        }}

        .article p {{
            margin-bottom: 1.1rem;
            color: #334155;
            font-size: 0.98rem;
            line-height: 1.75;
        }}

        .article ul, .article ol {{
            margin: 1rem 0 1.5rem 1.75rem;
            color: #334155;
        }}

        .article li {{
            margin-bottom: 0.6rem;
            font-size: 0.98rem;
            line-height: 1.65;
        }}

        .article li strong {{
            color: #0f172a;
        }}

        .highlight-box {{
            background: rgba(241, 90, 36, 0.05);
            border-left: 4px solid var(--primary);
            padding: 1.25rem 1.5rem;
            border-radius: 0 10px 10px 0;
            margin: 1.5rem 0;
            font-size: 0.96rem;
        }}

        .highlight-box p:last-child {{
            margin-bottom: 0;
        }}

        .info-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            font-size: 0.92rem;
        }}

        .info-table th, .info-table td {{
            padding: 12px 16px;
            border: 1px solid var(--border);
            text-align: left;
        }}

        .info-table th {{
            background: #f8fafc;
            color: #0f172a;
            font-weight: 700;
        }}

        .info-table tr:nth-child(even) {{
            background: #fdfdfd;
        }}

        a {{
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }}

        a:hover {{
            text-decoration: underline;
        }}

        /* Site Footer */
        .site-footer {{
            background-color: #0b1329;
            color: #94a3b8;
            padding: 4.5rem 2rem 2rem;
            margin-top: 5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }}

        .site-footer-container {{
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 2.5rem;
        }}

        .site-footer-col h4 {{
            color: #ffffff;
            font-size: 1.05rem;
            margin-bottom: 1.2rem;
            font-weight: 700;
        }}

        .site-footer-col p {{
            font-size: 0.9rem;
            line-height: 1.65;
            margin-bottom: 1rem;
        }}

        .site-footer-col ul {{
            list-style: none;
        }}

        .site-footer-col ul li {{
            margin-bottom: 0.6rem;
        }}

        .site-footer-col ul li a {{
            color: #94a3b8;
            font-weight: 400;
            font-size: 0.9rem;
            transition: color 0.2s;
        }}

        .site-footer-col ul li a:hover {{
            color: var(--primary);
            text-decoration: none;
        }}

        .site-footer-bottom {{
            max-width: 1000px;
            margin: 3rem auto 0;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
            font-size: 0.85rem;
            color: #64748b;
        }}

        @media (max-width: 768px) {{
            .navbar {{
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
            }}
            .nav-links {{
                flex-wrap: wrap;
                justify-content: center;
                gap: 0.5rem;
            }}
            .document-card {{
                padding: 2rem 1.25rem;
                border-radius: 12px;
            }}
            .hero {{
                padding: 3.5rem 1rem 4rem;
            }}
        }}

        @media print {{
            .navbar, .site-footer, .print-btn, .hero-badge {{
                display: none !important;
            }}
            .hero {{
                background: none;
                color: #000;
                padding: 1rem 0;
            }}
            .hero h1 {{
                color: #000;
            }}
            .container {{
                margin: 0;
                max-width: 100%;
                padding: 0;
            }}
            .document-card {{
                box-shadow: none;
                border: none;
                padding: 0;
            }}
        }}
    </style>
</head>
<body>

    <nav class="navbar">
        <a href="/" class="nav-logo">JOGA<span>LOOK</span></a>
        <div class="nav-links">
            <a href="cgu.html" class="{active_cgu}">CGU</a>
            <a href="cgv.html" class="{active_cgv}">CGV</a>
            <a href="politique_confidentialite.html" class="{active_conf}">Confidentialité</a>
            <a href="mentions_legales.html" class="{active_mentions}">Mentions Légales</a>
            <a href="politique_cookies.html" class="{active_cookies}">Cookies</a>
            <a href="/" class="nav-back">← Boutique</a>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-badge">{badge}</div>
        <h1>{heading}</h1>
        <p>{subheading}</p>
    </header>

    <div class="container">
        <main class="document-card">
            <div class="document-meta">
                <div class="meta-pill">📅 Dernière mise à jour : <span>Septembre 2026</span></div>
                <div class="meta-pill">🏢 Société : <span>ATTIC SA (JogaLook)</span></div>
                <button class="print-btn" onclick="window.print()">
                    🖨️ Imprimer ce document
                </button>
            </div>
            {content}
        </main>
    </div>

    <footer class="site-footer">
        <div class="site-footer-container">
            <div class="site-footer-col">
                <h4>JogaLook</h4>
                <p>Votre boutique en ligne de référence pour les maillots de football officiels, tenues sportives et personnalisation d\x27atelier haute définition au Sénégal et en Afrique.</p>
                <p>Édité par <strong>ATTIC SA</strong>.<br>RCCM : SN STL 2025 A 1556 | NINEA : 012216314</p>
            </div>
            <div class="site-footer-col">
                <h4>Documents Légaux</h4>
                <ul>
                    <li><a href="cgu.html">Conditions Générales d\x27Utilisation (CGU)</a></li>
                    <li><a href="cgv.html">Conditions Générales de Vente (CGV)</a></li>
                    <li><a href="politique_confidentialite.html">Politique de Confidentialité</a></li>
                    <li><a href="mentions_legales.html">Mentions Légales</a></li>
                    <li><a href="politique_cookies.html">Politique des Cookies</a></li>
                </ul>
            </div>
            <div class="site-footer-col">
                <h4>Service Client & Atelier</h4>
                <p>📧 Email : <a href="mailto:contact@jogalook.com">contact@jogalook.com</a></p>
                <p>📞 Assistance : <a href="tel:+221781941351">+221 78 194 13 51</a> / <a href="tel:+221710316939">+221 71 031 69 39</a></p>
                <p>📍 Dakar HLM-Bentaly, Dakar, Sénégal</p>
            </div>
        </div>
        <div class="site-footer-bottom">
            &copy; 2026 JogaLook — Tous droits réservés. Marque exploitée par ATTIC SA.
        </div>
    </footer>

</body>
</html>
"""

DOCS = {
    "cgu.html": {
        "title": "Conditions Générales d'Utilisation",
        "heading": "Conditions Générales d'Utilisation",
        "subheading": "Règles d'accès, d'utilisation du site jogalook.com et du studio de personnalisation de maillots.",
        "badge": "CADRE JURIDIQUE & PLATEFORME",
        "active": "cgu",
        "content": """
        <section class="article">
            <h2>Article 1 - Objet et Champ d'Application</h2>
            <p>Les présentes Conditions Générales d'Utilisation (ci-après désignées les <strong>« CGU »</strong>) ont pour objet d'encadrer l'accès, la consultation et l'utilisation de la plateforme de commerce électronique <strong>JogaLook</strong>, accessible à l'adresse <a href="https://jogalook.com">jogalook.com</a> (ci-après la <strong>« Plateforme »</strong>).</p>
            <p>La Plateforme est éditée et exploitée par la société <strong>ATTIC SA</strong>, société anonyme régie par les lois de la République du Sénégal et le droit commercial OHADA, immatriculée au Registre du Commerce et du Crédit Mobilier sous le numéro <strong>RCCM SN STL 2025 A 1556</strong>, titulaire du <strong>NINEA 012216314</strong>, dont le siège social est situé à Sanar, Saint-Louis, et disposant de son établissement d'exploitation et atelier technique à <strong>Dakar HLM-Bentaly, Sénégal</strong>.</p>
            <p>Toute navigation sur la Plateforme, toute création de compte ou utilisation de ses fonctionnalités (notamment l'atelier interactif de personnalisation vectorielle SVG) implique l'adhésion immédiate, expresse et sans réserve de l'Utilisateur aux présentes CGU.</p>
        </section>

        <section class="article">
            <h2>Article 2 - Définitions</h2>
            <ul>
                <li><strong>« Plateforme » ou « Site » :</strong> L'infrastructure numérique accessible à l'adresse jogalook.com, ses déclinaisons mobiles, applications web et services associés.</li>
                <li><strong>« JogaLook » :</strong> La marque commerciale, le service de vente en ligne et l'atelier de flocage exploités par la société ATTIC SA.</li>
                <li><strong>« Utilisateur » :</strong> Toute personne physique ou morale qui navigue sur la Plateforme ou utilise ses services.</li>
                <li><strong>« Client » :</strong> Tout Utilisateur qui passe une commande ferme de Produits ou de prestations de marquage sur la Plateforme.</li>
                <li><strong>« Compte Client » :</strong> Espace personnel sécurisé accessible par identifiant et authentification à facteur unique ou multiple (OTP).</li>
                <li><strong>« Atelier de Personnalisation / Customizer SVG » :</strong> Le module logiciel propriétaire interactif permettant au Client de concevoir et prévisualiser des flocages sur-mesure (nom, numéro, écussons, sponsors, polices, coloris).</li>
                <li><strong>« Produits » :</strong> L'ensemble des maillots officiels, tenues sportives de clubs et sélections, articles rétro, équipements et accessoires proposés au catalogue.</li>
                <li><strong>« Commande » :</strong> L'acte juridique par lequel le Client s'engage à acquérir des Produits ou services proposés par JogaLook.</li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 3 - Accès au Site et Éligibilité</h2>
            <p>L'accès à la Plateforme est libre et gratuit pour tout internaute disposant d'une connexion Internet. Les coûts liés à la connexion, aux forfaits data mobiles et aux équipements informatiques demeurent à la charge exclusive de l'Utilisateur.</p>
            <p>Pour créer un compte ou passer commande, l'Utilisateur doit être une personne physique âgée d'au moins dix-huit (18) ans ou disposer de la pleine capacité juridique selon la législation de son pays de résidence, ou agir sous la responsabilité et avec le consentement de ses représentants légaux.</p>
        </section>

        <section class="article">
            <h2>Article 4 - Création de Compte et Authentification Sécurisée (OTP)</h2>
            <p>La création d'un Compte Client est facultative pour la navigation mais vivement recommandée pour le suivi des commandes, la gestion des adresses de livraison favorites et la sauvegarde des maquettes de maillots créées dans l'Atelier.</p>
            <div class="highlight-box">
                <p><strong>Sécurité sans mot de passe vulnérable (OTP) :</strong> JogaLook intègre une procédure d'authentification moderne basée sur des codes à usage unique (<strong>OTP - One Time Password</strong>). Lors de chaque connexion ou inscription, un code à six (6) chiffres valide dix (10) minutes est transmis par email ou SMS.</p>
            </div>
            <p>L'Utilisateur est seul garant de la confidentialité de sa boîte email et de son téléphone mobile. Toute opération réalisée depuis un compte authentifié par son titulaire est réputée émaner de ce dernier.</p>
        </section>

        <section class="article">
            <h2>Article 5 - Règles d'Utilisation de l'Atelier de Personnalisation SVG</h2>
            <p>L'Atelier de Personnalisation permet de simuler fidèlement le rendu final d'un maillot floqué avant mise en production.</p>
            <p>En utilisant ce service, l'Utilisateur s'engage formellement à respecter les règles impératives suivantes :</p>
            <ul>
                <li><strong>Contenus interdits :</strong> Il est strictement défendu de saisir des noms, numéros, textes ou de téléverser des visuels injurieux, diffamatoires, obscènes, haineux, violents, racistes, contraires à l'ordre public ou aux bonnes mœurs.</li>
                <li><strong>Propriété intellectuelle tierce :</strong> L'Utilisateur garantit qu'il détient tous les droits, licences et autorisations nécessaires sur les logos, emblèmes ou insignes d'entreprises, de clubs ou d'associations qu'il demande de reproduire.</li>
                <li><strong>Droit de modération et de refus d'impression :</strong> JogaLook se réserve le droit d'annuler unilatéralement toute commande comportant un flocage illégal, attentatoire aux droits d'un tiers ou contraire à l'éthique sportive. Dans cette hypothèse, le Client sera immédiatement avisé et intégralement remboursé.</li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 6 - Propriété Intellectuelle</h2>
            <p>Tous les éléments du Site (marques, graphismes, gabarits vectoriels 2D/3D, visuels de maillots, photographies, textes descriptifs, code source logiciel et architecture de base de données) sont la propriété exclusive de <strong>ATTIC SA</strong> ou de ses partenaires et sont protégés par les lois sénégalaises, le droit de l'Organisation Africaine de la Propriété Intellectuelle (OAPI) et les traités internationaux.</p>
            <p>Toute extraction de données, aspiration de site (scraping), copie, reproduction ou diffusion non autorisée est passible de poursuites civiles et pénales.</p>
            <p>Les logos, noms de clubs, fédérations et équipementiers apparaissant sur les maillots officiels sont la propriété de leurs titulaires respectifs et ne sont cités que dans le cadre de la vente légitime des articles originaux correspondants.</p>
        </section>

        <section class="article">
            <h2>Article 7 - Comportements Prohibés et Mesures de Sécurité</h2>
            <p>L'Utilisateur s'interdit d'entraver le bon fonctionnement du Site, d'injecter des virus ou scripts malveillants, d'utiliser des robots d'achat, ou d'abuser du service de Paiement à la Livraison en passant des commandes fictives. Tout comportement abusif entraîne la clôture immédiate du compte et l'inscription sur notre registre de non-fiabilité.</p>
        </section>

        <section class="article">
            <h2>Article 8 - Disponibilité du Service</h2>
            <p>JogaLook s'efforce de maintenir la Plateforme opérationnelle en permanence. Cependant, des interruptions ponctuelles peuvent survenir pour maintenance, mises à jour ou en cas de défaillance des réseaux de communication externes, sans que la responsabilité de JogaLook ne puisse être engagée.</p>
        </section>

        <section class="article">
            <h2>Article 9 - Droit Applicable et Juridiction Compétente</h2>
            <p>Les présentes CGU sont soumises à la législation de la <strong>République du Sénégal</strong>. Tout litige relatif à leur validité, interprétation ou exécution sera soumis en priorité à une conciliation amiable. À défaut d'accord, compétence exclusive est accordée aux <strong>tribunaux compétents de Dakar</strong>.</p>
        </section>
        """
    },
    "cgv.html": {
        "title": "Conditions Générales de Vente",
        "heading": "Conditions Générales de Vente",
        "subheading": "Modalités d'achat, de paiement, de flocage sur-mesure, de livraison et de garantie sur JogaLook.",
        "badge": "COMMERCE & VENTE EN LIGNE",
        "active": "cgv",
        "content": """
        <section class="article">
            <h2>Article 1 - Dispositions Générales & Identification du Vendeur</h2>
            <p>Les présentes Conditions Générales de Vente (ci-après les <strong>« CGV »</strong>) régissent sans restriction l'ensemble des ventes de maillots, vêtements de sport, équipements et prestations de personnalisation par flocage conclues entre :</p>
            <p>D'une part, la société <strong>ATTIC SA</strong>, société anonyme immatriculée au RCCM de Saint-Louis sous le numéro <strong>SN STL 2025 A 1556</strong>, NINEA <strong>012216314</strong>, exploitant la marque commerciale <strong>JogaLook</strong>, dont le siège est à Sanar (Saint-Louis) et l'établissement opérationnel à <strong>Dakar HLM-Bentaly, Sénégal</strong>, joignable à <a href="mailto:contact@jogalook.com">contact@jogalook.com</a> et par téléphone au <a href="tel:+221781941351">+221 78 194 13 51</a> (ci-après désignée <strong>« JogaLook »</strong> ou le <strong>« Vendeur »</strong>) ;</p>
            <p>Et d'autre part, toute personne physique ou morale procédant à une commande via le site <a href="https://jogalook.com">jogalook.com</a> (ci-après désignée le <strong>« Client »</strong>).</p>
        </section>

        <section class="article">
            <h2>Article 2 - Produits et Disponibilité</h2>
            <p>Les Produits proposés à la vente sont ceux décrits et présentés sur le catalogue en ligne de JogaLook. Ils comprennent des maillots de football (éditions domicile, extérieur, third, rétro), des ensembles complets, des tenues pour clubs, écoles et revendeurs, ainsi que des prestations d'atelier (flocage officiel ou sur-mesure).</p>
            <p>Les photographies illustrant les Produits sont les plus fidèles possibles. Les offres de Produits et les prix sont valables tant qu'ils sont visibles sur le Site et dans la limite des stocks disponibles. En cas d'indisponibilité exceptionnelle d'un article après passation de commande, le Client en est informé sans délai et remboursé sous quarante-huit (48) heures.</p>
        </section>

        <section class="article">
            <h2>Article 3 - Prix et Devises</h2>
            <p>Les prix de vente des Produits sont indiqués en <strong>Francs CFA (XOF)</strong>, toutes taxes comprises (TTC), hors frais de livraison sauf mention expresse contraire.</p>
            <p>JogaLook se réserve le droit de modifier ses tarifs à tout moment. Toutefois, les Produits seront facturés sur la base des tarifs en vigueur et affichés au moment précis de l'enregistrement de la commande par le Client.</p>
            <p>Pour les commandes volumineuses émanant de clubs, écoles ou revendeurs, des tarifs dégressifs peuvent être convenus via un devis validé conjointement.</p>
        </section>

        <section class="article">
            <h2>Article 4 - Passation de Commande</h2>
            <p>Le processus de commande sur JogaLook comprend les étapes suivantes :</p>
            <ol>
                <li>Sélection du produit et choix de la taille (S, M, L, XL, XXL, etc.) et de la variante de couleur ;</li>
                <li>Option de personnalisation d'atelier : configuration du flocage (Face avant, Dos, Nom du joueur ou nom personnel, Numéro, Badges de compétition) avec prévisualisation dynamique ;</li>
                <li>Ajout au panier d'achat et vérification du récapitulatif détaillé ;</li>
                <li>Renseignement des coordonnées de livraison (adresse manuelle ou géolocalisation GPS pour Dakar) ;</li>
                <li>Choix du mode de règlement et validation ferme de la commande.</li>
            </ol>
            <p>La confirmation de commande fait l'objet d'un email automatique instantané expédié depuis <strong>JogaLook &lt;contact@jogalook.com&gt;</strong> récapitulant les détails de la commande et le numéro unique de suivi.</p>
        </section>

        <section class="article">
            <h2>Article 5 - Régime Spécifique des Produits Personnalisés (Flocage d'Atelier)</h2>
            <div class="highlight-box">
                <p><strong>⚠️ DÉROGATION LÉGALE AU DROIT DE RÉTRACTATION :</strong> Conformément aux règles régissant la vente à distance et les contrats de consommation portant sur des biens nettement personnalisés ou confectionnés selon les spécifications précises du consommateur, <strong>les maillots ayant fait l'objet d'un flocage personnalisé (nom, prénom, numéro spécifique ou badges sur-mesure) ne peuvent faire l'objet d'aucun droit de rétractation, annulation, échange ou remboursement une fois la production lancée</strong>, sauf vice caché, défaut avéré de fabrication ou non-conformité manifeste imputable à notre atelier.</p>
            </div>
            <p>Le Client est donc invité à vérifier scrupuleusement l'orthographe des noms, la justesse des numéros et le choix de la taille avant de valider son panier.</p>
        </section>

        <section class="article">
            <h2>Article 6 - Modalités de Paiement Sécurisé</h2>
            <p>JogaLook met à la disposition de ses Clients deux modes de règlement fiables et sécurisés :</p>

            <h3>6.1 Paiement Électronique en Ligne (Passerelle PayBammite)</h3>
            <p>Le Client peut régler sa commande immédiatement en ligne via la passerelle agréée <strong>PayBammite</strong> :</p>
            <ul>
                <li><strong>Mobile Money Sénégal & Afrique :</strong> Wave Sénégal, Orange Money, Free Money, Moov Money, MTN Mobile Money ;</li>
                <li><strong>Cartes Bancaires :</strong> Carte Bancaire Visa, Mastercard avec protocole d'authentification 3D-Secure.</li>
            </ul>
            <p>Les transactions sont protégées par un chiffrement SSL/TLS de niveau bancaire. Aucune coordonnée bancaire secrète n'est hébergée sur les serveurs de JogaLook.</p>

            <h3>6.2 Paiement à la Livraison (Cash on Delivery - COD)</h3>
            <p>Afin de faciliter l'achat pour les clients de Dakar et de sa banlieue, JogaLook propose le paiement au comptant lors de la remise physique du colis par le livreur.</p>
            <div class="highlight-box">
                <p><strong>Conditions d'éligibilité au COD :</strong> Le paiement à la livraison est encadré par notre système de fiabilité client (table <code>user_reliability</code>). Il est limité aux commandes comprises entre <strong>5 000 FCFA</strong> et <strong>100 000 FCFA</strong>. En cas de refus abusif ou d'absence injustifiée lors de la livraison, le Client perdra définitivement le bénéfice de ce mode de paiement pour ses commandes futures.</p>
            </div>
        </section>

        <section class="article">
            <h2>Article 7 - Livraison, Délais et Modalités de Réception</h2>
            <p>JogaLook livre ses Produits sur l'ensemble du territoire sénégalais et dans la sous-région ouest-africaine :</p>
            <table class="info-table">
                <thead>
                    <tr>
                        <th>Destination</th>
                        <th>Délai indicatif</th>
                        <th>Modalité de livraison</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Dakar & Banlieue</strong></td>
                        <td>24h à 48h ouvrées</td>
                        <td>Coursier express à domicile ou géolocalisation GPS</td>
                    </tr>
                    <tr>
                        <td><strong>Régions du Sénégal</strong></td>
                        <td>48h à 72h ouvrées</td>
                        <td>Transporteur partenaire ou point relais (Thiès, St-Louis, etc.)</td>
                    </tr>
                    <tr>
                        <td><strong>Sous-région & International</strong></td>
                        <td>5 à 10 jours ouvrés</td>
                        <td>Colis express international sécurisé</td>
                    </tr>
                </tbody>
            </table>
            <p>Le Client est tenu de vérifier l'état du colis et des Produits devant le livreur ou lors du retrait. En cas de colis endommagé ou d'article manquant, des réserves motivées doivent être formulées immédiatement auprès du coursier et transmises sous 24h au service client de JogaLook.</p>
        </section>

        <section class="article">
            <h2>Article 8 - Droit de Rétractation et Retours (Produits Standards Vierges)</h2>
            <p>Pour les Produits standards <strong>non personnalisés</strong> (maillots vierges sans flocage de nom ni numéro), le Client dispose d'un délai de sept (7) jours calendaires à compter de la réception pour exercer son droit de rétractation sans motif.</p>
            <p>Les Produits doivent être impérativement retournés dans leur état d'origine, neufs, jamais portés, non lavés, munis de toutes leurs étiquettes d'origine intactes et dans leur sachet d'emballage d'origine. Les frais de réexpédition sont à la charge du Client, sauf erreur imputable à JogaLook.</p>
        </section>

        <section class="article">
            <h2>Article 9 - Garanties Légales et Conseils d'Entretien</h2>
            <p>Tous les Produits fournis par JogaLook bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés. Sont exclus de cette garantie les détériorations consécutives à une usure normale, à un mauvais entretien ou au non-respect des consignes de lavage.</p>
            <div class="highlight-box">
                <p><strong>Guide d'entretien d'expert pour maillots floqués :</strong></p>
                <ul>
                    <li>Laver toujours le maillot sur l'envers afin de protéger les flocages et badges ;</li>
                    <li>Laver à l'eau froide ou à 30°C maximum (programme délicat) ;</li>
                    <li>Proscrire formellement l'utilisation du sèche-linge et de l'adoucissant ;</li>
                    <li>Repassage formellement interdit directement sur les flocages (repasser à l'envers à température minimale avec un tissu de protection).</li>
                </ul>
            </div>
        </section>

        <section class="article">
            <h2>Article 10 - Service Client & Litiges</h2>
            <p>Pour toute question relative à votre commande, un retour ou une réclamation, notre service client est à votre écoute :</p>
            <p>📧 Email : <a href="mailto:contact@jogalook.com">contact@jogalook.com</a><br>
            📞 Téléphone & WhatsApp : <a href="tel:+221781941351">+221 78 194 13 51</a> / <a href="tel:+221710316939">+221 71 031 69 39</a><br>
            📍 Adresse : Atelier JogaLook, Dakar HLM-Bentaly, Sénégal.</p>
            <p>En cas de litige, les parties s'engagent à rechercher une conciliation amiable. À défaut, le différend sera tranché conformément au droit sénégalais par le <strong>Tribunal de Commerce de Dakar</strong>.</p>
        </section>
        """
    },
    "politique_confidentialite.html": {
        "title": "Politique de Confidentialité & Protection des Données",
        "heading": "Politique de Confidentialité",
        "subheading": "Protection de vos données personnelles, respect de la vie privée et conformité avec la loi sénégalaise n° 2008-12.",
        "badge": "DONNÉES PERSONNELLES & VIE PRIVÉE",
        "active": "conf",
        "content": """
        <section class="article">
            <h2>Article 1 - Engagement de Confidentialité et Responsable du Traitement</h2>
            <p>La protection de vos données personnelles est une priorité absolue pour <strong>JogaLook</strong>. La présente Politique de Confidentialité a pour vocation de vous informer en toute transparence sur la manière dont vos données sont collectées, utilisées et protégées lorsque vous utilisez notre site <a href="https://jogalook.com">jogalook.com</a>.</p>
            <p>Le responsable du traitement des données à caractère personnel est la société <strong>ATTIC SA</strong>, immatriculée au RCCM sous le numéro <strong>SN STL 2025 A 1556</strong>, NINEA <strong>012216314</strong>, dont le siège social est sis à Sanar, Saint-Louis, et exploitant l'enseigne JogaLook à Dakar HLM-Bentaly, Sénégal.</p>
            <p>Le traitement des données à caractère personnel mis en œuvre sur la Plateforme est conforme aux dispositions de la <strong>loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> relative à la protection des données à caractère personnel, sous le contrôle de la <strong>Commission de Protection des Données Personnelles du Sénégal (CDP)</strong>.</p>
        </section>

        <section class="article">
            <h2>Article 2 - Données à Caractère Personnel Collectées</h2>
            <p>JogaLook ne collecte que les données strictement adéquates, pertinentes et nécessaires aux finalités poursuivies :</p>
            <ul>
                <li><strong>Données d'identification :</strong> Nom, prénom, civilité ;</li>
                <li><strong>Données de contact :</strong> Adresse de courrier électronique, numéros de téléphone (utilisés pour la notification SMS de livraison et les codes OTP de vérification) ;</li>
                <li><strong>Données de livraison :</strong> Adresse postale de livraison, ville, quartier, repères géographiques et, le cas échéant, coordonnées GPS transmises volontairement par le Client pour une livraison rapide à Dakar ;</li>
                <li><strong>Données relatives aux commandes et à l'atelier :</strong> Historique des achats, modèles choisis, textes et numéros personnalisés saisis pour le flocage d'atelier, récapitulatifs de facturation ;</li>
                <li><strong>Données de paiement :</strong> Mode de règlement sélectionné (Wave, Orange Money, Carte, COD). <em>JogaLook ne conserve aucun numéro de carte bancaire ni code secret Mobile Money : les transactions sont intégralement déléguées à l'établissement de paiement agréé PayBammite ;</em></li>
                <li><strong>Données techniques de connexion :</strong> Adresses IP, logs de connexion, horodatage, agent utilisateur, dans le respect des règles de sécurité et de détection des fraudes.</li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 3 - Finalités et Bases Légales du Traitement</h2>
            <p>Vos données font l'objet d'un traitement pour les finalités suivantes :</p>
            <table class="info-table">
                <thead>
                    <tr>
                        <th>Finalité du traitement</th>
                        <th>Base légale (Loi 2008-12)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Gestion, exécution et livraison de votre commande de maillots</td>
                        <td>Exécution du contrat de vente</td>
                    </tr>
                    <tr>
                        <td>Création et fabrication des marquages dans l'atelier SVG</td>
                        <td>Exécution du contrat de vente</td>
                    </tr>
                    <tr>
                        <td>Authentification sécurisée sans mot de passe par code OTP</td>
                        <td>Intérêt légitime et sécurité du compte</td>
                    </tr>
                    <tr>
                        <td>Calcul de l'éligibilité au Paiement à la Livraison (COD) et lutte anti-fraude</td>
                        <td>Intérêt légitime de protection contre les abus</td>
                    </tr>
                    <tr>
                        <td>Émission des factures et tenue des registres comptables</td>
                        <td>Obligation légale sénégalaise</td>
                    </tr>
                    <tr>
                        <td>Réponse à vos demandes de devis (clubs, écoles, revendeurs) via le formulaire de contact</td>
                        <td>Consentement de l'utilisateur</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="article">
            <h2>Article 4 - Destinataires et Sous-traitants des Données</h2>
            <p>Les données collectées sont destinées aux services habilités de JogaLook (service client, atelier de flocage, logistique). Elles peuvent être transmises de façon strictement sécurisée aux prestataires suivants :</p>
            <ul>
                <li><strong>Nos livreurs et coursiers partenaires :</strong> uniquement les nom, téléphone et adresse/GPS nécessaires à la remise du colis ;</li>
                <li><strong>La passerelle de paiement PayBammite :</strong> pour l'encaissement sécurisé des transactions ;</li>
                <li><strong>Notre routeur de messagerie transactionnelle (Resend) :</strong> pour l'envoi des codes de connexion OTP et confirmations de commande depuis <code>contact@jogalook.com</code> ;</li>
                <li><strong>Nos hébergeurs d'infrastructure cloud :</strong> Vercel Inc. et Supabase Inc. (serveurs sécurisés avec chiffrement des données au repos et en transit).</li>
            </ul>
            <div class="highlight-box">
                <p><strong>Engagement ferme JogaLook :</strong> Vos données personnelles ne sont <strong>JAMAIS vendues, louées ou cédées</strong> à des tiers à des fins publicitaires ou de prospection commerciale.</p>
            </div>
        </section>

        <section class="article">
            <h2>Article 5 - Durée de Conservation des Données</h2>
            <p>Vos données sont conservées pendant une durée strictement nécessaire aux finalités pour lesquelles elles sont collectées :</p>
            <ul>
                <li><strong>Données du Compte Client actif :</strong> pendant toute la durée d'utilisation du compte, puis archivées pendant trois (3) ans après la dernière activité enregistrée ;</li>
                <li><strong>Données de commande et facturation :</strong> dix (10) ans conformément aux obligations du Code de commerce et du Code général des impôts sénégalais ;</li>
                <li><strong>Codes OTP de vérification :</strong> supprimés ou invalidés automatiquement dix (10) minutes après leur émission ;</li>
                <li><strong>Logs de connexion et sécurité :</strong> conservés pour une durée maximale de douze (12) mois.</li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 6 - Sécurité des Données</h2>
            <p>JogaLook applique les meilleures pratiques de sécurité de l'industrie pour protéger vos informations :</p>
            <ul>
                <li>Chiffrement systématique de toutes les communications via le protocole HTTPS / TLS ;</li>
                <li>Hachage cryptographique irréversible des données sensibles (bcrypt) ;</li>
                <li>Politiques de sécurité au niveau des lignes de base de données (Row Level Security - RLS) ;</li>
                <li>Accès aux données réservé aux seuls personnels habilités tenus à une obligation de stricte confidentialité.</li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 7 - Vos Droits sur Vos Données Personnelles</h2>
            <p>Conformément à la loi n° 2008-12 du 25 janvier 2008, vous disposez des droits suivants concernant vos données à caractère personnel :</p>
            <ul>
                <li><strong>Droit d'accès :</strong> vous pouvez obtenir la confirmation que des données vous concernant sont traitées et en recevoir copie ;</li>
                <li><strong>Droit de rectification :</strong> vous pouvez exiger que soient rectifiées ou complétées des informations inexactes ou périmées ;</li>
                <li><strong>Droit à l'effacement (« droit à l'oubli ») :</strong> vous pouvez solliciter la suppression de vos données, sous réserve des délais légaux de conservation comptable ;</li>
                <li><strong>Droit d'opposition :</strong> vous pouvez vous opposer au traitement de vos données pour des motifs légitimes.</li>
            </ul>
            <p>Pour exercer l'un quelconque de ces droits, il vous suffit d'adresser une demande écrite par email à notre Délégué à la Protection des Données : <a href="mailto:contact@jogalook.com">contact@jogalook.com</a>, accompagnée d'un justificatif d'identité si nécessaire.</p>
            <p>En cas de contestation non résolue, vous avez le droit de saisir la <strong>Commission de Protection des Données Personnelles du Sénégal (CDP)</strong> : <a href="https://www.cdp.sn" target="_blank" rel="noopener">www.cdp.sn</a>.</p>
        </section>
        """
    },
    "mentions_legales.html": {
        "title": "Mentions Légales",
        "heading": "Mentions Légales",
        "subheading": "Informations légales relatives à l'éditeur, aux directeurs de la publication et aux hébergeurs de JogaLook.",
        "badge": "INFORMATIONS JURIDIQUES & ÉDITEUR",
        "active": "mentions",
        "content": """
        <section class="article">
            <h2>Article 1 - Éditeur du Site</h2>
            <p>Le site internet <a href="https://jogalook.com">jogalook.com</a> est la propriété exclusive de la société <strong>ATTIC SA</strong>, qui en assure l'édition et l'exploitation commerciale.</p>
            <table class="info-table">
                <tbody>
                    <tr>
                        <th>Dénomination sociale</th>
                        <td><strong>ATTIC SA</strong> (Société Anonyme de droit sénégalais)</td>
                    </tr>
                    <tr>
                        <th>Nom commercial</th>
                        <td><strong>JogaLook</strong></td>
                    </tr>
                    <tr>
                        <th>Numéro RCCM</th>
                        <td><strong>SN STL 2025 A 1556</strong> (Tribunal de Commerce)</td>
                    </tr>
                    <tr>
                        <th>Numéro NINEA</th>
                        <td><strong>012216314</strong></td>
                    </tr>
                    <tr>
                        <th>Siège social</th>
                        <td>Sanar, Saint-Louis, République du Sénégal</td>
                    </tr>
                    <tr>
                        <th>Établissement & Atelier</th>
                        <td>Dakar HLM-Bentaly / HLM Grand Yoff, Dakar, Sénégal</td>
                    </tr>
                    <tr>
                        <th>Courriel de contact</th>
                        <td><a href="mailto:contact@jogalook.com">contact@jogalook.com</a></td>
                    </tr>
                    <tr>
                        <th>Téléphones officiels</th>
                        <td><a href="tel:+221781941351">+221 78 194 13 51</a> / <a href="tel:+221710316939">+221 71 031 69 39</a></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="article">
            <h2>Article 2 - Direction de la Publication</h2>
            <p>Le Directeur de la publication du site JogaLook est :</p>
            <p><strong>Monsieur YENHAMME BAMMITE Yembouam Prince</strong>, agissant en qualité de Directeur Général de la société ATTIC SA.<br>Contact : <a href="mailto:princebammite@gmail.com">princebammite@gmail.com</a></p>
        </section>

        <section class="article">
            <h2>Article 3 - Hébergement et Infrastructure Technique</h2>
            <p>L'infrastructure technique de JogaLook est hébergée auprès d'opérateurs de rang mondial garantissant une haute disponibilité et un niveau de sécurité optimal :</p>
            <ul>
                <li><strong>Hébergement de l'application web & Frontend :</strong><br>
                <strong>Vercel Inc.</strong><br>
                Adresse : 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br>
                Site web : <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></li>
                
                <li><strong>Hébergement de la Base de Données & Stockage médias :</strong><br>
                <strong>Supabase Inc.</strong> (Infrastructure Cloud AWS)<br>
                Adresse : 970 Toa Payoh North #07-04, Singapour<br>
                Site web : <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a></li>

                <li><strong>Routage des Emails Transactionnels & OTP :</strong><br>
                <strong>Resend Inc.</strong><br>
                Adresse : 2261 Market Street #5039, San Francisco, CA 94114, États-Unis<br>
                Site web : <a href="https://resend.com" target="_blank" rel="noopener">resend.com</a></li>
            </ul>
        </section>

        <section class="article">
            <h2>Article 4 - Propriété Intellectuelle</h2>
            <p>L'ensemble des contenus présents sur le site JogaLook (textes, logos, photographies, vidéos, icônes, gabarits graphiques, maquettes d'atelier, charte visuelle, scripts logiciels) relève de la législation sénégalaise et internationale sur le droit d'auteur et la propriété intellectuelle.</p>
            <p>Toute reproduction, copie, distribution ou exploitation sans l'accord préalable et écrit d'ATTIC SA est formellement interdite et constitue un délit de contrefaçon.</p>
        </section>

        <section class="article">
            <h2>Article 5 - Marques et Emblèmes Tiers</h2>
            <p>Les marques de clubs sportifs, fédérations et équipementiers présentées dans le catalogue JogaLook sont des marques déposées appartenant à leurs propriétaires légitimes. Leur présence sur le Site n'a d'autre fin que la description et la présentation exacte des articles authentiques distribués.</p>
        </section>

        <section class="article">
            <h2>Article 6 - Droit Applicable</h2>
            <p>Le présent site internet et ses mentions légales sont régis par le droit de la <strong>République du Sénégal</strong>. Tout litige relatif à sa validité ou à son utilisation relève de la compétence exclusive des juridictions du ressort de la <strong>Cour d'Appel de Dakar</strong>.</p>
        </section>
        """
    },
    "politique_cookies.html": {
        "title": "Politique des Cookies & Traceurs",
        "heading": "Politique des Cookies",
        "subheading": "Explication sur l'utilisation des cookies et du stockage local pour assurer le bon fonctionnement de JogaLook.",
        "badge": "TRACEURS & GESTION DU CONSENTEMENT",
        "active": "cookies",
        "content": """
        <section class="article">
            <h2>Article 1 - Qu'est-ce qu'un Cookie ou un Traceur ?</h2>
            <p>Un <strong>cookie</strong> est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone ou tablette) par le biais de votre navigateur web lors de la visite d'un site internet. Il permet au site de mémoriser temporairement des informations sur votre visite, telles que vos préférences de navigation ou le contenu de votre panier d'achat.</p>
            <p>Sur JogaLook, nous utilisons également les mécanismes modernes de stockage local sécurisé (<strong>HTML5 LocalStorage</strong> et <strong>SessionStorage</strong>) pour optimiser les temps de chargement et garantir la fluidité de votre expérience d'achat.</p>
        </section>

        <section class="article">
            <h2>Article 2 - Les Types de Traceurs Utilisés sur JogaLook</h2>
            <p>Nous classons les traceurs utilisés sur notre Plateforme en plusieurs catégories :</p>

            <h3>2.1 Traceurs Strictement Nécessaires (Fonctionnels)</h3>
            <p>Ces traceurs sont indispensables au fonctionnement technique de la boutique en ligne. Sans eux, vous ne pourriez pas utiliser les services de base :</p>
            <table class="info-table">
                <thead>
                    <tr>
                        <th>Nom du traceur</th>
                        <th>Finalité</th>
                        <th>Durée de conservation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>jogalook_cart</code> (LocalStorage)</td>
                        <td>Maintient les maillots et flocages ajoutés à votre panier pendant votre session de navigation</td>
                        <td>30 jours ou jusqu'à vidage du panier</td>
                    </tr>
                    <tr>
                        <td><code>jogalook_token</code> (SessionStorage / Cookie sécurisé)</td>
                        <td>Gère votre session de connexion sécurisée (authentification JWT)</td>
                        <td>Durée de la session ou 7 jours si mémorisé</td>
                    </tr>
                    <tr>
                        <td><code>jogalook_user</code> (LocalStorage)</td>
                        <td>Retient les informations de profil public pour l'affichage de la barre de navigation</td>
                        <td>Durée de la session active</td>
                    </tr>
                </tbody>
            </table>

            <h3>2.2 Traceurs de Personnalisation d'Atelier SVG</h3>
            <p>Ces éléments permettent de sauvegarder en temps réel vos créations de flocages (nom du joueur, numéro sélectionné, couleurs choisies, écussons) au fur et à mesure que vous les modifiez dans le studio, afin de ne pas perdre votre travail en cas de rafraîchissement inopiné de la page.</p>

            <h3>2.3 Traceurs de Sécurité et Prévention de la Fraude</h3>
            <p>Ils permettent de détecter les requêtes répétitives malveillantes, de limiter les abus sur l'envoi de codes SMS/OTP et d'assurer l'intégrité de la plateforme.</p>
        </section>

        <section class="article">
            <h2>Article 3 - Consentement et Paramétrage de vos Cookies</h2>
            <p>Les traceurs strictement nécessaires au fonctionnement du site et à la fourniture d'un service expressément demandé par l'Utilisateur (panier d'achat, connexion) ne nécessitent pas de consentement préalable conformément aux recommandations de la CDP et aux standards internationaux.</p>
            <p>Vous pouvez toutefois configurer à tout moment votre navigateur pour bloquer les cookies ou être alerté lors de leur dépôt :</p>
            <ul>
                <li><strong>Google Chrome :</strong> Paramètres > Confidentialité et sécurité > Cookies et autres données des sites ;</li>
                <li><strong>Safari (Apple) :</strong> Réglages > Safari > Avancé > Bloquer tous les cookies ;</li>
                <li><strong>Mozilla Firefox :</strong> Options > Vie privée et sécurité > Cookies et données de sites ;</li>
                <li><strong>Microsoft Edge :</strong> Paramètres > Confidentialité, recherche et services > Cookies.</li>
            </ul>
            <p><em>Attention : La désactivation complète des cookies et du stockage local peut altérer l'affichage du site et empêcher l'ajout de maillots au panier ou l'utilisation de l'Atelier de flocage.</em></p>
        </section>

        <section class="article">
            <h2>Article 4 - Contact</h2>
            <p>Pour toute interrogation relative à notre politique en matière de cookies et de traceurs, vous pouvez contacter notre équipe à : <a href="mailto:contact@jogalook.com">contact@jogalook.com</a>.</p>
        </section>
        """
    }
}

os.makedirs("legal", exist_ok=True)

for filename, doc in DOCS.items():
    active_cgu = "active" if doc["active"] == "cgu" else ""
    active_cgv = "active" if doc["active"] == "cgv" else ""
    active_conf = "active" if doc["active"] == "conf" else ""
    active_mentions = "active" if doc["active"] == "mentions" else ""
    active_cookies = "active" if doc["active"] == "cookies" else ""

    html = TEMPLATE.format(
        title=doc["title"],
        heading=doc["heading"],
        subheading=doc["subheading"],
        badge=doc["badge"],
        active_cgu=active_cgu,
        active_cgv=active_cgv,
        active_conf=active_conf,
        active_mentions=active_mentions,
        active_cookies=active_cookies,
        content=doc["content"]
    )

    path = os.path.join("legal", filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated {path} ({len(html)} chars)")

# Also update ccg.html to be a clone or alias of cgv.html so old links still work
with open(os.path.join("legal", "cgv.html"), "r", encoding="utf-8") as f:
    cgv_content = f.read()
with open(os.path.join("legal", "ccg.html"), "w", encoding="utf-8") as f:
    f.write(cgv_content)
print("Updated legal/ccg.html as alias of cgv.html")

