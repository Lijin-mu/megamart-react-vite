import { MessageCircle, Phone } from 'lucide-react';
import { customerServices, popularCategories } from '../data/storeData.js';

function FooterLinks({ title, links }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link}>
            <a href="#">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-contact">
          <h2>MegaMart</h2>
          <h4>Contact Us</h4>
          <p>
            <MessageCircle /> WhatsApp
            <br />
            <span>+1 202-918-2132</span>
          </p>
          <p>
            <Phone /> Call Us
            <br />
            <span>+1 202-918-2132</span>
          </p>
          <h4>Download App</h4>
          <div className="app-badges">
            <a href="#app"> App Store</a>
            <a href="#google">▶ Google Play</a>
          </div>
        </div>
        <FooterLinks title="Most Popular Categories" links={popularCategories} />
        <FooterLinks title="Customer Services" links={customerServices} />
      </div>
      <div className="container copyright">
        © 2022 All rights reserved. Reliance Retail Ltd.
      </div>
    </footer>
  );
}
