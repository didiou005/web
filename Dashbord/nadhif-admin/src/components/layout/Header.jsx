import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Moon, Sun, Menu, ChevronLeft } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';

const Header = ({ toggleMobileMenu, isSidebarCollapsed, toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    // Logique de déconnexion
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="header" style={{ borderBottom: 'none' }}>
      <div className="header-left">
        <button 
          className="header-btn toggle-btn" 
          onClick={() => {
            if (window.innerWidth <= 1024) {
              toggleMobileMenu();
            } else {
              toggleSidebar();
            }
          }}
          title={isSidebarCollapsed ? "Développer" : "Réduire"}
        >
          <Menu size={24} />
        </button>
      </div>
      
      <div className="header-right">
        <button 
          className="header-btn" 
          onClick={toggleTheme}
          title={isDarkMode ? "Mode clair" : "Mode sombre"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="user-menu">
          <Link to="/settings" className="user-info" style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}>
            <User size={20} />
            <span>{user.full_name || 'Admin'}</span>
          </Link>
        </div>

        <button className="header-btn" onClick={() => setIsLogoutModalOpen(true)} title="Se déconnecter">
          <LogOut size={20} />
        </button>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir vous déconnecter du tableau de bord ?"
        confirmText="Déconnexion"
        cancelText="Annuler"
        variant="danger"
        icon={LogOut}
      />
    </header>
  );
};

export default Header;
