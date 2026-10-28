import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-inner">
      {/* Brand */}
      <div className="footer-brand">
        <div className="footer-logo">
          <div className="logo-icon">A</div>
          <span>Appsica<strong>Ecom</strong></span>
        </div>
        <p>Your one-stop premium shopping destination. Quality products, fast delivery, unbeatable prices.</p>
        <div className="footer-socials">
          {['ig', 'x', 'f', '▶'].map((mark) => (
            <a key={mark} href="#" className="social-btn" aria-label={`Appsica on ${mark}`}>{mark}</a>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="footer-col">
        <h4>Quick Links</h4>
        <ul>
          <li><Link to="/products">All Products</Link></li>
          <li><Link to="/category/electronics">Electronics</Link></li>
          <li><Link to="/category/fashion">Fashion</Link></li>
          <li><Link to="/category/home">Home & Living</Link></li>
          <li><Link to="/my-orders">Track Order</Link></li>
        </ul>
      </div>

      {/* Account & Portals */}
      <div className="footer-col">
        <h4>Account & Portals</h4>
        <ul>
          <li><Link to="/account/profile">My Profile</Link></li>
          <li><Link to="/my-orders">My Orders</Link></li>
          <li><Link to="/wishlist">Wishlist</Link></li>
          <li><Link to="/vendor/login">Become a Seller</Link></li>
          <li><Link to="/delivery/login">Delivery Partner</Link></li>
        </ul>
      </div>

      {/* Contact */}
      <div className="footer-col">
        <h4>Contact Us</h4>
        <div className="footer-contact">
          <div className="contact-item"><Mail size={16} /><span>support@appsicaecom.com</span></div>
          <div className="contact-item"><Phone size={16} /><span>+91 98765 43210</span></div>
          <div className="contact-item"><MapPin size={16} /><span>Mumbai, Maharashtra, India</span></div>
        </div>
      </div>
    </div>

    <div className="footer-bottom container">
      <p>© {new Date().getFullYear()} AppsicaEcom. All rights reserved.</p>
      <div className="footer-legal">
        <Link to="#">Privacy Policy</Link>
        <Link to="#">Terms of Service</Link>
        <Link to="#">Refund Policy</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
