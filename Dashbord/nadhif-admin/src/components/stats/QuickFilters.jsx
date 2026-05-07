// src/components/stats/QuickFilters.jsx
import React, { useState } from 'react';
import { Calendar, MapPin, Users, Filter, X } from 'lucide-react';

const QuickFilters = ({ filters, onChange, regions, teams }) => {
  const [expanded, setExpanded] = useState(false);

  const handleQuickDate = (range) => {
    const today = new Date();
    let date_from = '';

    switch (range) {
      case '7d':
        date_from = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '30d':
        date_from = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        break;
      case '90d':
        date_from = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
        break;
      case 'year':
        date_from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        break;
    }

    onChange({
      ...filters,
      date_from,
      date_to: new Date().toISOString().split('T')[0]
    });
  };

  const clearFilters = () => {
    onChange({
      date_from: '',
      date_to: '',
      region_ids: [],
      statuses: [],
      team_ids: []
    });
  };

  const hasFilters = filters.date_from || filters.region_ids?.length > 0 || filters.team_ids?.length > 0;

  return (
    <div className="quick-filters">
      <div className="quick-filters-header">
        <button 
          className="filter-toggle-btn"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter size={18} />
          <span>Filtres rapides</span>
          {hasFilters && <span className="filter-badge">Actifs</span>}
        </button>
        {hasFilters && (
          <button className="clear-all-btn" onClick={clearFilters}>
            <X size={16} />
            <span>Tout effacer</span>
          </button>
        )}
      </div>

      {expanded && (
        <div className="quick-filters-content">
          {/* Période rapide */}
          <div className="filter-section">
            <label className="filter-label">
              <Calendar size={16} />
              <span>Période</span>
            </label>
            <div className="quick-buttons">
              <button 
                className={`quick-btn ${!filters.date_from ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, date_from: '', date_to: '' })}
              >
                Tout
              </button>
              <button 
                className="quick-btn"
                onClick={() => handleQuickDate('7d')}
              >
                7 jours
              </button>
              <button 
                className="quick-btn"
                onClick={() => handleQuickDate('30d')}
              >
                30 jours
              </button>
              <button 
                className="quick-btn"
                onClick={() => handleQuickDate('90d')}
              >
                90 jours
              </button>
              <button 
                className="quick-btn"
                onClick={() => handleQuickDate('year')}
              >
                Cette année
              </button>
            </div>
          </div>

          {/* Période personnalisée */}
          <div className="filter-section">
            <label className="filter-label">
              <Calendar size={16} />
              <span>Période personnalisée</span>
            </label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
                className="date-input"
                placeholder="Du"
              />
              <span>→</span>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
                className="date-input"
                placeholder="Au"
              />
            </div>
          </div>

          {/* Régions */}
          <div className="filter-section">
            <label className="filter-label">
              <MapPin size={16} />
              <span>Régions ({regions.length})</span>
            </label>
            <select
              multiple
              value={filters.region_ids || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions)
                  .map(opt => parseInt(opt.value));
                onChange({ ...filters, region_ids: values });
              }}
              className="multi-select"
              size="5"
            >
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Équipes */}
          <div className="filter-section">
            <label className="filter-label">
              <Users size={16} />
              <span>Équipes ({teams.length})</span>
            </label>
            <select
              multiple
              value={filters.team_ids || []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions)
                  .map(opt => parseInt(opt.value));
                onChange({ ...filters, team_ids: values });
              }}
              className="multi-select"
              size="5"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.region_name && `• ${team.region_name}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickFilters;
