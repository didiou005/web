// src/pages/Logs/index.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Shield, 
  User, 
  FileText, 
  MapPin, 
  Users, 
  AlertCircle,
  Database,
  Calendar,
  Download,
  ChevronLeft, 
  ChevronRight,
  Clock,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { logsService } from '../../services/api';
import toast from 'react-hot-toast';

import { Navigate } from 'react-router-dom';

const LogsPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    type: 'all',
    entity: 'all',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.type, filters.entity, filters.startDate, filters.endDate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await logsService.getLogs(filters); 
      if (res.success) {
        setLogs(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Erreur logs:', error);
      toast.error('Impossible de charger les logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const getActionConfig = (type) => {
    const configs = {
      CREATE: { color: 'var(--green-primary)', bg: 'rgba(22, 163, 74, 0.1)', label: 'Création' },
      UPDATE: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Modification' },
      DELETE: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Suppression' },
      LOGIN:  { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Connexion' },
      EXPORT: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Export' },
      INFO:   { color: 'var(--text-secondary)', bg: 'var(--bg-primary)', label: 'Info' }
    };
    return configs[type] || configs.INFO;
  };

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'COMPLAINT': return <AlertCircle size={14} color="#f97316" />;
      case 'REGION': return <MapPin size={14} color="var(--green-primary)" />;
      case 'TEAM': return <Users size={14} color="#3b82f6" />;
      case 'ADMIN': return <Shield size={14} color="#8b5cf6" />;
      case 'EMPLOYEE': return <User size={14} color="#06b6d4" />;
      default: return <Database size={14} color="var(--text-secondary)" />;
    }
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="var(--green-primary)" />
          Journal d'Activités
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Surveillance et audit des événements système en temps réel
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Rechercher (ID, Email, Description)..." 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            style={{ ...inputStyle, width: '100%', paddingLeft: '48px' }}
          />
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: '32px', minWidth: '140px' }}
            >
              <option value="all">Tous types</option>
              <option value="LOGIN">Connexion</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="EXPORT">Export</option>
            </select>

            <select 
              value={filters.entity}
              onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value, page: 1 }))}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: '32px', minWidth: '140px' }}
            >
              <option value="all">Tous modules</option>
              <option value="COMPLAINT">Plaintes</option>
              <option value="REGION">Régions</option>
              <option value="TEAM">Équipes</option>
              <option value="EMPLOYEE">Employés</option>
              <option value="ADMIN">Admins</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 12px' }}>
                <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', padding: '10px 0' }}
                />
                <span style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>→</span>
                <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', padding: '10px 0' }}
                />
            </div>

            <button
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <Download size={18} />
                Export
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: 'var(--bg-primary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>HORODATAGE</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>UTILISATEUR</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', textAlign: 'center' }}>TYPE</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>MODULE</th>
                <th style={{ padding: '16px 24px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>DESCRIPTION</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Chargement...
                        </td>
                    </tr>
                ) : logs.length === 0 ? (
                    <tr>
                         <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '50%' }}>
                                    <FileText size={24} color="var(--text-secondary)" />
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aucun historique trouvé</div>
                            </div>
                        </td>
                    </tr>
                ) : (
                    logs.map(log => {
                        const actionConfig = getActionConfig(log.action_type);
                        return (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                            {new Date(log.created_at).toLocaleDateString('fr-FR')}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Clock size={12} />
                                            {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '700', fontSize: '12px', color: 'var(--text-secondary)'
                                        }}>
                                            {log.author_name ? log.author_name.slice(0, 2).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                                {log.author_name || 'Système'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {log.author_email}
                                            </div>
                                        </div>
                                     </div>
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: actionConfig.bg,
                                        color: actionConfig.color
                                    }}>
                                        {actionConfig.label}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getEntityIcon(log.entity_type)}
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                            {log.entity_type.toLowerCase()}
                                        </span>
                                     </div>
                                     {log.entity_id && (
                                         <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', display: 'block', marginTop: '2px', paddingLeft: '22px' }}>
                                             #{log.entity_id.substring(0, 8)}
                                         </span>
                                     )}
                                </td>
                                <td style={{ padding: '16px 24px', maxWidth: '300px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {log.description}
                                    </p>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination Footer matches AdminUsers style (if it had one, using generic nice style here) */}
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page <strong style={{ color: 'var(--text-primary)' }}>{filters.page}</strong> sur <strong>{pagination.totalPages}</strong>
             </span>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: filters.page === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: filters.page === 1 ? 0.5 : 1 }}
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= pagination.totalPages}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: filters.page >= pagination.totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: filters.page >= pagination.totalPages ? 0.5 : 1 }}
                >
                    <ChevronRight size={16} />
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
