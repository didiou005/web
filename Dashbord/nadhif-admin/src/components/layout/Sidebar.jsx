// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { sidebarConfig } from '../../config/sidebarConfig';

const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);

  const toggleSection = (sectionId) => {
    if (isCollapsed) {
      toggleSidebar(); // Expand sidebar if collapsed
      setExpandedSections([...expandedSections, sectionId]); // Expand the section
      return;
    }
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path) => {
    if (!path) return false;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedLocation = location.pathname.startsWith('/') ? location.pathname : `/${location.pathname}`;
    return normalizedLocation === normalizedPath;
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'admin';

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        {(!isCollapsed || isMobileOpen) && (
          <div className="sidebar-header-content">
            <h1 className="sidebar-logo">NADHIF</h1>
            <p className="sidebar-subtitle">Gestion des déchets</p>
          </div>
        )}
        {isCollapsed && !isMobileOpen && (
          <div className="sidebar-logo-collapsed">N</div>
        )}
      </div>

      <nav className="sidebar-nav">
        {sidebarConfig
          .filter(section => {
            // Restriction : seul le super_admin voit la gestion des admins et le journal
            if (section.id === 'admins' || section.id === 'logs') return userRole === 'super_admin';
            return true;
          })
          .map(section => (
            <div key={section.id} className="sidebar-section">
              {section.items ? (
                <>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`sidebar-section-button ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? section.label : ''}
                  >
                    <div className={`sidebar-section-left ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
                      <section.icon size={20} />
                      {(!isCollapsed || isMobileOpen) && <span>{section.label}</span>}
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                      expandedSections.includes(section.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )
                    )}
                  </button>
                  {(!isCollapsed || isMobileOpen) && expandedSections.includes(section.id) && (
                    <div className="sidebar-subsection">
                      {section.items.map(item => (
                        <Link
                          key={item.id}
                          to={item.path}
                          className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={section.path}
                  className={`sidebar-section-button ${isActive(section.path) ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? section.label : ''}
                  onClick={closeMobileMenu}
                >
                  <div className={`sidebar-section-left ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
                    <section.icon size={20} />
                    {(!isCollapsed || isMobileOpen) && <span>{section.label}</span>}
                  </div>
                  {(!isCollapsed || isMobileOpen) && !section.developed && (
                    <span className="badge-soon">Bientôt</span>
                  )}
                </Link>
              )}
            </div>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
