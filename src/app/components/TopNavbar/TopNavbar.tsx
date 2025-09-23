'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navbarStyles, styleVariants } from './TopNavbar.Style';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contact', href: '/contact' },
];

export default function TopNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isMobileButtonHovered, setIsMobileButtonHovered] = useState(false);

  return (
    <>
      <nav style={navbarStyles.nav}>
        <div style={navbarStyles.container}>
          {/* Logo */}
          <Link 
            href="/" 
            style={isLogoHovered ? styleVariants.logoHover : navbarStyles.logo}
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
          >
            Proactive
          </Link>

          {/* Desktop Navigation */}
          <ul style={navbarStyles.navLinks} className="desktop-nav">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={
                    hoveredLink === item.href
                      ? { ...navbarStyles.navLink, ...navbarStyles.navLinkHover }
                      : navbarStyles.navLink
                  }
                  onMouseEnter={() => setHoveredLink(item.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile menu button */}
          <button
            style={
              isMobileButtonHovered
                ? styleVariants.mobileButtonHover
                : navbarStyles.mobileButton
            }
            className="mobile-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onMouseEnter={() => setIsMobileButtonHovered(true)}
            onMouseLeave={() => setIsMobileButtonHovered(false)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div
        style={
          isMenuOpen
            ? { ...navbarStyles.mobileMenu, ...navbarStyles.mobileMenuOpen }
            : navbarStyles.mobileMenu
        }
        className="mobile-menu"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={
              hoveredLink === item.href
                ? { ...navbarStyles.navLink, ...navbarStyles.navLinkHover }
                : navbarStyles.navLink
            }
            onMouseEnter={() => setHoveredLink(item.href)}
            onMouseLeave={() => setHoveredLink(null)}
            onClick={() => setIsMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* CSS for responsive behavior */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-button {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-button {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}