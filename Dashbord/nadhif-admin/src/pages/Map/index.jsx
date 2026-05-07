// src/pages/Map/index.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Filter, Map as MapIcon, RefreshCw, AlertCircle, Layers, Download } from 'lucide-react';
import { regionsService, complaintsService } from '../../services/api';
import ComplaintDetailsModal from '../Complaints/ComplaintDetailsModal';

// Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Heatmap component using leaflet.heat
import 'leaflet.heat';

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Convert points to [lat, lng, intensity]
    const heatData = points.map(p => [
      p.lat, 
      p.lng, 
      p.intensity || 0.6
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 35, // Larger radius for a smoother glow
      blur: 20,   // More blur for Snapchat feel
      maxZoom: 16,
      max: 1.0,
      gradient: {
        0.1: '#a5f3fc', // Very light cyan (outer glow)
        0.3: '#22d3ee', // Cyan
        0.5: '#4ade80', // Green
        0.7: '#facc15', // Yellow
        0.9: '#fb923c', // Orange
        1.0: '#f87171'  // Vibrant Red (center)
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const MapPage = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [regionsData, setRegionsData] = useState([]);
  
  // Default Center: Ville de Bouira (Center of Algeria transition)
  const DEFAULT_CENTER = [36.3748, 3.8969]; 
  const DEFAULT_ZOOM = 13;

  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  const [filters, setFilters] = useState({
    regionId: '',
    status: 'all', 
    viewMode: 'heatmap' 
  });

  const [mapType, setMapType] = useState('plan'); // 'plan' or 'satellite'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    loadRegions();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    if (filters.viewMode === 'markers') {
        loadComplaints();
    } else if (filters.viewMode === 'heatmap') {
        loadHeatmap();
    } else if (filters.viewMode === 'regions') {
        // Overlay signals and heatmap in regions mode
        loadComplaints();
        loadHeatmap();
        loadRegionsMapData();
    }
  }, [filters]);

  const loadRegions = async () => {
    try {
      const response = await regionsService.getAll();
      if (response.success) {
        setRegions(response.data);
      }
    } catch (err) {
      console.error('Failed to load regions', err);
    }
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintsService.getComplaintsCoords({
        regionId: filters.regionId,
        status: filters.status
      });
      
      if (response.success && Array.isArray(response.data)) {
        setComplaints(response.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Failed to load complaints map data', err);
      setComplaints([]); 
    } finally {
      setLoading(false);
    }
  };

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const response = await complaintsService.getHeatmapData();
      if (response.success && Array.isArray(response.data)) {
        setHeatmapData(response.data);
      }
    } catch (err) {
      console.error('Failed to load heatmap data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegionsMapData = async () => {
    setLoading(true);
    try {
        const response = await regionsService.getMapData();
        if (response.success) {
            setRegionsData(response.data);
        }
    } catch (err) {
        console.error('Failed to load regions map data', err);
    } finally {
        setLoading(false);
    }
  };

  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setFilters(prev => ({ ...prev, regionId }));

    if (!regionId) {
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(DEFAULT_ZOOM);
    } else {
        const reg = regions.find(r => r.id === regionId);
        if (reg) {
            // Some regions might have coords in the DB, if not use defaults or search
            // For now, if we have many complaints in that region, it would be better to zoom to them
            // But we'll just check if reg object has center
            if (reg.center_lat && reg.center_lng) {
                setMapCenter([reg.center_lat, reg.center_lng]);
                setMapZoom(12);
            }
        }
    }
  };

  const refreshMap = () => {
    if (filters.viewMode === 'markers') loadComplaints();
    else if (filters.viewMode === 'heatmap') loadHeatmap();
    else {
        loadComplaints();
        loadHeatmap();
        loadRegionsMapData();
    }
  };

  const openDetails = (id) => {
    setSelectedComplaint(id);
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await complaintsService.exportExcel({
        status: filters.status,
        regionId: filters.regionId,
        viewMode: filters.viewMode
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `signalements_carte_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Top Bar Controls */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        zIndex: 500,
        boxShadow: 'var(--shadow-sm)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <MapIcon size={24} color="var(--green-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.025em' }}>Carte Interactive</h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Suivi géographique des signalements</p>
          </div>
        </div>

        <div style={{ height: '40px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 10px' }}></div>

        {/* Improved Mode Toggle */}
        <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg-primary)', 
            padding: '6px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <button 
                onClick={() => setFilters(prev => ({ ...prev, viewMode: 'markers' }))}
                style={{
                    padding: '8px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: filters.viewMode === 'markers' ? 'var(--green-primary)' : 'transparent',
                    color: filters.viewMode === 'markers' ? 'white' : 'var(--text-secondary)',
                    boxShadow: filters.viewMode === 'markers' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
            >
                Signalements
            </button>
            <button 
                onClick={() => setFilters(prev => ({ ...prev, viewMode: 'heatmap' }))}
                style={{
                    padding: '8px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: filters.viewMode === 'heatmap' ? 'var(--green-primary)' : 'transparent',
                    color: filters.viewMode === 'heatmap' ? 'white' : 'var(--text-secondary)',
                    boxShadow: filters.viewMode === 'heatmap' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
            >
                Heatmap 🔥
            </button>
        </div>

        {/* Separated Regions View Toggle */}
        <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg-primary)', 
            padding: '6px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <button 
                onClick={() => setFilters(prev => ({ ...prev, viewMode: 'regions' }))}
                style={{
                    padding: '8px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: filters.viewMode === 'regions' ? '#6366f1' : 'transparent', // Use a different indigo color for regions
                    color: filters.viewMode === 'regions' ? 'white' : 'var(--text-secondary)',
                    boxShadow: filters.viewMode === 'regions' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <Layers size={18} />
                Zones & Équipes
            </button>
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>

        {/* Map Type Toggle */}
        <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--bg-primary)', 
            padding: '4px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)' 
        }}>
            <button 
                onClick={() => setMapType('plan')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: mapType === 'plan' ? 'var(--text-primary)' : 'transparent',
                    color: mapType === 'plan' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
            >
                Plan
            </button>
            <button 
                onClick={() => setMapType('satellite')}
                style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: mapType === 'satellite' ? 'var(--text-primary)' : 'transparent',
                    color: mapType === 'satellite' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
            >
                Satellite
            </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <select 
                style={{
                  padding: '12px 20px 12px 48px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  outline: 'none',
                  minWidth: '220px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  appearance: 'none',
                  transition: 'all 0.2s'
                }}
                value={filters.regionId}
                onChange={handleRegionChange}
              >
                <option value="">Toutes les régions</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Filter size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--green-primary)' }} />
            </div>



            <button 
                onClick={refreshMap} 
                style={{
                  width: '44px',
                  height: '44px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-primary)'; e.currentTarget.style.color = 'var(--green-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                <RefreshCw size={20} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
        </div>
      </div>

      {/* Map Content View */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, margin: '24px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)' }}>
          
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
          >
            <TileLayer
              attribution={mapType === 'satellite' ? '&copy; Esri' : '&copy; CartoDB'}
              url={mapType === 'satellite' 
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
            />
            
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {/* Heatmap Layer - Shown in 'heatmap' or 'regions' view */}
            {(filters.viewMode === 'heatmap' || filters.viewMode === 'regions') && (
                <HeatLayer points={heatmapData} />
            )}

            {/* Markers Layer - Shown ONLY in 'markers' view mode */}
            {filters.viewMode === 'markers' && (
                complaints.map(point => (
                    <Marker 
                      key={point.id} 
                      position={[point.lat, point.lng]}
                    >
                      <Popup className="premium-popup">
                        <div style={{ minWidth: '240px', padding: '12px', fontFamily: '"Inter", sans-serif' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                 <span style={{
                                     fontSize: '10px', 
                                     fontWeight: '900', 
                                     padding: '5px 12px', 
                                     borderRadius: '10px',
                                     backgroundColor: point.status === 'resolue' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                     color: point.status === 'resolue' ? '#059669' : '#dc2626',
                                     letterSpacing: '0.08em',
                                     textTransform: 'uppercase'
                                 }}>
                                     {point.status === 'resolue' ? 'RÉSOLU' : 'EN ATTENTE'}
                                 </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px', color: '#64748b', lineHeight: '1.4', marginBottom: '16px' }}>
                                <span style={{ fontWeight: '700' }}>Plainte:</span> 
                                <span style={{ fontWeight: '800', color: 'var(--green-primary)' }}>{point.code || point.id.split('-')[0]}</span>
                                
                                <span style={{ fontWeight: '700' }}>Région:</span> 
                                <span style={{ color: '#1e293b', fontWeight: '600' }}>{point.region_name || '---'}</span>
                                
                                <span style={{ fontWeight: '700' }}>Équipe:</span> 
                                <span style={{ color: '#1e293b', fontWeight: '600' }}>{point.team_name || '---'}</span>
                                
                                <span style={{ fontWeight: '700' }}>Dépôt:</span> 
                                <span style={{ color: '#1e293b', fontWeight: '600' }}>{new Date(point.created_at).toLocaleDateString()}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                <button 
                                    onClick={() => openDetails(point.id)}
                                    style={{ border: 'none', background: 'var(--green-primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                >
                                    Consulter Détails
                                </button>
                            </div>
                        </div>
                      </Popup>
                    </Marker>
                ))
            )}

            {/* Regions Polygons Layer - Only in 'regions' view */}
            {filters.viewMode === 'regions' && regionsData.map(region => (
                <GeoJSON 
                    key={region.id}
                    data={region.geometry}
                    style={{
                        fillColor: region.color_hex || 'var(--green-primary)',
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        fillOpacity: 0.15
                    }}
                    eventHandlers={{
                        mouseover: (e) => {
                            const layer = e.target;
                            layer.setStyle({ fillOpacity: 0.4 });
                        },
                        mouseout: (e) => {
                            const layer = e.target;
                            layer.setStyle({ fillOpacity: 0.15 });
                        }
                    }}
                >
                    <Popup className="premium-popup">
                        <div style={{ minWidth: '220px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: region.color_hex || 'var(--green-primary)' }}></div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>{region.name}</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Équipe Assignée</div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{region.team_name}</div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '2px' }}>Plaintes Actives</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--green-primary)' }}>{region.active_complaints}</div>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </GeoJSON>
            ))}
          </MapContainer>

          {/* Floating Stats Label */}
          <div style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '12px 20px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 500,
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
          }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {filters.viewMode === 'markers' ? 'Signalements Actifs' : 'Densité de Signalements'}
              </span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--green-primary)' }}>
                {filters.viewMode === 'markers' ? complaints.length : heatmapData.length}
              </span>
          </div>

          {/* Heatmap Legend - Only for heatmap */}
          {filters.viewMode === 'heatmap' && (
              <div style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: '24px',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 500,
                  border: '1px solid var(--border-color)',
                  width: '180px'
              }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>Intensité</div>
                  <div style={{ height: '8px', width: '100%', borderRadius: '4px', background: 'linear-gradient(to right, #a5f3fc, #22d3ee, #4ade80, #facc15, #fb923c, #f87171)', marginBottom: '8px' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                      <span>Bas</span>
                      <span>Élevé</span>
                  </div>
              </div>
          )}

          {/* Progress Indicator */}
          {loading && (
              <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--bg-secondary)', padding: '12px 24px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', zIndex: 500, display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)' }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--green-primary)' }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '14px' }}>Mise à jour des données...</span>
              </div>
          )}
          
      </div>

      <style>{`
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .premium-popup .leaflet-popup-content-wrapper {
            border-radius: 24px !important;
            padding: 0 !important;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2) !important;
            border: 1px solid #f1f5f9;
        }
        .premium-popup .leaflet-popup-content {
            margin: 0 !important;
        }
        .premium-popup .leaflet-popup-tip-container {
            display: none;
        }
        .leaflet-container {
            font-family: 'Inter', sans-serif !important;
        }
      `}</style>
      <ComplaintDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        complaintId={selectedComplaint}
        onUpdate={refreshMap}
      />
    </div>
  );
};

export default MapPage;
