import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, Polygon } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { BOUIRA_BOUNDARY } from './bouira-boundary';

// Bouira Bounds for map restriction
const BOUIRA_MAX_BOUNDS = [
    [35.70, 3.10], // South-West
    [36.70, 4.60]  // North-East
];

// Utility to check point in polygon (Ray Casting algo)
function isPointInPolygon(point, vs) {
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

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

// --- IndexedDB for Photo Persistence ---
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NadhifPhotosDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('photos')) {
                db.createObjectStore('photos', { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const savePhotosToDB = async (files) => {
    try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        const clearReq = store.clear();
        clearReq.onsuccess = async () => {
            for (let i = 0; i < files.length; i++) {
                store.add({ id: i, file: files[i] });
            }
        };
    } catch (e) {
        console.error("IndexedDB Save Error", e);
    }
};

const loadPhotosFromDB = async () => {
    try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readonly');
        const store = tx.objectStore('photos');
        return new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result.map(item => item.file));
            req.onerror = () => resolve([]);
        });
    } catch (e) {
        console.error("IndexedDB Load Error", e);
        return [];
    }
};

const clearPhotosFromDB = async () => {
    try {
        const db = await openDB();
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        store.clear();
    } catch (e) {
        console.error("IndexedDB Clear Error", e);
    }
};
// ----------------------------------------

function LocationMarker({ position, setPosition, setStatus, t, onError }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      if (!isPointInPolygon([e.latlng.lat, e.latlng.lng], BOUIRA_BOUNDARY)) {
          if (onError) onError("Veuillez sélectionner une zone à l'intérieur de la wilaya de Bouira.");
          return;
      }
      setPosition(e.latlng);
      setStatus(`${t.form.step1.gps}: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

function ComplaintForm() {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [formData, setFormData] = useState(() => {
        const saved = localStorage.getItem('nadhif_form_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.formData || {
                    adresse: '',
                    waste_type: 'menager',
                    complaint_type: '',
                    comment: ''
                };
            } catch (e) { return { adresse: '', waste_type: 'menager', complaint_type: '', comment: '' }; }
        }
        return {
            adresse: '',
            waste_type: 'menager',
            complaint_type: '',
            comment: ''
        };
    });
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('nadhif_form_draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.position || null;
            } catch (e) { return null; }
        }
        return null;
    });
    const [gpsStatus, setGpsStatus] = useState(t.form.step1.gps);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    const [tempPosition, setTempPosition] = useState(null);
    const [mapFeedback, setMapFeedback] = useState(null); // { message: string, type: 'loading' | 'error' }
    const navigate = useNavigate();

    // -- Persistence Logic --
    // Sync UI with loaded position data on mount
    useEffect(() => {
        if (position && t.form.step1.gps) {
            setGpsStatus(`${t.form.step1.gps}: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`);
        }
    }, [t.form.step1.gps]); // Runs when translations load or mount

    // Load Photos from IndexedDB on mount
    useEffect(() => {
        const initPhotos = async () => {
            const savedPhotos = await loadPhotosFromDB();
            if (savedPhotos && savedPhotos.length > 0) {
                setFiles(savedPhotos);
                const urls = savedPhotos.map(file => URL.createObjectURL(file));
                setPreviews(urls);
            }
        };
        initPhotos();
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        const draft = {
            formData,
            position
        };
        localStorage.setItem('nadhif_form_draft', JSON.stringify(draft));
    }, [formData, position]);

    // Save Photos to IndexedDB whenever they change
    useEffect(() => {
        if (!isCompressing) { // Only save after compression is done
            savePhotosToDB(files);
        }
    }, [files, isCompressing]);

    const clearDraft = () => {
        localStorage.removeItem('nadhif_form_draft');
        clearPhotosFromDB();
    };
    // ------------------------

    const openMap = () => {
        setTempPosition(position);
        setIsMapOpen(true);
    };

    // Prevent body scroll when map is open
    useEffect(() => {
        if (isMapOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMapOpen]);

    const smoothScrollTo = (id) => {
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: focus if it's an input
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.focus({ preventScroll: true }); // preventScroll because scrollIntoView handles it
                }
            }
        }, 100);
    };

    const confirmLocation = () => {
        if (tempPosition) {
            setPosition(tempPosition);
            setGpsStatus(`${t.form.step1.gps}: ${tempPosition.lat.toFixed(5)}, ${tempPosition.lng.toFixed(5)}`);
        }
        setIsMapOpen(false);
        // Scroll to next section
        smoothScrollTo('adresse');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-scroll logic
        if (name === 'waste_type') {
            if (value === 'menager') {
                smoothScrollTo('complaint_type');
            } else {
                smoothScrollTo('comment');
            }
        }
        if (name === 'complaint_type') {
            smoothScrollTo('comment');
        }
    };

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files).slice(0, 5);
        if (selectedFiles.length === 0) return;

        // Revoke old previews
        previews.forEach(url => URL.revokeObjectURL(url));
        
        // Immediate preview
        const initialPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews(initialPreviews);
        setFiles(selectedFiles);

        setIsCompressing(true);
        setProcessingProgress(`0/${selectedFiles.length}`);

        try {
            const processedFiles = [];
            let count = 0;
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: false,
                initialQuality: 0.8
            };

            for (const file of selectedFiles) {
                count++;
                setProcessingProgress(`${count}/${selectedFiles.length}`);
                if (file.size > 2 * 1024 * 1024) {
                   try {
                     const compressed = await imageCompression(file, options);
                     processedFiles.push(new File([compressed], file.name, { type: file.type }));
                   } catch (e) {
                     console.warn('Compression failed, using original', e);
                     processedFiles.push(file);
                   }
                } else {
                    processedFiles.push(file);
                }
            }
            setFiles(processedFiles);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCompressing(false);
            setProcessingProgress("");
        }
    };

    const removePhoto = (index) => {
        const newFiles = [...files];
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
        setFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleLocateMe = () => {
        setGpsStatus(t.form.step1.locating);
        if (!navigator.geolocation) {
            setGpsStatus(t.form.step1.not_supported);
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 // Force fresh GPS data, no cache
        };

        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            
            // If accuracy is worse than 150 meters, it's likely a cell tower or old cache
            if (accuracy > 150) {
                console.warn(`Low accuracy GPS: ${accuracy}m. Trying again...`);
            }

            const newPos = { lat: latitude, lng: longitude };
            setPosition(newPos);
            setGpsStatus(`${t.form.step1.gps}: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${Math.round(accuracy)}m)`);
        }, (err) => {
             console.error("GPS Error:", err);
             setGpsStatus(t.form.step1.gps_error);
        }, options);
    };

    const handleLocateMeInsideMap = () => {
        if (!navigator.geolocation) return;
        
        setMapFeedback({ message: t.form.step1.locating || "Recherche précise...", type: 'loading' });
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 1000 // Allow 1s old data for better reliability on cold starts
        };

        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const latStr = latitude.toFixed(4);
            const lngStr = longitude.toFixed(4);
            const accStr = Math.round(accuracy);
            
            // Check if within Bouira
            if (isPointInPolygon([latitude, longitude], BOUIRA_BOUNDARY)) {
                const newPos = { lat: latitude, lng: longitude };
                setTempPosition(newPos);
                
                // If accuracy is poor, tell the user
                if (accuracy > 150) {
                    setMapFeedback({ 
                        message: language === 'ar' ? `دقة ضعيفة (${accStr}م). يرجى التحقق.` : `Précision faible (${accStr}m). Veuillez vérifier sur la carte.`, 
                        type: 'error' 
                    });
                    setTimeout(() => setMapFeedback(null), 4000);
                } else {
                    setMapFeedback(null);
                }
            } else {
                 setMapFeedback({ 
                    message: language === 'ar' 
                        ? `خارج الحدود: ${latStr}, ${lngStr} (دقة: ${accStr}م)` 
                        : `Hors zone: ${latStr}, ${lngStr} (Précision: ${accStr}m)`, 
                    type: 'error' 
                 });
                 setTimeout(() => setMapFeedback(null), 6000);
            }
        }, (err) => {
             console.error("GPS Error inside map", err);
             let errorMsg = "Erreur de localisation.";
             if (err.code === 1) errorMsg = "Veuillez autoriser le GPS.";
             if (err.code === 3) errorMsg = "Délai d'attente dépassé. Réessayez.";
             
             setMapFeedback({ message: errorMsg, type: 'error' });
             setTimeout(() => setMapFeedback(null), 3000);
        }, options);
    };

    const handleMapError = (msg) => {
        setMapFeedback({ message: msg, type: 'error' });
        setTimeout(() => setMapFeedback(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!position) {
            setAlertConfig({
                title: t.form.step1.gps_error || "Localisation manquante",
                message: "Veuillez indiquer votre position sur la carte en cliquant sur l'endroit concerné.",
                type: 'error'
            });
            setShowAlert(true);
            return;
        }

        setIsSubmitting(true);
        const data = new FormData();

        data.append('adresse', formData.adresse);
        data.append('waste_type', formData.waste_type);
        data.append('complaint_type', formData.complaint_type);
        data.append('comment', formData.comment);
        
        data.append('lat', position.lat);
        data.append('lng', position.lng);
        
        files.forEach(file => data.append('photos', file));

        console.log("📦 --- FormData Debug ---");
        for (let [key, value] of data.entries()) {
             console.log(`${key}:`, value);
        }
        console.log("-----------------------");

        try {
                const API_URL =
                    import.meta.env.VITE_API_URL ||
                    "https://profound-cat-production.up.railway.app";

                const response = await axios.post(
                    `${API_URL}/api/complaints`,
                    data,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
            
            if (response.data.success) {
                setSuccessData(response.data.data);
                setShowSuccessModal(true);
                // Clean reset
                setFormData({
                    adresse: '',
                    waste_type: 'menager',
                    complaint_type: '',
                    comment: ''
                });
                setPosition(null);
                setFiles([]);
                setPreviews([]);
                setGpsStatus(t.form.step1.gps);
                clearDraft();
            } else {
                setAlertConfig({
                    title: "Erreur",
                    message: response.data.message || 'Le serveur a refusé l\'enregistrement.',
                    type: 'error'
                });
                setShowAlert(true);
            }
        } catch (error) {
            console.error("Erreur critique:", error);
            const msg = error.response?.data?.message || "Impossible de contacter le serveur (Erreur 500 ou Réseau).";
            setAlertConfig({
                title: "Erreur de connexion",
                message: msg,
                type: 'error'
            });
            setShowAlert(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setShowResetModal(true);
    };

    const confirmReset = () => {
        setFormData({
            adresse: '',
            waste_type: 'menager',
            complaint_type: '',
            comment: ''
        });
        setPosition(null);
        setFiles([]);
        setPreviews([]);
        setGpsStatus(t.form.step1.gps);
        clearDraft();
        setShowResetModal(false);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        navigate('/');
    };

    const handleCopy = () => {
        if (successData?.code) {
            navigator.clipboard.writeText(successData.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGoToFollowUp = () => {
        setShowSuccessModal(false);
        navigate('/suivi', { state: { code: successData?.code } });
    };

    return (
        <div className="App">
            {/* Full Screen Map Modal - Rendered via Portal with Animations */}
            {createPortal(
                <AnimatePresence>
                    {isMapOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                width: '100vw',
                                height: '100vh',
                                height: '100dvh',
                                zIndex: 999999,
                                backgroundColor: theme === 'dark' ? '#111827' : 'white',
                                overflow: 'hidden',
                                direction: language === 'ar' ? 'rtl' : 'ltr'
                            }}
                        >
                    <MapContainer 
                        center={tempPosition || position || [36.374, 3.902]} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        maxBounds={BOUIRA_MAX_BOUNDS}
                        maxBoundsViscosity={1.0}
                        minZoom={9}
                    >
                        <LayersControl position="topleft">
                            <LayersControl.BaseLayer checked name="Plan">
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; OpenStreetMap"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Satellite">
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                                />
                            </LayersControl.BaseLayer>
                        </LayersControl>
                        
                        <Polygon 
                            positions={BOUIRA_BOUNDARY}
                            pathOptions={{ color: '#EF4444', weight: 2, fillOpacity: 0.05 }}
                        />

                        <LocationMarker 
                            position={tempPosition} 
                            setPosition={setTempPosition} 
                            setStatus={() => {}} 
                            t={t} 
                            onError={handleMapError}
                        />
                    </MapContainer>
                    
                    {/* Header with Close */}
                    <button 
                        onClick={() => setIsMapOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '25px',
                            right: '25px',
                            zIndex: 1000000,
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '45px',
                            height: '45px',
                            fontSize: '22px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </button>

                    {/* Map Feedback Toast */}
                    {mapFeedback && (
                        <div style={{
                            position: 'absolute',
                            top: '110px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1000001,
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white',
                            padding: '16px 28px',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '12px',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            maxWidth: '90%',
                            textAlign: 'center'
                        }}>
                            {mapFeedback.type === 'loading' ? (
                                <>
                                    <div className="spinner-small" style={{ borderColor: 'rgba(255,255,255,0.2)', borderLeftColor: 'white', width: '28px', height: '28px', borderWidth: '3px' }}></div>
                                    <span style={{ fontWeight: '600', fontSize: '16px' }}>{mapFeedback.message}</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '28px' }}>⚠️</span>
                                    <span style={{ fontWeight: '600', fontSize: '16px' }}>{mapFeedback.message}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Confirm Button */}
                    <div className="map-confirm-container" style={{ 
                        pointerEvents: 'none', 
                        zIndex: 1000002,
                        bottom: '25px'
                    }}>
                        <button 
                            onClick={confirmLocation}
                            disabled={!tempPosition}
                            className={`map-btn-confirm ${!tempPosition ? 'disabled' : ''}`}
                            style={{ 
                                pointerEvents: 'auto'
                            }}
                        >
                            {tempPosition ? '✅ Confirmer cette position' : '📍 Veuillez cliquer sur la carte'}
                        </button>
                    </div>
                    


                    {/* Internal Locate Me Button */}
                    <button
                        onClick={handleLocateMeInsideMap}
                        className="map-btn-locate"
                        disabled={mapFeedback?.type === 'loading'}
                        style={{
                            zIndex: 1000002,
                            bottom: '90px'
                        }}
                    >
                        {mapFeedback?.type === 'loading' ? (
                            <>
                                <span className="spinner-small"></span>
                                {t.form.step1.locating || "Recherche..."}
                            </>
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                                </svg>
                                {t.form.step1.locate_btn}
                            </>
                        )}
                    </button>
                </motion.div>
            )}
            </AnimatePresence>,
            document.body
        )}

            <main className="container page-animate">
                <div className="form-card">
                    <div className="form-header">
                        <h2>{t.form.title}</h2>
                        <p>{t.form.subtitle}</p>
                        <p className="mandatory-legend" style={{ color: '#EF4444', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '500' }}>
                           {t.form.mandatory_legend}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 1. Localisation */}
                        <div className="form-section">
                            <h3><span className="step-icon">1</span> {t.form.step1.title}</h3>
                            
                            <div className="form-group">
                            <label>
                                {t.form.step1.gps} <span className="required">*</span>
                                <br/>
                                <span className="gps-instruction" style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 'normal' }}>
                                    {t.form.step1.gps_instruction}
                                </span>
                            </label>
                            <div className="status-text" style={{ 
                                    marginBottom: '10px', 
                                    textAlign: 'center', 
                                    fontWeight: '500', 
                                    color: gpsStatus.includes(':') ? '#00C853' : '#6B7280' 
                                }}>
                                    {gpsStatus}
                                </div>
                                <div className="map-container" style={{ position: 'relative' }}>
                                    {/* Overlay: Afficher texte seulement si aucune position n'est définie. Si définie, transparent mais cliquable. */}
                                    <div 
                                        onClick={openMap}
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            zIndex: 10,
                                            cursor: 'pointer',
                                            backgroundColor: position ? 'transparent' : 'rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background-color 0.3s'
                                        }}
                                        title={position ? "Cliquez pour modifier la position" : "Cliquez pour définir la position"}
                                    >
                                        {!position && (
                                            <span style={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                color: '#1f2937'
                                            }}>
                                                📍 {t.form.step1.complaint_pos || "Position de la plainte"}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <MapContainer 
                                        center={[36.374, 3.902]} 
                                        zoom={13} 
                                        style={{ height: '300px', zIndex: 0 }} 
                                        zoomControl={false} 
                                        dragging={false} 
                                        scrollWheelZoom={false} 
                                        doubleClickZoom={false}
                                        maxBounds={BOUIRA_MAX_BOUNDS}
                                        maxBoundsViscosity={1.0}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution="&copy; OpenStreetMap"
                                        />
                                        <LocationMarker position={position} setPosition={setPosition} setStatus={setGpsStatus} t={t} />
                                    </MapContainer>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="adresse">{t.form.step1.address}</label>
                                <input 
                                    type="text" 
                                    id="adresse" 
                                    name="adresse" 
                                    value={formData.adresse} 
                                    onChange={handleInputChange} 
                                    placeholder={t.form.step1.address_ph} 
                                    onBlur={() => { if(formData.adresse) smoothScrollTo('step2-section') }}
                                />
                            </div>
                        </div>

                        {/* 2. Type */}
                        <div className="form-section" id="step2-section">
                            <h3><span className="step-icon">2</span> {t.form.step2.title}</h3>
                            <div className="form-group">
                                <label>{t.form.step2.waste_type} <span className="required">*</span></label>
                                <div className="radio-grid">
                                    <label className="radio-card">
                                        <input 
                                            type="radio" 
                                            name="waste_type" 
                                            value="menager" 
                                            checked={formData.waste_type === 'menager'}
                                            onChange={handleInputChange} 
                                        />
                                        <div className="radio-content">
                                            <span className="emoji">🗑️</span>
                                            <span className="label">{t.form.step2.household}</span>
                                        </div>
                                    </label>
                                    <label className="radio-card">
                                        <input 
                                            type="radio" 
                                            name="waste_type" 
                                            value="inerte" 
                                            checked={formData.waste_type === 'inerte'}
                                            onChange={handleInputChange} 
                                        />
                                        <div className="radio-content">
                                            <span className="emoji">🧱</span>
                                            <span className="label">{t.form.step2.inert}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {formData.waste_type === 'menager' && (
                                <div className="form-group" id="complaint-type-group">
                                    <label htmlFor="complaint_type">{t.form.step2.complaint_type} <span className="required">*</span></label>
                                    <select id="complaint_type" name="complaint_type" value={formData.complaint_type} onChange={handleInputChange} required>
                                        <option value="" disabled hidden>{t.form.step2.select_type}</option>
                                        <option value="absence_bac">{t.form.step2.types.absence_bac}</option>
                                        <option value="surplus_poubelles">{t.form.step2.types.surplus_poubelles}</option>
                                        <option value="negligence">{t.form.step2.types.negligence}</option>
                                        <option value="decharge_sauvage">{t.form.step2.types.decharge_sauvage}</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group" id="comment-group">
                                <label htmlFor="comment">{t.form.step2.comment}</label>
                                <textarea 
                                    id="comment" 
                                    name="comment" 
                                    rows="3" 
                                    maxLength="500" 
                                    value={formData.comment} 
                                    onChange={handleInputChange} 
                                    placeholder={t.form.step2.comment_ph}
                                    onBlur={() => smoothScrollTo('step3-section')}
                                ></textarea>
                            </div>
                        </div>

                        {/* 3. Photos */}
                        <div className="form-section" id="step3-section">
                            <h3><span className="step-icon">3</span> {t.form.step3.title}</h3>
                            <div className="form-group">
                                <label>{t.form.step3.label}</label>
                                <div className="file-upload-area">
                                    <input type="file" onChange={handleFileChange} multiple accept="image/*,.heic,.heif" className="file-input" />
                                    <div className="upload-content">
                                        <p>{t.form.step3.drop}</p>
                                    </div>
                                </div>
                                <div className="preview-grid">
                                    {previews.map((src, idx) => (
                                        <div key={idx} className="preview-item">
                                            <img src={src} alt="Preview" className="preview-img" />
                                            <button type="button" className="remove-btn" onClick={() => removePhoto(idx)}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                type="submit" 
                                className="btn-primary" 
                                style={{ 
                                    flex: 2, 
                                    opacity: (!position || (formData.waste_type === 'menager' && !formData.complaint_type)) ? 0.5 : 1,
                                    cursor: (!position || (formData.waste_type === 'menager' && !formData.complaint_type)) ? 'not-allowed' : 'pointer',
                                    filter: (!position || (formData.waste_type === 'menager' && !formData.complaint_type)) ? 'grayscale(100%)' : 'none'
                                }} 
                                disabled={isSubmitting || isCompressing || !position || (formData.waste_type === 'menager' && !formData.complaint_type)}
                            >
                                {isCompressing 
                                    ? `Traitement...` 
                                    : (isSubmitting ? t.form.sending : t.form.btn_submit)
                                }
                            </button>
                            <button 
                                type="button" 
                                onClick={handleReset} 
                                className="btn-secondary" 
                                style={{ 
                                    flex: 1, 
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                    border: '2px solid #EF4444', 
                                    color: '#EF4444',
                                    fontWeight: '600'
                                }}
                                disabled={isSubmitting || isCompressing}
                            >
                                🗑️ {t.form.btn_reset}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {showSuccessModal && createPortal(
                <div className="modal-overlay">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content success-modal"
                    >
                        <div className="modal-icon">✅</div>
                        <h2>{t.form.success_title || "Signalement Envoyé !"}</h2>
                        <p>{t.form.success_msg || "Votre signalement a été enregistré avec succès."}</p>
                        <div className="code-box">
                            <span>{t.form.success_hint}</span>
                            <div className="code-display">
                                <strong>{successData?.code}</strong>
                                <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                                    {copied ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    )}
                                    <span>{copied ? t.form.copied : t.form.copy}</span>
                                </button>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleGoToFollowUp} className="btn-primary">
                                {t.form.btn_follow}
                            </button>
                            <button onClick={handleModalClose} className="btn-secondary">
                                {t.nav.home}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Alert Modal */}
            {showAlert && createPortal(
                <div className="modal-overlay">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content alert-modal"
                    >
                        <div className="modal-icon" style={{ 
                            color: alertConfig.type === 'error' ? '#EF4444' : '#10B981',
                            fontSize: '4rem',
                            marginBottom: '1rem'
                        }}>
                            {alertConfig.type === 'error' ? '⚠️' : '✅'}
                        </div>
                        <h2 style={{ marginBottom: '1rem' }}>{alertConfig.title}</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>{alertConfig.message}</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowAlert(false)} className="btn-primary" style={{ 
                                background: alertConfig.type === 'error' ? '#EF4444' : 'var(--primary-color)',
                                width: '100%',
                                padding: '12px',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}>
                                OK
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
            
            {/* Reset Confirmation Modal */}
            {showResetModal && createPortal(
                <div className="modal-overlay">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modal-content alert-modal" 
                        style={{ maxWidth: '400px' }}
                    >
                        <div className="modal-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗑️</div>
                        <h2 style={{ marginBottom: '1rem' }}>{t.form.btn_reset}</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '2rem', textAlign: 'center' }}>
                            {t.form.reset_confirm}
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button 
                                onClick={confirmReset} 
                                className="btn-primary" 
                                style={{ background: '#EF4444', flex: 1, padding: '12px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {t.follow_up.modal.yes}
                            </button>
                            <button 
                                onClick={() => setShowResetModal(false)} 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {t.follow_up.modal.no}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );


}

export default ComplaintForm;
