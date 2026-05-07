import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Info, X } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger', // 'danger', 'success', 'warning', 'info'
  icon: Icon // Optional custom icon component
}) => {
  if (!isOpen) return null;

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  // Determine colors based on variant
  const getVariantStyles = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    switch (variant) {
      case 'danger':
        return {
          iconBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
          iconColor: '#ef4444',
          confirmBtnBg: '#ef4444',
          confirmBtnColor: 'white'
        };
      case 'success':
        return {
          iconBg: isDark ? 'rgba(22, 163, 74, 0.2)' : '#f0fdf4',
          iconColor: '#16a34a',
          confirmBtnBg: '#16a34a',
          confirmBtnColor: 'white'
        };
      case 'warning':
        return {
          iconBg: isDark ? 'rgba(202, 138, 4, 0.2)' : '#fefce8',
          iconColor: '#ca8a04',
          confirmBtnBg: '#ca8a04',
          confirmBtnColor: 'white'
        };
      default:
        return {
          iconBg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
          iconColor: '#3b82f6',
          confirmBtnBg: '#3b82f6',
          confirmBtnColor: 'white'
        };
    }
  };

  const styles = getVariantStyles();
  const DisplayIcon = Icon || AlertTriangle;

  return createPortal(
    <div 
      onClick={onClose}
      onKeyDown={stopPropagation}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={stopPropagation}
        style={{
          background: 'var(--bg-secondary)',
          padding: '32px',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        <div style={{
          background: styles.iconBg,
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: styles.iconColor,
          transition: 'transform 0.2s',
        }}>
          <DisplayIcon size={36} strokeWidth={2} />
        </div>
        
        <h2 style={{
          fontSize: '22px',
          fontWeight: '700',
          marginBottom: '12px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em'
        }}>
          {title}
        </h2>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '15px',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--bg-primary)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            {cancelText}
          </button>
          
          <button 
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              background: styles.confirmBtnBg,
              color: styles.confirmBtnColor,
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.1s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
