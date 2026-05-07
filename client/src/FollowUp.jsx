import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import Skeleton from './Skeleton';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map center when coordinates change
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

// Composant pour activer/désactiver dynamiquement l'interactivité et redimensionner la carte
function MapController({ isExpanded }) {
  const map = useMap();
  
  useEffect(() => {
    // Force le redimensionnement de la carte pour éviter les zones grises
    // On le fait immédiatement et après la transition CSS
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350); // 350ms pour couvrir la transition de 300ms

    if (isExpanded) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      if (map.tap) map.tap.enable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      if (map.tap) map.tap.disable();
    }

    return () => clearTimeout(timer);
  }, [isExpanded, map]);

  return null;
}

/**
 * Composant pour le suivi de l'état d'une plainte
 * Version production - Connexion à l'API réelle
 */
const FollowUp = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [complaintCode, setComplaintCode] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const [expandedPhoto, setExpandedPhoto] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('nadhif_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const addToHistory = (code) => {
    setSearchHistory(prev => {
      const newHistory = [code, ...prev.filter(c => c !== code)].slice(0, 5); // Keep last 5
      localStorage.setItem('nadhif_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('nadhif_search_history');
    setShowClearConfirm(false);
  };

  // Gérer le code passé via la navigation
  useEffect(() => {
    if (location.state?.code) {
      setComplaintCode(location.state.code);
      searchComplaint(location.state.code);
    }
  }, [location.state]);

  /**
   * Fonction pour récupérer une plainte depuis l'API
   * @param {string} code - Le code de la plainte à rechercher
   */
  const searchComplaint = async (code) => {
    // Réinitialiser tous les états
    setError('');
    setNotFound(false);
    setComplaint(null);
    setLoading(true);

    try {
      // Appel à l'API via le proxy configuré
      const response = await fetch(`/api/complaints/${code}`);

      // Si la plainte n'existe pas (404)
      if (response.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Si erreur serveur
      if (!response.ok) {
        throw new Error('Une erreur serveur s\'est produite. Veuillez réessayer plus tard.');
      }

      // Récupération des données
      const res = await response.json();
      // Handle both { success: true, data: {...} } AND the object directly 
      const data = res.data || res;
      
      // Transformation format API -> Composant
      const formattedData = {
        code: data.code || code,
        date: data.created_at,
        updated_at: data.updated_at,
        waste_type: data.waste_type, 
        complaint_type: data.complaint_type,
        localisation: `${data.commune_name || ''}\n${data.address_text || ''}`,
        message: (data.description && data.description !== 'Pas de description') ? data.description : t.follow_up.modal.no_description,
        status: data.status,
        photos: data.photos || [],
        lat: data.gps_parsed?.lat || data.lat,
        lng: data.gps_parsed?.lng || data.lng
      };

      setComplaint(formattedData);
      addToHistory(formattedData.code);
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Une erreur est survenue lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!complaintCode.trim()) {
      setError(t.follow_up.error_empty);
      return;
    }
    searchComplaint(complaintCode.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewDetails = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsMapExpanded(false);
    setExpandedPhoto(null);
  };

  const getStatusClass = (status) => {
    const classes = {
      en_cours: 'status-en-cours',
      en_attente: 'status-en-attente',
      resolue: 'status-resolue',
      annulee: 'status-annulee',
    };
    return classes[status] || '';
  };

  const getStatusText = (status) => {
    return t.follow_up.status[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      


      return date.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
        timeZone: 'Africa/Algiers',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Date error", e);
      return dateString;
    }
  };

  // Helper pour les images (base URL du serveur)
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // On utilise le proxy /uploads pour éviter les erreurs Mixed Content
    return `${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="page-animate" style={{...styles.container, direction: language === 'ar' ? 'rtl' : 'ltr'}}>
      <div style={styles.mainContainer}>
        <h2 style={{...styles.pageTitle, textAlign: language === 'ar' ? 'right' : 'center'}}>{t.nav.follow_up}</h2>

        <div style={styles.searchBar} className="search-container">
          <div style={styles.searchInputWrapper}>
            <span style={{...styles.searchIcon, [language === 'ar' ? 'right' : 'left']: '14px', [language === 'ar' ? 'left' : 'right']: 'auto'}}>🔍</span>
            <input
              type="text"
              style={{
                ...styles.searchInput, 
                paddingLeft: language === 'ar' ? '12px' : '45px', 
                paddingRight: language === 'ar' ? '45px' : '12px',
                textAlign: language === 'ar' ? 'right' : 'left'
              }}
              placeholder={t.follow_up.placeholder}
              value={complaintCode}
              onChange={(e) => setComplaintCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>
          <button
            style={{...styles.searchButton, ...(loading ? styles.buttonDisabled : {})}}
            onClick={handleSearch}
            disabled={loading}
            className="search-button"
          >
            {loading ? t.follow_up.searching : t.follow_up.btn_search}
          </button>
        </div>

        {/* Historique de recherche */}
        {!loading && searchHistory.length > 0 && (
          <div style={{marginBottom: '24px', animation: 'fadeIn 0.5s ease'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
               <h3 style={{fontSize: '14px', color: 'var(--text-light)', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                 {t.follow_up.history_title || (language === 'ar' ? 'سجل البحث' : 'Historique des recherches')}
               </h3>
               <button 
                 onClick={() => setShowClearConfirm(true)}
                 style={{
                   background: 'none', 
                   border: 'none', 
                   color: '#ef4444', 
                   cursor: 'pointer', 
                   fontSize: '13px',
                   fontWeight: '600',
                   padding: '4px 8px',
                   borderRadius: '6px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px'
                 }}
               >
                 🗑️ {t.follow_up.clear_history || (language === 'ar' ? 'مسح السجل' : 'Effacer')}
               </button>
             </div>
             <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
               {searchHistory.map(code => (
                 <button
                   key={code}
                   onClick={() => {
                     setComplaintCode(code);
                     searchComplaint(code);
                   }}
                   style={{
                     padding: '8px 16px',
                     borderRadius: '20px',
                     border: '1px solid var(--border-color)',
                     background: 'var(--card-bg)',
                     cursor: 'pointer',
                     fontSize: '14px',
                     color: 'var(--primary-color)',
                     fontWeight: '600',
                     boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                     transition: 'transform 0.2s',
                   }}
                   onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                   onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                 >
                   <span style={{opacity: 0.5, marginRight: '4px'}}>🕒</span> #{code}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Modal de confirmation suppression historique */}
        {showClearConfirm && (
          <>
            <div style={styles.modalOverlay} onClick={() => setShowClearConfirm(false)}></div>
            <div style={{...styles.modal, width: '90%', maxWidth: '400px', height: 'auto', textAlign: 'center', padding: '0'}}>
              <div style={{padding: '32px 24px'}}>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>🗑️</div>
                <h3 style={{fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-color)'}}>
                  {t.follow_up.confirm_clear_title || (language === 'ar' ? 'تأكيد المسح' : 'Confirmer la suppression')}
                </h3>
                <p style={{fontSize: '15px', color: 'var(--text-light)', marginBottom: '24px', lineHeight: '1.5'}}>
                  {t.follow_up.confirm_clear_msg || (language === 'ar' ? 'هل أنت متأكد من رغبتك في مسح كل سجل البحث؟' : 'Êtes-vous sûr de vouloir effacer tout l\'historique des recherches ?')}
                </p>
                <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    {t.follow_up.no || (language === 'ar' ? 'إلغاء' : 'Annuler')}
                  </button>
                  <button 
                    onClick={clearHistory}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      flex: 1,
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    {t.follow_up.yes || (language === 'ar' ? 'نعم، مسح' : 'Oui, effacer')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Message d'erreur */}
        {error && (
          <div style={styles.errorMessage}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Loader (Skeleton) */}
        {loading && (
          <div style={styles.tableContainer}>
             <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_id}</th>
                    <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_type}</th>
                    <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_loc}</th>
                    <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_msg}</th>
                    <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_status}</th>
                  </tr>
                </thead>
               <tbody>
                  <tr style={styles.tableRow}>
                    <td style={styles.td}>
                      <Skeleton width="100px" height="20px" style={{ marginBottom: '4px' }} variant="text" />
                      <Skeleton width="60px" height="14px" variant="text" />
                    </td>
                    <td style={styles.td}><Skeleton width="80px" height="24px" /></td>
                    <td style={styles.td}><Skeleton width="120px" height="18px" variant="text" /></td>
                    <td style={styles.td}><Skeleton width="200px" height="16px" variant="text" /></td>
                    <td style={styles.td}><Skeleton width="100px" height="28px" /></td>
                  </tr>
               </tbody>
             </table>
          </div>
        )}

        {/* Plainte non trouvée */}
        {notFound && !loading && (
          <div style={styles.notFound}>
            <span style={styles.notFoundIcon}>🔍</span>
            <h3 style={styles.notFoundTitle}>{t.follow_up.not_found_title}</h3>
            <p style={styles.notFoundText}>
              {t.follow_up.not_found_text.replace('{code}', complaintCode)}
            </p>
          </div>
        )}

        {/* Tableau des résultats */}
        {complaint && !loading && (
          <div style={styles.tableContainer}>
            <table style={styles.table} className="results-table">
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_id}</th>
                  <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_type}</th>
                  <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_loc}</th>
                  <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_msg}</th>
                  <th style={{...styles.th, textAlign: language === 'ar' ? 'right' : 'left'}}>{t.follow_up.table.header_status}</th>
                </tr>
              </thead>
              <tbody>
                {/* Calculer les types traduits au rendu pour supporter le changement de langue */}
                {(() => {
                  const translatedType = complaint.waste_type === 'menager' ? t.form.step2.household : t.form.step2.inert;
                  const translatedSubType = (complaint.waste_type === 'menager' && complaint.complaint_type) ? t.form.step2.types[complaint.complaint_type] : null;
                  
                  return (
                    <tr 
                      style={styles.tableRow} 
                      onClick={handleViewDetails}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={styles.td}>
                        <div style={styles.complaintCode}>{complaint.code}</div>
                        <div style={styles.complaintDate}>{formatDate(complaint.date)}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typeBadge}>{translatedType}</span>
                        {translatedSubType && (
                          <div style={{...styles.subText, marginTop: '4px', fontWeight: '600', color: 'var(--primary-color)'}}>
                            {translatedSubType}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        {complaint.localisation.split('\n').map((line, i) => (
                          <div key={i} style={i > 0 ? styles.subText : {}}>{line}</div>
                        ))}
                      </td>
                      <td style={styles.td}>
                        <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {complaint.message}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span className={`status-badge ${getStatusClass(complaint.status)}`}>
                          <span style={styles.statusIcon}>
                            {complaint.status === 'resolue' ? '✓' : 
                             complaint.status === 'en_cours' ? '◷' : 
                             complaint.status === 'en_attente' ? '◷' : '✕'}
                          </span>
                          {getStatusText(complaint.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de détails */}
        {showModal && complaint && (
          <>
            <div style={styles.modalOverlay} onClick={closeModal}></div>
            <div style={{...styles.modal, direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'ar' ? 'right' : 'left'}}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{t.follow_up.modal.title}</h2>
                <button style={styles.closeButton} onClick={closeModal}>✕</button>
              </div>
              
              <div style={styles.modalContent}>
                <div style={styles.modalTop}>
                  <span style={styles.modalCode}>#{complaint.code}</span>
                  <span style={styles.modalDate}>{'\uD83D\uDCC5'} {t.follow_up.modal.last_update} {formatDate(complaint.updated_at || complaint.date)}</span>
                  <span className={`status-badge ${getStatusClass(complaint.status)}`}>
                    {getStatusText(complaint.status)}
                  </span>
                </div>

                <div style={styles.modalBody}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: language === 'ar' ? 'row-reverse' : 'row', 
                    gap: '24px', 
                    flexWrap: 'wrap',
                    marginBottom: '20px',
                    alignItems: 'center'
                  }}>
                    {/* Section Localisation (Map) */}
                    <div style={{ 
                      flex: isMapExpanded ? '1 1 100%' : '1 1 300px', 
                      display: expandedPhoto ? 'none' : 'block',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={styles.modalSection}>
                        <h3 style={{...styles.sectionTitle, textAlign: language === 'ar' ? 'right' : 'left'}}>📍 {t.follow_up.modal.loc}</h3>
                        <div style={{...styles.sectionContent, textAlign: language === 'ar' ? 'right' : 'left'}}>
                          <div style={{ marginBottom: '12px' }}>{complaint.localisation.replace('\n', ', ')}</div>
                          
                            <div 
                              id="map-capture-area"
                              style={{
                                height: isMapExpanded ? '450px' : '200px',
                                width: '100%',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid var(--border-color)',
                                marginBottom: '12px',
                                cursor: isMapExpanded ? 'default' : 'pointer',
                                transition: 'height 0.3s ease-in-out',
                                position: 'relative',
                                zIndex: 0
                              }}
                            >
                            <MapContainer 
                              center={[complaint.lat || 36.374, complaint.lng || 3.902]} 
                              zoom={16} 
                              style={{ height: '100%', width: '100%' }}
                              zoomControl={false}
                              dragging={false}
                              scrollWheelZoom={false}
                              doubleClickZoom={false}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              />
                              <Marker position={[complaint.lat || 36.374, complaint.lng || 3.902]} />
                              <ChangeView center={[complaint.lat || 36.374, complaint.lng || 3.902]} />
                              <MapController isExpanded={isMapExpanded} />
                              
                              {isMapExpanded && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMapExpanded(false);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: language === 'ar' ? '10px' : 'auto',
                                    right: language === 'ar' ? 'auto' : '10px',
                                    zIndex: 1000,
                                    padding: '6px 12px',
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    color: 'var(--text-color)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}
                                >
                                  {language === 'ar' ? "تصغير" : "Réduire"}
                                </button>
                              )}

                                {!isMapExpanded && (
                                  <div 
                                    onClick={() => setIsMapExpanded(true)}
                                    style={{
                                      position: 'absolute',
                                      top: 0, left: 0, right: 0, bottom: 0,
                                      backgroundColor: 'rgba(0,0,0,0.05)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 1000,
                                      color: 'white',
                                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '20px' }}>
                                      {language === 'ar' ? "انقر للتكبير" : "Cliquer pour agrandir"}
                                    </span>
                                  </div>
                                )}
                              </MapContainer>
                            </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Photos */}
                    <div style={{ 
                      flex: expandedPhoto ? '1 1 100%' : '1 1 300px', 
                      display: isMapExpanded ? 'none' : 'block',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={styles.modalSection}>
                        <h3 style={{...styles.sectionTitle, textAlign: language === 'ar' ? 'right' : 'left'}}>📸 {t.follow_up.modal.photos}</h3>
                        {complaint.photos && complaint.photos.length > 0 ? (
                          <div style={{ marginTop: '12px' }}>
                            {expandedPhoto ? (
                              <div id="photo-capture-area" style={{ position: 'relative', height: '450px', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <img 
                                  src={getImageUrl(expandedPhoto.url)} 
                                  alt="Constat Agrandie" 
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                                <button
                                  onClick={() => setExpandedPhoto(null)}
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: language === 'ar' ? '10px' : 'auto',
                                    right: language === 'ar' ? 'auto' : '10px',
                                    zIndex: 1000,
                                    padding: '6px 12px',
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    color: 'var(--text-color)'
                                  }}
                                >
                                  {language === 'ar' ? "تصغير" : "Réduire"}
                                </button>
                                <button
                                  onClick={() => exportAsPNG('photo-capture-area', `photo-signalement-${complaint.code}`)}
                                  style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: language === 'ar' ? 'auto' : '10px',
                                    left: language === 'ar' ? '10px' : 'auto',
                                    zIndex: 1000,
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0,200,83,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  📥 PNG
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                {complaint.photos.map((photo, index) => (
                                  <div 
                                    key={index} 
                                    style={{ 
                                      aspectRatio: '1', 
                                      borderRadius: '8px', 
                                      overflow: 'hidden', 
                                      cursor: 'pointer',
                                      position: 'relative',
                                      border: '1px solid var(--border-color)'
                                    }}
                                    onClick={() => setExpandedPhoto(photo)}
                                  >
                                    <img 
                                      src={getImageUrl(photo.url)} 
                                      alt={`Constat ${index + 1}`} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                      position: 'absolute', 
                                      bottom: 0, left: 0, right: 0, 
                                      backgroundColor: 'rgba(0,0,0,0.5)', 
                                      color: 'white', 
                                      fontSize: '10px', 
                                      textAlign: 'center', 
                                      padding: '2px'
                                    }}>
                                      {language === 'ar' ? "تكبير" : "Agrandir"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={styles.noPhotos}>
                            <span style={styles.photoIcon}>🖼️</span>
                            <p>{t.follow_up.modal.no_photos}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Autres détails (Type & Message) - Masqués si agrandi */}
                  <div style={{ display: (isMapExpanded || expandedPhoto) ? 'none' : 'block' }}>
                    <div style={styles.modalSection}>
                      <h3 style={{...styles.sectionTitle, textAlign: language === 'ar' ? 'right' : 'left'}}>🏷️ {t.follow_up.modal.type}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                        <span style={styles.typeBadge}>{complaint.waste_type === 'menager' ? t.form.step2.household : t.form.step2.inert}</span>
                        {complaint.waste_type === 'menager' && complaint.complaint_type && (
                          <span style={{...styles.typeBadge, backgroundColor: 'rgba(0, 200, 83, 0.1)', color: 'var(--primary-color)', borderColor: 'rgba(0, 200, 83, 0.2)'}}>
                            {t.form.step2.types[complaint.complaint_type]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={styles.modalSection}>
                      <h3 style={{...styles.sectionTitle, textAlign: language === 'ar' ? 'right' : 'left'}}>💬 {t.follow_up.modal.msg}</h3>
                      <p style={{...styles.sectionContent, textAlign: language === 'ar' ? 'right' : 'left'}}>{complaint.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
      .status-en-cours {
        background-color: rgba(37, 99, 235, 0.1);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }
      
      .status-en-attente {
        background-color: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }
      
      .status-resolue {
        background-color: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
      
      .status-annulee {
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
      }

      @keyframes modalSlideUp {
        from { opacity: 0; transform: translate(-50%, -40%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .search-container {
          flex-direction: column !important;
          padding: 16px !important;
        }
        
        .search-button {
          width: 100% !important;
          margin-top: 12px;
        }

        .results-table thead {
          display: none !important;
        }

        .results-table, .results-table tbody, .results-table tr, .results-table td {
          display: block !important;
          width: 100% !important;
        }

        .results-table tr {
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }
        
        .results-table td {
          padding: 8px 0 !important;
          text-align: left !important;
        }

        .results-table td:last-child {
          border-bottom: none;
        }

        /* Modal Responsive */
        .modal-container {
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          border-radius: 0 !important;
        }
      }
    `}</style>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-color)',
    marginBottom: '24px',
    textAlign: 'center'
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    backgroundColor: 'var(--card-bg)',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--border-color)',
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '18px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 45px',
    fontSize: '15px',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-color)',
  },
  searchButton: {
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '700',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 18px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    color: 'var(--danger-color)',
    fontSize: '14px',
    marginBottom: '20px',
  },
  errorIcon: {
    fontSize: '18px',
  },
  loaderContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
  },
  loader: {
    border: '4px solid var(--border-color)',
    borderTop: '4px solid var(--primary-color)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loaderText: {
    color: 'var(--text-light)',
    fontSize: '15px',
    fontWeight: '500'
  },
  notFound: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
  },
  notFoundIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  notFoundTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-color)',
    marginBottom: '10px',
  },
  notFoundText: {
    fontSize: '15px',
    color: 'var(--text-light)',
  },
  notFoundCode: {
    color: 'var(--primary-color)',
    fontWeight: '700',
  },
  tableContainer: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--border-color)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: 'var(--bg-color)',
    borderBottom: '1px solid var(--border-color)',
  },
  th: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
  },
  td: {
    padding: '20px',
    fontSize: '14px',
    color: 'var(--text-color)',
  },
  complaintCode: {
    fontWeight: '800',
    fontSize: '15px',
    color: 'var(--text-color)',
    marginBottom: '4px',
  },
  complaintDate: {
    fontSize: '13px',
    color: 'var(--text-light)',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: 'var(--bg-color)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)'
  },
  subText: {
    fontSize: '12px',
    color: 'var(--text-light)',
  },
  statusIcon: {
    fontSize: '14px',
  },
  eyeButton: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--bg-color)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 9991,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '24px',
    width: '95%',
    maxWidth: '1000px',
    maxHeight: '85vh',
    overflow: 'auto',
    zIndex: 9992,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-color)',
    animation: 'modalSlideUp 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid var(--border-color)',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-color)',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  closeButton: {
    padding: '8px',
    backgroundColor: 'var(--bg-color)',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'var(--text-light)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    padding: '32px',
  },
  modalTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  modalCode: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--primary-color)',
  },
  modalDate: {
    fontSize: '14px',
    color: 'var(--text-light)',
    fontWeight: '500'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  modalSection: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '20px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-color)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sectionContent: {
    fontSize: '15px',
    color: 'var(--text-light)',
    lineHeight: '1.6',
  },
  photosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 140px)',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '12px'
  },
  photoWrapper: {
    aspectRatio: '1/1',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)'
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noPhotos: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'var(--bg-color)',
    borderRadius: '16px',
    border: '2px dashed var(--border-color)',
  },
  photoIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px',
    opacity: 0.3,
  },
};

export default FollowUp;
