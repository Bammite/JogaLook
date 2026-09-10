import './Footer.css';
import logoImg from '../assets/LogoPourFondnoir.png';
import {
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  CreditCardIcon,
  BankIcon,
  MobileMoneyIcon,
} from './icons/AppIcons';

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <img src={logoImg} alt="JogaLook" className="logo-img" />
            </a>
            <p>
              Votre destination n°1 pour les maillots de sport authentiques.
              Qualité premium, livraison rapide et service client 5 étoiles.
            </p>
            <div className="footer-social">
              <a href="https://www.facebook.com/profile.php?id=61593884236549" aria-label="Facebook"><span>f</span></a>
              <a href="https://www.instagram.com/jogalook" aria-label="Instagram">
                <InstagramIcon size={16} />
              </a>
              <a href="https://wa.me/+221781941351" aria-label="WhatsApp">
                <WhatsappIcon size={16} />
              </a>
              <a href="https://www.tiktok.com/@jogalook.officiel" aria-label="TikTok">
                <TiktokIcon size={16} />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Boutique</h4>
            <ul>
              <li><a href="#">Nouveautés</a></li>
              <li><a href="#">Maillots Domicile</a></li>
              <li><a href="#">Maillots Extérieur</a></li>
              <li><a href="#">Maillots Third</a></li>
              <li><a href="#">Éditions Spéciales</a></li>
              <li><a href="#">Promotions</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Aide</h4>
            <ul>
              <li><a href="#">Mon Compte</a></li>
              <li><a href="#">Suivi de Commande</a></li>
              <li><a href="#">Guide des Tailles</a></li>
              <li><a href="#">Livraison</a></li>
              <li><a href="#">Retours</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>À Propos</h4>
            <ul>
              <li><a href="#">Notre Histoire</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Carrières</a></li>
              <li><a href="#">Presse</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Légal</h4>
            <ul>
              <li><a href="/legal/cgu.html">CGU</a></li>
              <li><a href="/legal/cgv.html">CGV</a></li>
              <li><a href="/legal/politique_confidentialite.html">Confidentialité</a></li>
              <li><a href="/legal/mentions_legales.html">Mentions légales</a></li>
              <li><a href="/legal/politique_cookies.html">Cookies</a></li>
            </ul>
          </div>

          <div className="footer-column footer-newsletter">
            <h4>Newsletter</h4>
            <p>Recevez les dernières offres et nouveautés</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Votre email" required />
              <button type="submit" aria-label="Envoyer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 JogaLook. Tous droits réservés.</p>
          <div className="footer-payments">
            <span title="Carte bancaire"><CreditCardIcon size={20} /></span>
            <span title="Virement bancaire"><BankIcon size={20} /></span>
            <span title="Paiement Mobile"><MobileMoneyIcon size={20} /></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;