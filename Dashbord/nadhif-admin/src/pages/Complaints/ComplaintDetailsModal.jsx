
import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Clock, Image as ImageIcon, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
if (L.Marker.prototype.options) {
    L.Marker.prototype.options.icon = DefaultIcon;
}

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16);
  }, [center, map]);
  return null;
};
import { complaintsService } from '../../services/api';
import toast from 'react-hot-toast';

const ComplaintDetailsModal = ({ isOpen, onClose, complaintId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Helper to handle absolute vs relative URLs for images
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Les images sont stockées sur le serveur mobile (VPS)
    // On utilise l'IP du VPS avec le port 3000
    const remoteBase = "https://nadhif.yanlouggani.dev";
    return `${remoteBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (isOpen && complaintId) {
      loadDetails();
    }
  }, [isOpen, complaintId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await complaintsService.getById(complaintId);
      if (res.success) {
        setDetails(res.data);
        setNewStatus(res.data.status);
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === details.status) return;
    
    setUpdating(true);
    try {
      const res = await complaintsService.updateStatus(complaintId, { 
        status: newStatus,
        note: note
      });
      
      if (res.success) {
        toast.success('Statut mis à jour avec succès');
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyCode = () => {
    const code = details?.code || complaintId?.split('-')[0];
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copié !`);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: '"Inter", sans-serif'
    },
    modal: {
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)',
      width: '100%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid var(--border-color)'
    },
    header: {
      padding: '24px 32px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'var(--bg-secondary)'
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '24px'
    },
    card: {
      padding: '20px',
      backgroundColor: 'var(--gray-50)',
      borderRadius: '16px',
      border: '1px solid var(--border-color)',
      marginBottom: '16px'
    },
    label: {
        fontSize: '11px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
        display: 'block'
    },
    badge: (status) => {
        const base = { padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };
        if (status === 'resolue') return { ...base, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
        if (status === 'en_cours') return { ...base, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
        return { ...base, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
    }
  };

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em' }}>Détails du Signalement</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span 
                  onClick={handleCopyCode}
                  style={{ fontWeight: '800', color: 'var(--green-primary)', backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                  title="Cliquez pour copier le code"
                >
                  #{details?.code || complaintId?.split('-')[0]}
                </span>
                {details && (
                    <>
                        <span style={{ color: 'var(--border-color)' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> {new Date(details.created_at).toLocaleDateString()}
                        </div>
                        <span style={{ color: 'var(--border-color)' }}>|</span>
                        <span style={styles.badge(details.status)}>
                            {details.status === 'resolue' ? 'Résolue' : details.status === 'en_cours' ? 'En cours' : 'En attente'}
                        </span>
                    </>
                )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ padding: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', borderRadius: '12px', color: 'var(--text-secondary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={styles.content}>
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin-modal 1s linear infinite', margin: '0 auto 16px' }}></div>
                <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Chargement des détails...</p>
            </div>
          ) : details ? (
            <div style={styles.grid}>
              
              {/* Info Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={styles.card}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={20} style={{ color: 'var(--green-primary)' }} /> Action & Statut
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={styles.label}>Nouveau statut</label>
                            <select 
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="en_attente">En attente (Non traité)</option>
                                <option value="en_cours">En cours (Équipe envoyée)</option>
                                <option value="resolue">Résolue (Nettoyage terminé)</option>
                            </select>
                        </div>

                        <div>
                            <label style={styles.label}>Note d'intervention</label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px', minHeight: '100px', outline: 'none', resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                placeholder="Précisez les actions menées..."
                            />
                        </div>

                        <button 
                            onClick={handleStatusUpdate}
                            disabled={updating || newStatus === details.status}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '12px', 
                                border: 'none',
                                background: updating || newStatus === details.status ? 'var(--gray-200)' : 'var(--green-primary)',
                                color: updating || newStatus === details.status ? 'var(--text-secondary)' : 'white',
                                fontWeight: '800',
                                fontSize: '14px',
                                cursor: updating || newStatus === details.status ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: updating || newStatus === details.status ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.25)'
                            }}
                        >
                            {updating ? 'Mise à jour...' : 'Confirmer le changement'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderLeft: '4px solid var(--green-primary)', padding: '16px 20px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px 16px 16px 4px', border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                        <label style={styles.label}>Type de signalement</label>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '16px' }}>
                            {details.complaint_type || details.waste_type || 'Général'}
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <label style={styles.label}>Localisation GPS</label>
                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} /> {details.commune_name}, {details.region_name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{details.address_text || 'Coordonnées directes via application'}</div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <label style={styles.label}>Message original</label>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7', fontStyle: details.description ? 'normal' : 'italic' }}>
                            {details.description || "Le citoyen n'a pas laissé de commentaire écrit."}
                        </p>
                    </div>
                </div>

              </div>

              {/* Media Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Photos */}
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ImageIcon size={20} style={{ color: 'var(--green-primary)' }} /> Photos du constat
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {details.photos && details.photos.length > 0 ? (
                            details.photos.map((photo, index) => (
                                <div key={index} style={{ position: 'relative', height: '180px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                    <img 
                                        src={getImageUrl(photo.url)} 
                                        alt={`Constat ${index+1}`} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: 'span 2', padding: '50px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
                                <ImageIcon size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>Aucun élément visuel</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map */}
                {details.gps_parsed && (
                    <div style={{ height: '300px', borderRadius: '20px', overflow: 'hidden', border: '5px solid var(--bg-secondary)', boxShadow: 'var(--shadow-lg)' }}>
                        <MapContainer 
                            center={[details.gps_parsed.lat, details.gps_parsed.lng]} 
                            zoom={16} 
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[details.gps_parsed.lat, details.gps_parsed.lng]} />
                            <ChangeView center={[details.gps_parsed.lat, details.gps_parsed.lng]} />
                        </MapContainer>
                    </div>
                )}

              </div>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: '600' }}>Erreur critique: Détails introuvables</p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin-modal {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default ComplaintDetailsModal;
