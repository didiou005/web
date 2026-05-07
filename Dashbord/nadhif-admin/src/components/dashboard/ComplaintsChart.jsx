// src/components/dashboard/ComplaintsChart.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintsChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // 7, 30, 90 jours

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getComplaintsTrend(period);
      setData(result);
    } catch (error) {
      console.error('Erreur chargement graphique:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="chart-controls">
        <button
          className={`period-btn ${period === '7' ? 'active' : ''}`}
          onClick={() => setPeriod('7')}
        >
          7 jours
        </button>
        <button
          className={`period-btn ${period === '30' ? 'active' : ''}`}
          onClick={() => setPeriod('30')}
        >
          30 jours
        </button>
        <button
          className={`period-btn ${period === '90' ? 'active' : ''}`}
          onClick={() => setPeriod('90')}
        >
          90 jours
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
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
            dataKey="count"
            stroke="#00d2ff"
            strokeWidth={4}
            name="Nombre de plaintes"
            dot={{ fill: '#00d2ff', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0, fill: '#00f2fe' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComplaintsChart;
