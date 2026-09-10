# 🛒 Decathlon SN Web Scraper (Python)

Application autonome de web scraping pour extraire des articles depuis le site e-commerce [Decathlon Sénégal](https://www.decathlon.sn/).

Ce script est **totalement isolé** du serveur web Node.js principal de JogaLook. Il est écrit en Python et utilise **BeautifulSoup4** pour analyser et formater les données de façon propre et structurée.

---

## 📁 Structure du dossier

```text
webScraping/
├── .venv/                   # Environnement virtuel Python autonome
├── scraper.py               # Classe DecathlonScraper & logique d'extraction BeautifulSoup
├── main.py                  # Point d'entrée CLI avec options et affichage lisible
├── requirements.txt         # Dépendances (beautifulsoup4, requests)
├── produits_extraits.json   # Export JSON des données récupérées
└── README.md                # Documentation
```

---

## ⚡ Installation & Prérequis

Un environnement virtuel `.venv` a déjà été créé avec les dépendances installées. Si vous devez le réinstaller :

```bash
# Se placer dans le dossier
cd /Users/mac/Downloads/Drive/dev/web/NodeJS/JogaLook/webScraping

# Créer l'environnement virtuel (si pas déjà fait)
python3 -m venv .venv

# Installer les dépendances
.venv/bin/pip install -r requirements.txt
```

---

## 🚀 Utilisation

### 1. Test rapide (5 articles par défaut)
```bash
.venv/bin/python main.py
```

### 2. Limiter le nombre d'articles
```bash
.venv/bin/python main.py --limit 3
```

### 3. Changer de catégorie
Catégories préconfigurées : `football`, `running`, `chaussures-homme`, `chaussures-femme`, `fitness`, `natation`, `randonnee`.
```bash
.venv/bin/python main.py --category running --limit 5
```

Vous pouvez aussi spécifier n'importe quelle URL de catégorie complète :
```bash
.venv/bin/python main.py --category "https://www.decathlon.sn/3002-tennis" --limit 5
```

### 4. Extraire les détails complets (description, composition, avantages)
L'option `--details` (ou `-d`) visite également la page individuelle de chaque article pour extraire la composition et les points forts :
```bash
.venv/bin/python main.py --category football --limit 3 --details
```

### 5. Exporter les données vers un fichier JSON spécifique
```bash
.venv/bin/python main.py --limit 10 --output catalogue_football.json
```

---

## 📊 Données extraites par article

Chaque article collecté contient :
- **sku** : Identifiant unique de l'article chez Decathlon
- **name** : Nom complet du produit
- **brand** : Marque (ex: *KIPSTA*, *DOMYOS*, *DECATHLON*)
- **price_cfa** : Montant numérique en CFA (ex: `13000`)
- **price_formatted** : Prix formaté avec devise (ex: `13 000 CFA`)
- **rating** : Note moyenne sur 5 (ex: `4.4`)
- **reviews_count** : Nombre d'avis clients
- **badge** : Étiquette promotionnelle (ex: *PRIX EN BAISSE*, *Nouveauté*)
- **image_url** : URL haute résolution de l'image du produit
- **url** : Lien direct vers la fiche produit
- *(Optionnel avec `--details`)* :
  - **description** : Texte de présentation du produit
  - **composition** : Matières et composition (ex: *Extérieur 100% PU, Semelle 100% TPU*)
  - **benefits** : Liste des points forts / avantages techniques
