// src/utils/notifications.jsx
import { toast } from 'react-hot-toast';
import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

/**
 * Custom Toast Component for "Wowed" results
 * This matches the Cyber-Noir / Pro Futuristic aesthetic perfectly.
 */
const CustomToast = ({ t, title, message, type }) => {
  const iconMap = {
    success: <CheckCircle2 size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div 
      className={`custom-toast ${type} ${t.visible ? 'animate-toast-in' : 'animate-toast-out'}`}
      style={{
        opacity: t.visible ? 1 : 0,
        transform: `translateX(${t.visible ? 0 : 20}px)`,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className={`toast-icon-wrapper ${type}`}>
        {iconMap[type]}
      </div>
      
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>

      <button 
        onClick={() => toast.dismiss(t.id)}
        className="toast-close-btn"
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'}
      >
        <X size={16} />
      </button>
    </div>
  );
};

const commonErrors = {
  'referenced in other records': 'Cette ressource ne peut pas être supprimée car elle est associée à d\'autres éléments actifs.',
  'already exists': 'Cet enregistrement existe déjà dans la base de données.',
  'unauthorized': 'Accès refusé. Vous n\'avez pas les permissions pour cette action.',
  'network error': 'Le serveur ne répond pas. Veuillez vérifier votre connexion.',
  'failed to fetch': 'Erreur de communication. Le serveur est peut-être hors ligne.',
  'invalid': 'Données invalides. Veuillez vérifier les champs du formulaire.',
};

const mapErrorMessage = (msg) => {
  if (!msg) return 'Une erreur inattendue est survenue.';
  const lowerMsg = msg.toLowerCase();
  
  for (const [key, value] of Object.entries(commonErrors)) {
    if (lowerMsg.includes(key)) return value;
  }
  
  return msg;
};

export const showToast = {
  success: (message, title = 'Succès') => {
    toast.custom((t) => (
      <CustomToast t={t} type="success" title={title} message={message} />
    ), { duration: 4000 });
  },
  
  error: (err, title = 'Action Impossible') => {
    const rawMsg = typeof err === 'string' ? err : err?.response?.data?.message || err?.message || err?.response?.data?.error;
    const message = mapErrorMessage(String(rawMsg));
    
    toast.custom((t) => (
      <CustomToast t={t} type="error" title={title} message={message} />
    ), { duration: 6000 });
  },
  
  info: (message, title = 'Information') => {
    toast.custom((t) => (
      <CustomToast t={t} type="info" title={title} message={message} />
    ), { duration: 4000 });
  },
  
  warning: (message, title = 'Attention') => {
    toast.custom((t) => (
      <CustomToast t={t} type="warning" title={title} message={message} />
    ), { duration: 5000 });
  }
};
