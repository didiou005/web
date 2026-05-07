// src/components/common/Filters.jsx (version complète)
import React, { useEffect } from 'react';
import { Filter, X } from 'lucide-react';

const Filters = ({ filters, onChange, regions, teams }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const handleMultiSelectChange = (field, selectedOptions) => {
    const values = Array.from(selectedOptions)
      .filter(option => option.selected)
      .map(option => parseInt(option.value));
    handleChange(field, values);
  };

  const clearFilters = () => {
    onChange({
      date_from: '',
      date_to: '',
      region_ids: [],
      statuses: [],
      complaint_type: '',
      waste_type: '',
      team_ids: []
    });
  };

  const hasActiveFilters = () => {
    return filters.date_from || 
           filters.date_to || 
           filters.region_ids?.length > 0 ||
           filters.statuses?.length > 0 ||
           filters.complaint_type ||
           filters.waste_type ||
           filters.team_ids?.length > 0;
  };

  return (
    <div className="filters-container">
      <div className="filters-header">
        <div className="filters-title">
          <Filter size={20} />
          <h3>Filtres</h3>
          {hasActiveFilters() && (
            <span className="active-filters-badge">
              {[
                filters.date_from && 'Période',
                filters.region_ids?.length > 0 && `${filters.region_ids.length} région(s)`,
                filters.statuses?.length > 0 && `${filters.statuses.length} statut(s)`,
                filters.complaint_type && 'Type de plainte',
                filters.waste_type && 'Type de déchet',
                filters.team_ids?.length > 0 && `${filters.team_ids.length} équipe(s)`
              ].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>
        {hasActiveFilters() && (
          <button onClick={clearFilters} className="clear-filters-btn">
            <X size={16} />
            <span>Effacer tout</span>
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Période */}
        <div className="filter-group">
          <label>Date de début</label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Date de fin</label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value)}
            className="filter-input"
            min={filters.date_from || ''}
          />
        </div>

        {/* Région */}
        <div className="filter-group">
          <label>
            Région
            {regions && regions.length > 0 && (
              <span className="filter-count">({regions.length})</span>
            )}
          </label>
          <select
            multiple
            value={filters.region_ids || []}
            onChange={(e) => handleMultiSelectChange('region_ids', e.target.selectedOptions)}
            className="filter-select"
            size="4"
          >
            {regions && regions.length > 0 ? (
              regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name} {region.population ? `(${region.population.toLocaleString()} hab.)` : ''}
                </option>
              ))
            ) : (
              <option disabled>Chargement...</option>
            )}
          </select>
          {filters.region_ids?.length > 0 && (
            <small className="filter-help">
              {filters.region_ids.length} région(s) sélectionnée(s)
            </small>
          )}
        </div>

        {/* Statut */}
        <div className="filter-group">
          <label>Statut</label>
          <select
            multiple
            value={filters.statuses || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
              handleChange('statuses', values);
            }}
            className="filter-select"
            size="4"
          >
            <option value="new">🆕 Nouveau</option>
            <option value="assigned">👤 Assignée</option>
            <option value="in_progress">⏳ En cours</option>
            <option value="resolved">✅ Résolue</option>
            <option value="closed">🔒 Fermée</option>
          </select>
          {filters.statuses?.length > 0 && (
            <small className="filter-help">
              {filters.statuses.length} statut(s) sélectionné(s)
            </small>
          )}
        </div>

        {/* Type de plainte */}
        <div className="filter-group">
          <label>Type de plainte</label>
          <select
            value={filters.complaint_type || ''}
            onChange={(e) => handleChange('complaint_type', e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les types</option>
            <option value="illegal_dump">🚯 Dépôt sauvage</option>
            <option value="overflow">📦 Débordement</option>
            <option value="collection">🚛 Collecte non effectuée</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        {/* Type de déchet */}
        <div className="filter-group">
          <label>Type de déchet</label>
          <select
            value={filters.waste_type || ''}
            onChange={(e) => handleChange('waste_type', e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les types</option>
            <option value="household">🏠 Ménager</option>
            <option value="recyclable">♻️ Recyclable</option>
            <option value="organic">🌱 Organique</option>
            <option value="hazardous">⚠️ Dangereux</option>
            <option value="construction">🏗️ Construction</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        {/* Équipe */}
        <div className="filter-group">
          <label>
            Équipe
            {teams && teams.length > 0 && (
              <span className="filter-count">({teams.length})</span>
            )}
          </label>
          <select
            multiple
            value={filters.team_ids || []}
            onChange={(e) => handleMultiSelectChange('team_ids', e.target.selectedOptions)}
            className="filter-select"
            size="4"
          >
            {teams && teams.length > 0 ? (
              teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                  {team.region_name && ` • ${team.region_name}`}
                  {team.member_count > 0 && ` (${team.member_count} membres)`}
                </option>
              ))
            ) : (
              <option disabled>Chargement...</option>
            )}
          </select>
          {filters.team_ids?.length > 0 && (
            <small className="filter-help">
              {filters.team_ids.length} équipe(s) sélectionnée(s)
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;
