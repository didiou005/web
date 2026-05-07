// src/components/stats/ChartSelector.jsx
import React, { useState } from 'react';
import { X, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const ChartSelector = ({ onAdd, onCancel }) => {
  const [config, setConfig] = useState({
    metric: 'count',
    dimension: 'date',
    chartType: 'line',
    title: ''
  });

  const metrics = [
    { value: 'count', label: 'Nombre de plaintes', icon: BarChart3 },
    { value: 'avg_resolution_time', label: 'Temps moyen de résolution', icon: TrendingUp },
    { value: 'backlog', label: 'Plaintes non traitées', icon: BarChart3 },
    { value: 'sla_compliance', label: 'Respect du SLA (< 48h)', icon: TrendingUp }
  ];

  const dimensions = [
    { value: 'date', label: 'Par jour', chartTypes: ['line', 'bar'] },
    { value: 'week', label: 'Par semaine', chartTypes: ['line', 'bar'] },
    { value: 'month', label: 'Par mois', chartTypes: ['line', 'bar'] },
    { value: 'region', label: 'Par région', chartTypes: ['bar', 'pie'] },
    { value: 'status', label: 'Par statut', chartTypes: ['bar', 'pie', 'doughnut'] },
    { value: 'team', label: 'Par équipe', chartTypes: ['bar', 'pie'] },
    { value: 'complaint_type', label: 'Par type de plainte', chartTypes: ['bar', 'pie'] },
    { value: 'waste_type', label: 'Par type de déchet', chartTypes: ['bar', 'pie'] }
  ];

  const chartTypes = [
    { value: 'line', label: 'Courbe', icon: LineChartIcon },
    { value: 'bar', label: 'Barres', icon: BarChart3 },
    { value: 'pie', label: 'Camembert', icon: PieChartIcon },
    { value: 'doughnut', label: 'Anneau', icon: PieChartIcon }
  ];

  const selectedDimension = dimensions.find(d => d.value === config.dimension);
  const availableChartTypes = chartTypes.filter(ct => 
    selectedDimension?.chartTypes.includes(ct.value)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const title = config.title || generateTitle();
    onAdd({ ...config, title });
  };

  const generateTitle = () => {
    const metric = metrics.find(m => m.value === config.metric);
    const dimension = dimensions.find(d => d.value === config.dimension);
    return `${metric?.label} ${dimension?.label.toLowerCase()}`;
  };

  const handleMetricChange = (metric) => {
    setConfig({ ...config, metric });
  };

  const handleDimensionChange = (dimension) => {
    const dim = dimensions.find(d => d.value === dimension);
    const defaultChartType = dim.chartTypes[0];
    setConfig({ ...config, dimension, chartType: defaultChartType });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouveau graphique</h2>
          <button className="icon-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Titre personnalisé */}
            <div className="form-group">
              <label>Titre du graphique (optionnel)</label>
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
              <label>Métrique à analyser</label>
              <div className="metric-grid">
                {metrics.map(metric => (
                  <button
                    key={metric.value}
                    type="button"
                    className={`metric-card ${config.metric === metric.value ? 'active' : ''}`}
                    onClick={() => handleMetricChange(metric.value)}
                  >
                    <metric.icon size={24} />
                    <span>{metric.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension */}
            <div className="form-group">
              <label>Dimension d'analyse</label>
              <div className="dimension-grid">
                {dimensions.map(dimension => (
                  <button
                    key={dimension.value}
                    type="button"
                    className={`dimension-btn ${config.dimension === dimension.value ? 'active' : ''}`}
                    onClick={() => handleDimensionChange(dimension.value)}
                  >
                    {dimension.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de graphique */}
            <div className="form-group">
              <label>Type de visualisation</label>
              <div className="chart-type-grid">
                {availableChartTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`chart-type-btn ${config.chartType === type.value ? 'active' : ''}`}
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
              Créer le graphique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartSelector;
