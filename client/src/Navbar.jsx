import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { Menu, X, Globe, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const indicatorRef = useRef(null);
  const containerRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Update indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = containerRef.current?.querySelector('.nav-link.active');
      if (activeLink && indicatorRef.current) {
        const { offsetLeft, offsetWidth } = activeLink;
        indicatorRef.current.style.left = `${offsetLeft}px`;
        indicatorRef.current.style.width = `${offsetWidth}px`;
        indicatorRef.current.style.opacity = '1';
      } else if (indicatorRef.current) {
        indicatorRef.current.style.opacity = '0';
      }
    };

    updateIndicator();
    // Re-run on resize or language change
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [location.pathname, language, isOpen]);

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo" onClick={() => { closeMenu(); window.scrollTo(0, 0); }}>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#00C853" fillOpacity="0.2"/>
                <path d="M7 16C7 16 9 11 12 8C15 11 17 16 17 16" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V8" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="brand-name">Nadhif Bouira</span>
        </Link>

        {/* Hamburger Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
           <div className="nav-links-inner" ref={containerRef}>
             <div className="nav-indicator" ref={indicatorRef}></div>
             <NavLink to="/" className="nav-link" end onClick={() => { closeMenu(); window.scrollTo(0, 0); }}>{t.nav.home}</NavLink>
             <NavLink to="/signalement" className="nav-link" onClick={closeMenu}>{t.nav.report}</NavLink>
             <NavLink to="/suivi" className="nav-link" onClick={closeMenu}>{t.nav.follow_up}</NavLink>
           </div>
           
           <div className="nav-actions">
              <button onClick={toggleTheme} className="lang-btn theme-toggle" title={theme === 'light' ? 'Mode Sombre' : 'Mode Clair'}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              
              <button onClick={toggleLanguage} className="lang-btn">
                <Globe size={18} style={{ marginRight: '6px' }} />
                {language === 'fr' ? 'العربية' : 'Français'}
              </button>
           </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
