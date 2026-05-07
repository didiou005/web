// src/components/stats/GeneratedChart.jsx
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

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'];

const GeneratedChart = ({ chart, onRemove }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await statsService.getStats({
        metric: chart.metric,
        dimension: chart.dimension,
        filters: chart.filters
      });
      setData(result);
    } catch (error) {
      console.error('Erreur:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="chart-loading-state">
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="chart-empty-state">
          <p>Aucune donnée disponible</p>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 60 }
    };

    switch (chart.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="label" 
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px' }}
                stroke="var(--text-secondary)"
              />
              <YAxis style={{ fontSize: '12px' }} stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="label" 
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px' }}
                stroke="var(--text-secondary)"
              />
              <YAxis style={{ fontSize: '12px' }} stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill="#16a34a"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="generated-chart-card">
      <div className="chart-header">
        <h3>{chart.title}</h3>
        <div className="chart-actions">
          <button className="icon-btn" onClick={fetchData} title="Actualiser">
            <RefreshCw size={16} />
          </button>
          <button className="icon-btn" onClick={onRemove} title="Supprimer">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="chart-body">
        {renderChart()}
      </div>
      {data.length > 0 && (
        <div className="chart-footer">
          <span className="chart-stat">{data.length} résultat(s)</span>
          <span className="chart-stat">
            Total: {data.reduce((sum, item) => sum + parseFloat(item.value), 0).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default GeneratedChart;
