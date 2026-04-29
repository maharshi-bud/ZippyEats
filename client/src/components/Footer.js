"use client";

import Link from "next/link";
import logo from "../lib/imgs/logoSquare.png";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* LOGO + DESC */}
        <div className="footer-col">
              <img src={logo.src} alt="ZippyEats" className="logo-img2" />
            
          <h2 className="footer-logo">ZippyEats</h2>
          <p className="footer-text">
            Fast delivery. Great food. Anytime, anywhere.
          </p>
        </div>

        {/* LINKS */}
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="#">About</Link>
          <Link href="#">Careers</Link>
          <Link href="#">Blog</Link>
        </div>

        {/* HELP */}
        <div className="footer-col">
          <h4>Support</h4>
          <Link href="#">Help Center</Link>
          <Link href="#">Contact</Link>
          <Link href="#">Terms</Link>
        </div>

        {/* SOCIAL */}
        <div className="footer-col">
          <h4>Follow Us</h4>
          <div className="footer-social">
            <span>🌐</span>
            <span>📸</span>
            <span>🐦</span>
          </div>
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} ZippyEats. All rights reserved.
      </div>

    </footer>
  );
}