import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('nadhif_language') || 'fr';
  });
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    localStorage.setItem('nadhif_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setIsChanging(true);
    // Wait for fade out
    setTimeout(() => {
      setLanguage((prev) => (prev === 'fr' ? 'ar' : 'fr'));
      // Wait for DOM to update then fade in
      setTimeout(() => {
        setIsChanging(false);
      }, 50);
    }, 250);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      <div 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        style={{
          opacity: isChanging ? 0 : 1,
          transform: isChanging ? 'translateY(15px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-color)',
          filter: isChanging ? 'blur(4px)' : 'none'
        }}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
