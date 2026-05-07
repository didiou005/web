
import React, { useState, useEffect } from 'react';
import { Filter, Search, ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { complaintsService, regionsService } from '../../services/api';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import { toast } from 'react-hot-toast';
import Skeleton from '../../components/common/Skeleton';
import { MapContainer, TileLayer, Marker, CircleMarker, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
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
L.Marker.prototype.options.icon = DefaultIcon;

const pinSvg = `
<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#2563eb" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="3" fill="white"/>
  </svg>
</div>
`;

const exportIcon = L.divIcon({
    html: pinSvg,
    className: 'custom-export-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const MapAutoFit = ({ markers }) => {
    const map = useMap();
    React.useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }, [markers, map]);
    return null;
};

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [exportDates, setExportDates] = useState({ from: '', to: '' });
  const [includeMap, setIncludeMap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMarkers, setExportMarkers] = useState([]);
  
  const [filters, setFilters] = useState({
    status: 'all',
    regionId: 'all',
    wasteType: 'all',
    search: ''
  });

  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState({ field: 'created_at', order: 'desc' });

  const loadRegions = async () => {
    try {
        const res = await regionsService.getAll();
        if (res.success) setRegions(res.data);
    } catch (e) {
        console.error('Error loading regions', e);
    }
  };

  const [counts, setCounts] = useState({ total: 0, en_attente: 0, en_cours: 0, resolue: 0 });

  const loadComplaints = async () => {
    setLoading(true);
    try {
        const res = await complaintsService.getAll({
            page: pagination.page,
            limit: pagination.limit,
            sortBy: sort.field,
            order: sort.order,
            ...filters
        });
        
        if (res.success) {
            setComplaints(res.data);
            setPagination(res.pagination);
            if (res.counts) setCounts(res.counts);
        }
    } catch (e) {
        console.error('Error loading complaints', e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [filters, pagination.page, sort]);

  const handleSort = (field) => {
    setSort(prev => ({
        field,
        order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
        setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Export Date Range
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    try {
        setIsExporting(true);
        const exportFilters = {
            ...filters,
            dateFrom: exportDates.from,
            dateTo: exportDates.to
        };
        
        // 1. Export Excel
        const response = await complaintsService.exportExcel(exportFilters);
        const excelBlob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `signalements_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        // 2. Fetch Markers for PNG Map
        if (includeMap) {
            const markersRes = await complaintsService.getAll({ 
                ...exportFilters, 
                limit: 2000 // Get all relevant markers
            });
            if (markersRes.success) {
                setExportMarkers(markersRes.data);
            }

            // Wait for map to render new markers and all tiles to load
            setTimeout(async () => {
                const mapElement = document.getElementById('export-map-capture');
                if (mapElement) {
                    const canvas = await html2canvas(mapElement, {
                        useCORS: true,
                        allowTaint: true,
                        scale: 3,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });
                    const image = canvas.toDataURL("image/png", 1.0);
                    const pngLink = document.createElement('a');
                    pngLink.href = image;
                    pngLink.download = `carte_bouira_${new Date().toISOString().split('T')[0]}.png`;
                    pngLink.click();
                }
                setShowExportModal(false);
                setIsExporting(false);
                setExportMarkers([]);
            }, 3500); // 3.5 seconds
        } else {
            setShowExportModal(false);
            setIsExporting(false);
        }
        
        toast.success('Export terminé avec succès');
    } catch (e) {
        console.error('Export error', e);
        toast.error('Erreur lors de l’exportation');
        setIsExporting(false);
    }
  };

  const openDetails = (id) => {
    console.log('Opening details for:', id);
    setSelectedComplaintId(id);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styleBase = { padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'inline-flex', alignItems: 'center', gap: '6px' };
    
    switch(status) {
        case 'resolue': 
            return <span style={{ ...styleBase, backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #10B98133' }}><CheckCircle size={14} /> Résolue</span>;
        case 'en_cours': 
            return <span style={{ ...styleBase, backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #3B82F633' }}><Clock size={14} /> En cours</span>;
        default: 
            return <span style={{ ...styleBase, backgroundColor: '#FFF7ED', color: '#EA580C', border: '1px solid #F9731633' }}><AlertCircle size={14} /> En attente</span>;
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', fontFamily: '"Inter", sans-serif', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Header & Stats Container */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <div>
             <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.025em' }}>
               Gestion des Plaintes
             </h1>
             <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
               Suivez et gérez les signalements citoyens en temps réel.
             </p>
           </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleExportClick}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  background: 'linear-gradient(135deg, var(--green-primary), #15803d)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: 'white', 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.2)';
                }}
              >
                <Download size={18} /> Exporter Excel
              </button>
              <button 
                onClick={loadComplaints}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  color: 'var(--text-primary)', 
                  fontWeight: '600', 
                  fontSize: '14px', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              >
                <Filter size={18} /> Rafraîchir
              </button>
            </div>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { label: 'Total Signalements', value: counts.total, color: 'var(--gray-100)', textColor: 'var(--text-primary)', icon: <Filter size={20} /> },
            { label: 'En Attente', value: counts.en_attente, color: '#FFF7ED', textColor: '#C2410C', icon: <AlertCircle size={20} />, darkColor: '#431407', darkText: '#FFEDD5' },
            { label: 'En Cours', value: counts.en_cours, color: '#EFF6FF', textColor: '#1D4ED8', icon: <Clock size={20} />, darkColor: '#172554', darkText: '#DBEAFE' },
            { label: 'Résolues', value: counts.resolue, color: '#ECFDF5', textColor: '#047857', icon: <CheckCircle size={20} />, darkColor: '#064e3b', darkText: '#D1FAE5' }
          ].map((stat, i) => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return (
              <div key={i} style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: isDark && stat.darkColor ? stat.darkColor : stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark && stat.darkText ? stat.darkText : stat.textColor }}>
                    {stat.icon}
                </div>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>{stat.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{stat.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        
        {/* Filters Top Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', backgroundColor: 'var(--gray-50)' }}>
           <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                  type="text" 
                  placeholder="Rechercher par code ou description..." 
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
           </div>

           <div style={{ display: 'flex', gap: '12px' }}>
             <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
             >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="resolue">Résolue</option>
             </select>

             <select 
                value={filters.regionId}
                onChange={(e) => handleFilterChange('regionId', e.target.value)}
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
             >
                <option value="all">Toutes les régions</option>
                {regions.map(r => <option key={r.id} value={r.id} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{r.name}</option>)}
             </select>

             <select 
                value={filters.wasteType}
                onChange={(e) => handleFilterChange('wasteType', e.target.value)}
                style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
             >
                <option value="all">Déchets: Tous</option>
                <option value="menager">Ménager</option>
                <option value="inerte">Inerte</option>
             </select>
           </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--gray-50)', borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                        <th onClick={() => handleSort('created_at')} style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Plainte / Date {sort.field === 'created_at' && (sort.order === 'asc' ? '↑' : '↓')}
                            </div>
                        </th>
                        <th onClick={() => handleSort('type')} style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Type {sort.field === 'type' && (sort.order === 'asc' ? '↑' : '↓')}
                            </div>
                        </th>
                        <th onClick={() => handleSort('commune')} style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Localisation {sort.field === 'commune' && (sort.order === 'asc' ? '↑' : '↓')}
                            </div>
                        </th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>Message</th>
                        <th onClick={() => handleSort('status')} style={{ padding: '16px 24px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                État {sort.field === 'status' && (sort.order === 'asc' ? '↑' : '↓')}
                            </div>
                        </th>
                        <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <Skeleton variant="text" width="100px" height="20px" style={{ marginBottom: '4px' }} />
                                    <Skeleton variant="text" width="60px" height="14px" />
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <Skeleton width="80px" height="24px" />
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <Skeleton variant="text" width="120px" height="18px" style={{ marginBottom: '4px' }} />
                                    <Skeleton variant="text" width="80px" height="14px" />
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <Skeleton variant="text" width="200px" height="16px" />
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <Skeleton width="100px" height="28px" />
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <Skeleton variant="circle" width="32px" height="32px" style={{ marginLeft: 'auto' }} />
                                </td>
                            </tr>
                        ))
                    ) : complaints.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                             Aucun signalement ne correspond à vos critères.
                        </td></tr>
                    ) : (
                        complaints.map((item, idx) => (
                            <tr 
                                key={item.id} 
                                onClick={() => openDetails(item.id)}
                                style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            >
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.code || '---'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString().slice(0,5)}</div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ backgroundColor: 'var(--gray-100)', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                        {item.display_type || 'Général'}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.commune_name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.region_name}</div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                                        {item.description || "Pas de description"}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    {getStatusBadge(item.status)}
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                                        <Eye size={16} />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer: Pagination */ }
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--gray-50)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Affichage de <strong>{complaints.length}</strong> sur <strong>{pagination.total}</strong> plaintes
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: pagination.page === 1 ? 'var(--gray-50)' : 'var(--bg-secondary)', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', color: pagination.page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <ChevronLeft size={18} /> Précédent
                </button>
                <button 
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: pagination.page >= pagination.pages ? 'var(--gray-50)' : 'var(--bg-secondary)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', color: pagination.page >= pagination.pages ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    Suivant <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>

      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>Exporter les données</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>Sélectionnez une période pour filtrer l'export (laisser vide pour tout exporter).</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Date de début</label>
                <input 
                  type="date" 
                  value={exportDates.from}
                  onChange={(e) => setExportDates({...exportDates, from: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                />
              </div>
              <div>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Date de fin</label>
                 <input 
                  type="date" 
                  value={exportDates.to}
                  onChange={(e) => setExportDates({...exportDates, to: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="includeMap"
                  checked={includeMap} 
                  onChange={(e) => setIncludeMap(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="includeMap" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Inclure la carte de Bouira (PNG)
                </label>
              </div>

              {includeMap && (
                <div style={{ marginTop: '8px' }}>
                   <div id="export-map-capture" style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <MapContainer 
                        center={[36.374, 3.902]} 
                        zoom={11} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        preferCanvas={true}
                      >
                        <TileLayer 
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap'
                        />
                        {(exportMarkers.length > 0 ? exportMarkers : complaints).filter(c => c.gps_location).map(c => {
                            const [lat, lng] = c.gps_location.split(',').map(Number);
                            return (
                                <CircleMarker 
                                    key={c.id} 
                                    center={[lat, lng]} 
                                    radius={8}
                                    fillColor="#2563eb"
                                    color="white"
                                    weight={2}
                                    opacity={1}
                                    fillOpacity={0.8}
                                />
                            );
                        })}
                        <MapAutoFit markers={(exportMarkers.length > 0 ? exportMarkers : complaints).filter(c => c.gps_location).map(c => {
                            const [lat, lng] = c.gps_location.split(',').map(Number);
                            return { lat, lng };
                        })} />
                      </MapContainer>
                   </div>
                   <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                     * La carte affichera les {complaints.length} signalements de la liste actuelle.
                   </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
                style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', opacity: isExporting ? 0.5 : 1 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Annuler
              </button>
              <button 
                onClick={confirmExport}
                disabled={isExporting}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: isExporting ? '#94a3b8' : 'linear-gradient(135deg, var(--green-primary), #15803d)', 
                  color: 'white', 
                  fontWeight: '600', 
                  cursor: isExporting ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Download size={18} /> Exporter
              </button>
            </div>
          </div>
        </div>
      )}

      <ComplaintDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        complaintId={selectedComplaintId}
        onUpdate={loadComplaints}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Complaints;
