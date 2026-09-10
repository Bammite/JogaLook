#!/usr/bin/env python3
"""
Script principal d'exécution du scraper Decathlon Sénégal.
Permet de tester la collecte d'un nombre limité de produits,
d'afficher les données proprement et de les exporter en JSON.
"""

import argparse
import json
import os
import sys
from scraper import DecathlonScraper, CATEGORIES


def display_product_summary(product: dict, index: int):
    """Affiche un produit de manière lisible et structurée dans la console."""
    print("=" * 65)
    print(f"📦 Article #{index} : {product.get('name')}")
    print("=" * 65)
    print(f"  • Marque      : {product.get('brand') or 'N/A'}")
    print(f"  • Prix        : {product.get('price_formatted') or (str(product.get('price_cfa')) + ' CFA')}")
    
    rating = product.get('rating')
    reviews = product.get('reviews_count')
    if rating:
        stars = "★" * int(round(rating)) + "☆" * (5 - int(round(rating)))
        print(f"  • Note Avis   : {stars} {rating}/5 ({reviews or 0} avis)")
    else:
        print("  • Note Avis   : Aucun avis")

    if product.get('badge'):
        print(f"  • Badge       : 🏷️  {product.get('badge')}")

    print(f"  • SKU         : {product.get('sku') or 'N/A'}")
    print(f"  • Image       : {product.get('image_url') or 'N/A'}")
    print(f"  • Lien Direct : {product.get('url') or 'N/A'}")

    if product.get('description'):
        print(f"  • Description : {product.get('description')}")
    if product.get('composition'):
        print(f"  • Composition : {product.get('composition')}")
    if product.get('benefits'):
        print("  • Points Forts:")
        for benefit in product.get('benefits', []):
            print(f"      - {benefit}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Scraper de démonstration pour Decathlon Sénégal (app isolée en Python)"
    )
    parser.add_argument(
        "--category",
        "-c",
        default="football",
        help=f"Catégorie ou URL complète. Choix préconfigurés: {list(CATEGORIES.keys())} (défaut: football)",
    )
    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=5,
        help="Nombre maximum d'articles à récupérer (défaut: 5)",
    )
    parser.add_argument(
        "--details",
        "-d",
        action="store_true",
        help="Récupérer également la description et composition détaillées depuis la page produit",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="produits_extraits.json",
        help="Nom du fichier JSON où sauvegarder les données (défaut: produits_extraits.json)",
    )

    args = parser.parse_args()

    print("\n" + "#" * 65)
    print("🚀 LANCEMENT DU SCRAPER DECATHLON SÉNÉGAL")
    print(f"   Catégorie / Cible : {args.category}")
    print(f"   Limite d'articles : {args.limit}")
    print(f"   Détails étendus   : {'Oui' if args.details else 'Non'}")
    print("#" * 65 + "\n")

    scraper = DecathlonScraper()
    articles = scraper.scrape_category(
        url_or_category=args.category,
        limit=args.limit,
        fetch_details=args.details
    )

    if not articles:
        print("⚠️ Aucun article n'a pu être extrait. Vérifiez l'URL ou la connexion.")
        sys.exit(1)

    print(f"\n✅ {len(articles)} article(s) récupéré(s) avec succès :\n")

    for i, article in enumerate(articles, start=1):
        display_product_summary(article, i)

    # Sauvegarde dans le fichier JSON
    if args.output:
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), args.output)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"💾 Les données ont été exportées dans : {output_path}\n")


if __name__ == "__main__":
    main()
