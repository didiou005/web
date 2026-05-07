// src/components/stats/StatCard.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { statsService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { Trash2, RefreshCw } from 'lucide-react';

const COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#84cc16'  // Lime
];

const STATUS_COLORS = {
  'en_attente': '#f97316', 
  'en_cours': '#3b82f6', 
  'resolue': '#10b981',
  'En attente': '#f97316',
  'En cours': '#3b82f6',
  'Résolue': '#10b981'
};

const StatCard = ({ chart, filters, onRemove }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [filters, chart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await statsService.getStats({
        metric: chart.metric,
        dimension: chart.dimension,
        filters: filters
      });
      
      setData(result);
      const sum = result.reduce((acc, item) => acc + parseFloat(item.value), 0);
      setTotal(sum);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (entry, index) => {
    // 1. Priorité absolue : couleur injectée par le backend (ex: région spécifique)
    if (entry.color) return entry.color;
    if (entry.color_hex) return entry.color_hex;

    // 2. Priorité statut
    if (chart.dimension === 'status') {
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
        <div className="chart-loading">
          <LoadingSpinner size="md" />
          <p>Chargement des données...</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="chart-empty">
          <p>😕</p>
          <span>Aucune donnée disponible</span>
        </div>
      );
    }

    const chartProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (chart.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="label" 
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '11px' }}
                stroke="#94a3b8"
              />
              <YAxis 
                style={{ fontSize: '11px' }}
                stroke="#94a3b8"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00f3ff"
                strokeWidth={4}
                dot={{ fill: '#00f3ff', r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                name="Valeur"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percent }) => 
                  `${label}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={110}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="label" 
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: '11px' }}
                stroke="#94a3b8"
              />
              <YAxis 
                style={{ fontSize: '11px' }}
                stroke="#94a3b8"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                name="Valeur"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <h3>{chart.title}</h3>
        <div className="stat-card-actions">
          <button 
            className="icon-btn" 
            onClick={fetchData}
            title="Actualiser"
          >
            <RefreshCw size={16} />
          </button>
          {!chart.isDefault && onRemove && (
            <button 
              className="icon-btn" 
              onClick={onRemove}
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="stat-card-body">
        {renderChart()}
      </div>

      {data.length > 0 && (
        <div className="stat-card-footer">
          <div className="stat-info">
            <span className="stat-label">Total :</span>
            <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{Math.round(total)}</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Entrées :</span>
            <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{data.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
