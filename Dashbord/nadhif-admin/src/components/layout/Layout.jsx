import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Overlay for mobile */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
      />
      
      <div className="main-content">
        <Header 
          toggleMobileMenu={toggleMobileMenu} 
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main key={location.pathname} className="content-wrapper page-animate">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
