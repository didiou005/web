// src/components/stats/ChartGenerator.jsx
import React, { useState } from 'react';
import { X, BarChart3, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react';

const ChartGenerator = ({ currentFilters, onGenerate, onCancel }) => {
  const [config, setConfig] = useState({
    title: '',
    metric: 'count',
    dimension: 'date',
    chartType: 'bar'
  });

  const metrics = [
    { value: 'count', label: 'Nombre de plaintes' },
    { value: 'avg_resolution_time', label: 'Temps moyen de résolution' },
    { value: 'backlog', label: 'Plaintes non traitées' },
    { value: 'sla_compliance', label: 'Respect SLA < 48h' }
  ];

  const dimensions = [
    { value: 'date', label: 'Par jour' },
    { value: 'week', label: 'Par semaine' },
    { value: 'month', label: 'Par mois' },
    { value: 'region', label: 'Par région' },
    { value: 'status', label: 'Par statut' },
    { value: 'team', label: 'Par équipe' },
    { value: 'complaint_type', label: 'Par type de plainte' }
  ];

  const chartTypes = [
    { value: 'bar', label: 'Barres', icon: BarChart3 },
    { value: 'line', label: 'Courbe', icon: LineIcon },
    { value: 'pie', label: 'Camembert', icon: PieIcon }
  ];

  const generateTitle = () => {
    const metric = metrics.find(m => m.value === config.metric);
    const dimension = dimensions.find(d => d.value === config.dimension);
    return `${metric?.label} ${dimension?.label.toLowerCase()}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      ...config,
      title: config.title || generateTitle()
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-generator" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Générer un graphique</h2>
          <button className="icon-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Titre */}
            <div className="form-group">
              <label>Titre (optionnel)</label>
              <input
                type="text"
                className="form-input"
                placeholder={generateTitle()}
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>

            {/* Métrique */}
            <div className="form-group">
              <label>Que voulez-vous mesurer ?</label>
              <div className="radio-group">
                {metrics.map(metric => (
                  <label key={metric.value} className="radio-label">
                    <input
                      type="radio"
                      name="metric"
                      value={metric.value}
                      checked={config.metric === metric.value}
                      onChange={(e) => setConfig({ ...config, metric: e.target.value })}
                    />
                    <span>{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dimension */}
            <div className="form-group">
              <label>Comment voulez-vous grouper les données ?</label>
              <select
                value={config.dimension}
                onChange={(e) => setConfig({ ...config, dimension: e.target.value })}
                className="form-select"
              >
                {dimensions.map(dim => (
                  <option key={dim.value} value={dim.value}>
                    {dim.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type de graphique */}
            <div className="form-group">
              <label>Type de visualisation</label>
              <div className="chart-type-selector">
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`chart-type-option ${config.chartType === type.value ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, chartType: type.value })}
                  >
                    <type.icon size={32} />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Générer le graphique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartGenerator;
