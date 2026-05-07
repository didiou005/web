// src/components/dashboard/StatusDistribution.jsx (REMPLACE TOUT)
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { dashboardService } from '../../services/api';

const STATUS_COLORS = {
  'en_attente': '#fb8c00', // Orange néon
  'en_cours': '#00d2ff',   // Bleu électrique
  'resolue': '#a8ff78'     // Vert néon
};

const STATUS_LABELS = {
  'en_attente': 'En attente',
  'en_cours': 'En cours',
  'resolue': 'Résolue'
};

const StatusDistribution = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await dashboardService.getStatusDistribution();
      
      const chartData = result.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        statusKey: item.status
      }));
      
      setData(chartData);
    } catch (error) {
      console.error('Erreur chargement distribution status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--white)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)'
      }}>
        Chargement...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        background: 'var(--white)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)'
      }}>
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid var(--border-color)'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: 'var(--text-primary)'
      }}>
        Répartition par statut
      </h3>

      <div style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.statusKey] || '#94a3b8'} />
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
              formatter={(value) => `${value} plainte${value > 1 ? 's' : ''}`}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusDistribution;
