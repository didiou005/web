// src/components/stats/DynamicChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { statsService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { RefreshCw, Settings } from 'lucide-react';

const COLORS = [
  '#00f3ff', // Electric Cyan
  '#ff0055', // Neon Pink
  '#39ff14', // Laser Lime
  '#fffb00', // Neon Yellow
  '#b026ff', // Electric Purple
  '#ff6600', // Hyper Orange
  '#ff00ff', // Vivid Magenta
  '#00d2ff', // Sky Blue
  '#7df9ff', // Arctic Blue
  '#32cd32'  // Lime Green
];

const STATUS_COLORS = {
  'en_attente': '#ff6600', // Orange néon
  'en_cours': '#00f3ff',   // Bleu électrique
  'resolue': '#39ff14',    // Laser Lime
  'En attente': '#ff6600',
  'En cours': '#00f3ff',
  'Résolue': '#39ff14'
};

const STATUS_LABELS = {
  'en_attente': 'En attente',
  'en_cours': 'En cours',
  'resolue': 'Résolue'
};

const DynamicChart = ({ chartId, metric, dimension, chartType, filters, onConfigChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, [metric, dimension, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await statsService.getStats({
        metric,
        dimension,
        filters
      });
      setData(result);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (entry, index) => {
    // 1. Priorité absolue : couleur injectée par le backend (ex: région spécifique)
    if (entry.color) return entry.color;
    if (entry.color_hex) return entry.color_hex;

    // 2. Priorité statut
    if (dimension === 'status') {
      const statusKey = Object.keys(STATUS_COLORS).find(key => 
        entry.label?.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(entry.label?.toLowerCase())
      );
      if (statusKey) return STATUS_COLORS[statusKey];
    }

    // 3. Palette tournante ultra-vibrante
    return COLORS[index % COLORS.length];
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="chart-loading-container">
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <p>Aucune donnée disponible pour cette période</p>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--green-primary)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00f3ff"
                strokeWidth={4}
                name={getMetricLabel(metric)}
                dot={{ fill: '#00f3ff', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '11px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)'
                }}
              />
              <Bar
                dataKey="value"
                name={getMetricLabel(metric)}
                radius={[6, 6, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percent }) => 
                  `${label}: ${(percent * 100).toFixed(0)}%`
                }
                innerRadius={chartType === 'doughnut' ? 70 : 0}
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry, index)} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Type de graphique non supporté</div>;
    }
  };

  const getMetricLabel = (metric) => {
    const labels = {
      count: 'Nombre',
      avg_resolution_time: 'Temps moyen (heures)',
      backlog: 'Non traitées',
      sla_compliance: 'SLA (%)'
    };
    return labels[metric] || metric;
  };

  return (
    <div className="dynamic-chart">
      <div className="chart-toolbar">
        <button 
          className="icon-btn" 
          onClick={fetchData}
          title="Actualiser"
        >
          <RefreshCw size={16} />
        </button>
        <button 
          className="icon-btn" 
          onClick={() => setShowConfig(!showConfig)}
          title="Configuration"
        >
          <Settings size={16} />
        </button>
      </div>

      {showConfig && (
        <div className="chart-config">
          <div className="config-row">
            <label>Type de graphique :</label>
            <select
              value={chartType}
              onChange={(e) => onConfigChange({ chartType: e.target.value })}
              className="config-select"
            >
              <option value="line">Courbe</option>
              <option value="bar">Barres</option>
              <option value="pie">Camembert</option>
              <option value="doughnut">Anneau</option>
            </select>
          </div>
        </div>
      )}

      {renderChart()}

      {data.length > 0 && (
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Total de données :</span>
            <span className="summary-value">{data.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total :</span>
            <span className="summary-value">
              {data.reduce((sum, item) => sum + parseFloat(item.value), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicChart;
