// src/pages/Settings/index.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Settings as SettingsIcon, 
  Bell, 
  Moon, 
  Check, 
  ShieldCheck,
  ChevronRight,
  Database,
  Smartphone,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { authService } from '../../services/api';

const Settings = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form States
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    function: user.function || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        showMessage('success', 'Profil mis à jour avec succès');
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage('error', 'Les nouveaux mots de passe ne correspondent pas');
    }
    setLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (response.success) {
        showMessage('success', 'Mot de passe modifié avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Ancien mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const [darkMode, setDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Initialisation au chargement
  useEffect(() => {
    // Thème
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !darkMode ? 'dark' : 'light';
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const tabs = [
    { id: 'profile', label: 'Profil Personnel', icon: User },
    { id: 'security', label: 'Sécurité & Accès', icon: Lock },
    { id: 'appearance', label: 'Affichage', icon: Moon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    authService.logout();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Modal de Déconnexion (Custom) */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--white)', width: '90%', maxWidth: '400px',
            borderRadius: '28px', padding: '32px', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-color)',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '64px', height: '64px', background: '#fef2f2', 
              color: '#dc2626', borderRadius: '20px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <LogOut size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>Déconnexion</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px', lineHeight: '1.5' }}>
              Souhaitez-vous vraiment quitter votre session sécurisée ? Vos modifications non enregistrées seront perdues.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)',
                  background: 'var(--gray-50)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--gray-50)'}
              >
                Rester
              </button>
              <button 
                onClick={confirmLogout}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '16px', border: 'none',
                  background: '#dc2626', color: 'white', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#b91c1c'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.target.style.background = '#dc2626'; e.target.style.transform = 'translateY(0)'; }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--green-primary)', padding: '8px', borderRadius: '12px', color: 'white' }}>
            <SettingsIcon size={24} />
          </div>
          Paramètres
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Gérez les préférences de votre compte et les configurations système</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Navigation latérale des paramètres */}
        <div style={{ background: 'var(--white)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--green-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '4px',
                textAlign: 'left'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}

          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '16px',
              border: 'none',
              background: 'transparent',
              color: '#dc2626',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginTop: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
          
          <div style={{ margin: '20px 16px 8px', height: '1px', background: 'var(--border-color)' }} />
          
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut Système</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>API Connectée</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={14} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>V 0.0.2-admin</span>
            </div>
          </div>
        </div>

        {/* Zone de contenu */}
        <div style={{ background: 'var(--white)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '40px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          
          {message.text && (
            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              marginBottom: '24px', 
              background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: `1px solid ${message.type === 'success' ? '#10b98130' : '#ef444430'}`
            }}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px' }}>Informations du Profil</h2>
              <form onSubmit={handleProfileSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Nom Complet (Lecture seule)</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      disabled
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: '#94a3b8', outline: 'none', cursor: 'not-allowed', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Email (Lecture seule)</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: '#94a3b8', outline: 'none', cursor: 'not-allowed', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Fonction au sein de Nadhif</label>
                  <input
                    type="text"
                    value={profileData.function}
                    onChange={(e) => setProfileData({ ...profileData, function: e.target.value })}
                    placeholder="ex: Responsable de zone"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe', marginBottom: '32px' }}>
                  <ShieldCheck style={{ color: '#2563eb' }} size={24} />
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>Rôle : {user.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}</div>
                    <div style={{ fontSize: '12px', color: '#3b82f6' }}>Votre niveau d'accès détermine les actions possibles sur la plateforme.</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'var(--green-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Changer le mot de passe</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Assurez-vous d'utiliser un mot de passe robuste avec au moins 8 caractères.</p>
              
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Ancien mot de passe</label>
                  <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Nouveau mot de passe</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Confirmer le nouveau mot de passe</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#1f2937',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Modification...' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Interface & Thème</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Personnalisez l'apparence de votre tableau de bord.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--border-color)', borderRadius: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}><Moon size={20} /></div>
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>Mode Sombre</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Activer l'interface sombre pour réduire la fatigue oculaire.</div>
                  </div>
                </div>
                <div 
                  onClick={toggleDarkMode}
                  style={{ width: '50px', height: '26px', borderRadius: '25px', background: darkMode ? 'var(--green-primary)' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                   <div style={{ position: 'absolute', left: darkMode ? '26px' : '4px', top: '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Bell size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Bientôt disponible</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Le système de notifications push sera activé dans la prochaine mise à jour.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
