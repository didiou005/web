import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Skeleton from '../common/Skeleton';

const COLORS = {
  new: '#3b82f6',        // Bleu
  assigned: '#8b5cf6',   // Violet
  in_progress: '#f59e0b', // Orange
  resolved: '#10b981',   // Vert
  closed: '#6b7280'      // Gris
};

const STATUS_LABELS = {
  new: 'Nouveau',
  assigned: 'Assignée',
  in_progress: 'En cours',
  resolved: 'Résolue',
  closed: 'Fermée'
};

const CommunesTable = ({ regions, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginTop: '32px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <Skeleton variant="title" width="200px" />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px',
          padding: '24px'
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Skeleton variant="circle" width="16px" height="16px" />
                <Skeleton variant="title" width="150px" style={{ marginBottom: 0 }} />
              </div>
              <Skeleton variant="text" width="100px" style={{ marginLeft: '28px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <Skeleton height="40px" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </div>
              <Skeleton height="200px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!regions || regions.length === 0) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        background: 'var(--bg-secondary)', 
        color: 'var(--text-primary)',
        borderRadius: '12px', 
        marginTop: '32px',
        border: '1px solid var(--border-color)'
      }}>
        <MapPin size={48} style={{ margin: '0 auto 16px', color: 'var(--text-secondary)' }} />
        <p>Aucune commune trouvée</p>
      </div>
    );
  }

  // Filtrer les régions
  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    region.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fonction pour préparer les données du pie chart
  const getPieData = (region) => {
    const data = [];
    
    if (region.new_complaints > 0) {
      data.push({ name: 'Nouveau', value: region.new_complaints, status: 'new' });
    }
    if (region.assigned_complaints > 0) {
      data.push({ name: 'Assignée', value: region.assigned_complaints, status: 'assigned' });
    }
    if (region.in_progress_complaints > 0) {
      data.push({ name: 'En cours', value: region.in_progress_complaints, status: 'in_progress' });
    }
    if (region.resolved_complaints > 0) {
      data.push({ name: 'Résolue', value: region.resolved_complaints, status: 'resolved' });
    }
    if (region.closed_complaints > 0) {
      data.push({ name: 'Fermée', value: region.closed_complaints, status: 'closed' });
    }

    return data;
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      marginTop: '32px',
      overflow: 'hidden'
    }}>
      {/* Header avec Recherche */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <h3 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '18px',
          fontWeight: '600',
          margin: 0,
          color: 'var(--text-primary)'
        }}>
          <MapPin size={20} />
          Statistiques par commune
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                    type="text" 
                    placeholder="Rechercher une commune..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: '8px 12px 8px 36px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '14px',
                        outline: 'none',
                        width: '250px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                    }}
                />
            </div>
            <span style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
            padding: '4px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
            }}>
            {filteredRegions.length} commune(s)
            </span>
        </div>
      </div>

      {/* Grille de cartes par région */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px',
        padding: '24px'
      }}>
        {filteredRegions.length > 0 ? (
            filteredRegions.map((region) => {
          const pieData = getPieData(region);
          const resolutionRate = region.total_complaints > 0
            ? ((region.resolved_complaints / region.total_complaints) * 100).toFixed(1)
            : 0;

          return (
            <div 
              key={region.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: `4px solid ${region.color_hex || '#16a34a'}`,
                background: 'var(--bg-secondary)'
              }}
            >
              {/* En-tête de la carte région */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: region.color_hex || '#16a34a'
                  }}></div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {region.name}
                  </h4>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '28px' }}>
                  CP: {region.code || 'N/A'} {region.population > 0 && `• ${region.population.toLocaleString('fr-DZ')} habitants`}
                </div>
              </div>

              {/* Statistiques rapides */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                padding: '12px',
                background: 'var(--bg-primary)',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {region.total_complaints}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Total
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                    {region.open_complaints}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Ouvertes
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                    {region.resolved_complaints}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Résolues
                  </div>
                </div>
              </div>

              {/* Graphique Pie Chart */}
              {pieData.length > 0 ? (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value} plainte${value > 1 ? 's' : ''}`}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => STATUS_LABELS[value] || value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{
                  height: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  Aucune plainte pour cette commune
                </div>
              )}

              {/* Barre de progression */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)'
                }}>
                  <span>Taux de résolution</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{resolutionRate}%</span>
                </div>
                <div style={{
                  height: '10px',
                  background: 'var(--gray-200)',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${resolutionRate}%`,
                    background: resolutionRate >= 70 ? '#16a34a' : resolutionRate >= 40 ? '#f59e0b' : '#ef4444',
                    borderRadius: '5px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>
          );
        })) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Aucune commune ne correspond à votre recherche.
          </div>
        )}
      </div>

      {/* Footer - Résumé global */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '20px 24px',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        fontSize: '14px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {regions.reduce((sum, r) => sum + r.total_complaints, 0)}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Plaintes totales</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
            {regions.reduce((sum, r) => sum + r.open_complaints, 0)}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Ouvertes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
            {regions.reduce((sum, r) => sum + r.resolved_complaints, 0)}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Résolues</div>
        </div>
      </div>
    </div>
  );
};

export default CommunesTable;
