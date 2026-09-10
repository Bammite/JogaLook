"""
Module de web scraping pour Decathlon Sénégal (https://www.decathlon.sn/).
Utilise BeautifulSoup4 pour analyser et extraire les informations des produits.
"""

import sys
import json
import logging
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("DecathlonScraper")

CATEGORIES = {
    "football": "https://www.decathlon.sn/1734-football",
    "running": "https://www.decathlon.sn/3081-course-a-pied",
    "chaussures-homme": "https://www.decathlon.sn/3109-chaussures-homme",
    "chaussures-femme": "https://www.decathlon.sn/3110-chaussures-femme",
    "fitness": "https://www.decathlon.sn/3067-accessoires-fitness-pilates",
    "natation": "https://www.decathlon.sn/3279-natation",
    "randonnee": "https://www.decathlon.sn/1484-randonnee"
}

DEFAULT_HEADERS = {
    "User-Agent": "curl/8.7.1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}


class DecathlonScraper:
    """Scraper pour extraire des articles depuis Decathlon Sénégal."""

    def __init__(self, headers: Optional[Dict[str, str]] = None, timeout: int = 15):
        self.headers = headers or DEFAULT_HEADERS
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def fetch_html(self, url: str) -> Optional[str]:
        """Récupère le contenu HTML d'une URL donnée."""
        try:
            logger.info(f"Requête vers: {url}")
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur lors de la requête HTTP ({url}): {e}")
            return None

    def scrape_category(self, url_or_category: str, limit: int = 5, fetch_details: bool = False) -> List[Dict[str, Any]]:
        """
        Récupère une liste d'articles depuis une catégorie Decathlon.
        
        :param url_or_category: Nom de catégorie connue ou URL complète.
        :param limit: Nombre maximum d'articles à récupérer.
        :param fetch_details: Si True, visite la page de chaque article pour extraire description/composition.
        :return: Liste de dictionnaires contenant les données des produits.
        """
        target_url = CATEGORIES.get(url_or_category.lower(), url_or_category)
        html_content = self.fetch_html(target_url)

        if not html_content:
            logger.error("Impossible de récupérer la page cible.")
            return []

        # Utilisation de BeautifulSoup pour parser le HTML
        soup = BeautifulSoup(html_content, "html.parser")
        # Sélectionne précisément chaque élément de liste de produit
        product_cards = soup.select("li.js-product-card")
        if not product_cards:
            product_cards = soup.select(".product-card")

        logger.info(f"{len(product_cards)} articles trouvés sur la page. Limite fixée à: {limit}")

        products: List[Dict[str, Any]] = []

        for card in product_cards[:limit]:
            product = self._parse_product_card(card)
            if product:
                if fetch_details and product.get("url"):
                    details = self.scrape_product_details(product["url"])
                    product.update(details)
                products.append(product)

        return products

    def _parse_product_card(self, card: BeautifulSoup) -> Dict[str, Any]:
        """Extrait les champs d'une carte produit HTML via BeautifulSoup."""
        # Titre du produit
        title_tag = card.select_one("h2") or card.select_one(".product-card_header a")
        name = title_tag.get_text(strip=True) if title_tag else "Non spécifié"

        # Marque
        brand_tag = card.select_one('[data-testid="product-card-brand"]')
        brand = brand_tag.get_text(strip=True) if brand_tag else None

        # Lien produit
        link_tag = card.select_one("a.js-product-card-link")
        url = link_tag.get("href") if link_tag else None

        # Image principale
        img_tag = card.select_one(".product-card_image img")
        image_url = img_tag.get("src") if img_tag else None

        # Prix
        price_tag = card.select_one('[data-testid="current-price"]')
        price_raw = price_tag.get("data-value") if price_tag else None
        price_text = price_tag.get_text(strip=True) if price_tag else None

        price_cfa = None
        if price_raw and price_raw.isdigit():
            price_cfa = int(price_raw)

        # Note / Rating
        rating_tag = card.select_one('[data-testid="rating-value"]')
        rating_val = None
        if rating_tag:
            try:
                rating_val = float(rating_tag.get_text(strip=True))
            except ValueError:
                pass

        # Nombre d'avis
        reviews_tag = card.select_one('[data-testid="rating-count"]')
        reviews_count = None
        if reviews_tag:
            count_str = reviews_tag.get_text(strip=True).strip("()")
            if count_str.isdigit():
                reviews_count = int(count_str)

        # Badge promotionnel / nouveauté
        badge_tag = card.select_one('[data-testid="product-card-sticker"]')
        badge = badge_tag.get_text(strip=True) if badge_tag else None

        # SKU
        sku_el = card.select_one("[data-sku]") or card
        sku = sku_el.get("data-sku") if sku_el else None

        return {
            "sku": sku,
            "name": name,
            "brand": brand,
            "price_cfa": price_cfa,
            "price_formatted": price_text,
            "rating": rating_val,
            "reviews_count": reviews_count,
            "badge": badge,
            "image_url": image_url,
            "url": url
        }

    def scrape_product_details(self, product_url: str) -> Dict[str, Any]:
        """
        Récupère les informations complémentaires sur la page détaillée d'un produit.
        """
        logger.info(f"Extraction des détails du produit: {product_url}")
        html = self.fetch_html(product_url)
        if not html:
            return {}

        soup = BeautifulSoup(html, "html.parser")
        details: Dict[str, Any] = {
            "description": None,
            "benefits": [],
            "composition": None
        }

        # Récupération des paragraphes descriptifs principaux
        for p in soup.find_all("p"):
            p_classes = p.get("class") or []
            if any("service-card" in c for c in p_classes):
                continue
            text = p.get_text(strip=True)
            if len(text) > 40 and not any(kw in text.lower() for kw in ["tous les prix", "livraison", "garantie", "lavage", "sécher"]):
                if any(text.lower().startswith(prefix) for prefix in ["notre ", "nous ", "vous ", "ce ", "cette ", "ces ", "idéal", "conçu"]):
                    details["description"] = text
                    break

        # Avantages produits (benefits)
        benefit_elements = soup.select(".product-benefit_wrapper")
        for ben in benefit_elements:
            ben_text = ben.get_text(separator=" : ", strip=True)
            if ben_text:
                details["benefits"].append(ben_text)

        # Composition / matière
        for p in soup.find_all("p"):
            p_text = p.get_text(strip=True)
            if "extérieur en:" in p_text.lower() or "tissu principal:" in p_text.lower() or "semelle en:" in p_text.lower():
                details["composition"] = p_text
                break

        return details
