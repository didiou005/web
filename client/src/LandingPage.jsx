import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';

const LandingPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <h1>
              {t.hero.title_1} <br />
              <span className="highlight">{t.hero.title_highlight}</span>
            </h1>
            <p>
              {t.hero.subtitle}
            </p>
            <div className="hero-buttons">
              <Link to="/signalement" className="btn-primary btn-lg">
                {t.hero.btn_report}
              </Link>
              <a href="#features" className="btn-secondary btn-lg">
                {t.hero.btn_how}
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-image"
          >
             <motion.div 
                className="floating-card glass"
                initial={{ opacity: 0, x: -30 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  y: [0, -12, 0, -8, 0],
                }}
                whileHover={{ scale: 1.08, y: -20, rotate: 2 }}
                transition={{
                  opacity: { duration: 0.8 },
                  x: { duration: 0.8 },
                  y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.2 }
                }}
             >
                <span className="icon">📍</span>
                <div>
                    <strong>{t.cards.geo.title}</strong>
                    <p>{t.cards.geo.text}</p>
                </div>
             </motion.div>
             <motion.div 
                className="floating-card glass card-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  y: [0, 10, -5, 12, 0],
                }}
                whileHover={{ scale: 1.08, y: -10, rotate: -2 }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.1 },
                  x: { duration: 0.8, delay: 0.1 },
                  y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 },
                  scale: { duration: 0.2 },
                  rotate: { duration: 0.2 }
                }}
             >
                <span className="icon">📸</span>
                <div>
                    <strong>{t.cards.photo.title}</strong>
                    <p>{t.cards.photo.text}</p>
                </div>
             </motion.div>
             {/* Abstract shape */}
             <div className="blob"></div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container stats-grid">
            <div className="stat-item">
                <h3>43</h3>
                <p>{t.stats.communes}</p>
            </div>
            <div className="stat-item">
                <h3>24/7</h3>
                <p>{t.stats.service}</p>
            </div>
            <div className="stat-item">
                <h3>+1000</h3>
                <p>{t.stats.resolved}</p>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
            <div className="section-title">
                <h2>{t.features.title}</h2>
                <p>{t.features.subtitle}</p>
            </div>
            <div className="features-grid">
                <motion.div 
                    whileHover={{ y: -10 }}
                    className="feature-card"
                    onClick={() => navigate('/signalement')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="feature-icon step-1">1</div>
                    <h3>{t.features.step1.title}</h3>
                    <p>{t.features.step1.text}</p>
                </motion.div>
                <div className="connector"></div>
                <motion.div 
                    whileHover={{ y: -10 }}
                    className="feature-card"
                >
                    <div className="feature-icon step-2">2</div>
                    <h3>{t.features.step2.title}</h3>
                    <p>{t.features.step2.text}</p>
                </motion.div>
                 <div className="connector"></div>
                <motion.div 
                    whileHover={{ y: -10 }}
                    className="feature-card"
                    onClick={() => navigate('/suivi')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="feature-icon step-3">3</div>
                    <h3>{t.features.step3.title}</h3>
                    <p>{t.features.step3.text}</p>
                </motion.div>
            </div>
        </div>
      </section>
      
      <footer className="footer">
        <div className="container">
            <p>© 2026 Epic Nadhif Bouira - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
