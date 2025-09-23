import { CSSProperties } from 'react';

interface NavbarStyles {
  nav: CSSProperties;
  container: CSSProperties;
  logo: CSSProperties;
  navLinks: CSSProperties;
  navLink: CSSProperties;
  navLinkHover: CSSProperties;
  mobileButton: CSSProperties;
  mobileMenu: CSSProperties;
  mobileMenuOpen: CSSProperties;
}

export const navbarStyles: NavbarStyles = {
  nav: {
    backgroundColor: 'white', 
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    fontSize: '1rem',
  },
  navLinkHover: {
    color: '#007bff',
    backgroundColor: '#f8f9fa',
  },
  mobileButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    color: '#666',
    transition: 'color 0.2s ease',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column' as const,
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    gap: '0.5rem',
    borderTop: '1px solid #e9ecef',
  },
  mobileMenuOpen: {
    display: 'flex',
  },
};

// CSS-in-JS media queries
export const mediaQueries = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)',
};

// Additional style variants
export const styleVariants = {
  logoHover: {
    ...navbarStyles.logo,
    color: '#555',
  },
  mobileButtonHover: {
    ...navbarStyles.mobileButton,
    color: '#007bff',
  },}