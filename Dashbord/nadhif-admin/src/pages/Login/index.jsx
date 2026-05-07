// src/pages/Login/index.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/api';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login(credentials.email, credentials.password);
      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.message || 'Identifiants invalides');
      }
    } catch (err) {
      console.error('Erreur connexion:', err);
      setError(err.response?.data?.message || 'Erreur lors de la connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="login-card" style={{
        width: '100%',
        maxWidth: '360px',
        background: 'var(--white)',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '10px',
            background: 'var(--green-lighter)',
            borderRadius: '10px',
            color: 'var(--green-primary)',
            marginBottom: '12px'
          }}>
            <LogIn size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Nadhif Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Wilaya de ...
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="email"
                name="email"
                required
                placeholder="Ex: admin@nadhif.dz"
                value={credentials.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 36px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--gray-50)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 36px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--gray-50)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--green-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            © 2026 Nadhif - Système de gestion de wilaya
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
