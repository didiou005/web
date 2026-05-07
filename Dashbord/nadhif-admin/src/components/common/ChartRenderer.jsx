// src/components/common/ChartRenderer.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { statsService } from '../../services/api';

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

const ChartRenderer = ({ config, filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [config, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await statsService.getStats({
        metric: config.metric,
        dimension: config.dimension,
        filters
      });
      setData(result);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (loading) {
      return <div className="chart-loading">Chargement...</div>;
    }

    if (!data || data.length === 0) {
      return <div className="chart-empty">Aucune donnée disponible</div>;
    }

    switch (config.dimension) {
      case 'date':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#16a34a" 
                strokeWidth={2}
                name={config.title}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'status':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#16a34a"
                name={config.title}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">{config.title}</h3>
      {renderChart()}
    </div>
  );
};

export default ChartRenderer;
