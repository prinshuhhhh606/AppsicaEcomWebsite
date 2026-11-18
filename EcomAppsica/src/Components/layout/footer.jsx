import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import './Footer.css';

const Footer = () => (
  <div className="footer-wrapper">
    {/* Newsletter Section (ViVA Luxury Style) */}
    <div className="container footer-newsletter-container">
      <div className="footer-newsletter-card">
        <div className="newsletter-info">
          <div className="newsletter-icon-box">
            <Mail size={24} />
          </div>
          <div>
            <h3>Stay in the Loop</h3>
            <p>Get exclusive deals, new arrivals and style inspiration straight to your inbox.</p>
          </div>
        </div>
        <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed to StunnerYsl newsletter!'); }}>
          <div className="newsletter-input-wrap">
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit" className="newsletter-btn">Subscribe</button>
          </div>
          <span className="newsletter-privacy">
            🔒 We respect your privacy. Unsubscribe anytime.
          </span>
        </form>
      </div>
    </div>

    {/* Value Proposition & Trust Badges Strip (ViVA Luxury Style) */}
    <div className="footer-trust-strip">
      <div className="container footer-trust-inner">
        <div className="trust-item">
          <div className="trust-icon-box">
            <Truck size={22} />
          </div>
          <div className="trust-item-text">
            <strong>Free Shipping</strong>
            <small>On all orders over ₹999</small>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon-box">
            <RotateCcw size={22} />
          </div>
          <div className="trust-item-text">
            <strong>Easy Returns</strong>
            <small>30 days doorstep return policy</small>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div className="trust-item-text">
            <strong>Secure Payments</strong>
            <small>100% encrypted & verified</small>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon-box">
            <Headphones size={22} />
          </div>
          <div className="trust-item-text">
            <strong>24/7 Support</strong>
            <small>Dedicated customer assistance</small>
          </div>
        </div>
      </div>
    </div>

    {/* Main Deep Forest Pine Footer */}
    <footer className="footer">
      <div className="container footer-inner">
        {/* Brand Column */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="footer-logo-text">
              <span>Stunner<strong>Ysl</strong></span>
              <small>LIVE BETTER</small>
            </div>
          </Link>
          <p>
            Your one-stop organic luxury shopping destination. Thoughtful curation, premium quality, sustainable everyday essentials.
          </p>
          <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Twitter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="YouTube">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                <polygon points="10 15 15 12 10 9 10 15"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Shop & Discover</h4>
          <ul>
            <li><Link to="/products">All Categories</Link></li>
            <li><Link to="/category/electronics">Electronics & Audio</Link></li>
            <li><Link to="/category/fashion">Fashion & Apparel</Link></li>
            <li><Link to="/category/home-living">Home & Living</Link></li>
            <li><Link to="/category/beauty">Beauty & Wellness</Link></li>
            <li><Link to="/my-orders">Track Order</Link></li>
          </ul>
        </div>

        {/* Account & Portals */}
        <div className="footer-col">
          <h4>Customer Portals</h4>
          <ul>
            <li><Link to="/account/profile">My Profile</Link></li>
            <li><Link to="/my-orders">Order History & Invoices</Link></li>
            <li><Link to="/wishlist">Saved Wishlist</Link></li>
            <li><Link to="/vendor/login">Become a Seller (Vendor)</Link></li>
            <li><Link to="/delivery/login">Delivery Partner Portal</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Get In Touch</h4>
          <div className="footer-contact">
            <div className="contact-item">
              <Mail size={16} />
              <span>support@stunnerysl.com</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>+91 98765 43210</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Mumbai, Maharashtra, India</span>
            </div>
          </div>
          <div className="footer-hours">
            <small>Mon – Sat: 9:00 AM – 8:00 PM IST</small>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-wrap">
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} StunnerYsl, Inc. Live Better. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default Footer;
