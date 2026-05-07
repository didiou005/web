// src/pages/Dashboard/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Download, Calendar } from 'lucide-react';
import StatCard from '../../components/stats/StatCard';
import ChartGenerator from '../../components/stats/ChartGenerator';
import GeneratedChart from '../../components/stats/GeneratedChart';
import { statsService } from '../../services/api';

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    date_from: '',
    date_to: ''
  });

  // Graphiques par défaut
  const [defaultCharts, setDefaultCharts] = useState([
    {
      id: 'complaints-total',
      title: 'Évolution des plaintes',
      metric: 'count',
      dimension: 'date',
      chartType: 'line',
      isDefault: true
    },
    {
      id: 'complaints-status',
      title: 'Plaintes traitées vs non traitées',
      metric: 'count',
      dimension: 'status',
      chartType: 'pie',
      isDefault: true
    },
    {
      id: 'complaints-region',
      title: 'Plaintes par région',
      metric: 'count',
      dimension: 'region',
      chartType: 'bar',
      isDefault: true
    },
    {
      id: 'complaints-waste',
      title: 'Types de déchets',
      metric: 'count',
      dimension: 'waste_type',
      chartType: 'bar',
      isDefault: true
    }
  ]);

  // Graphiques ajoutés par l'utilisateur
  const [customCharts, setCustomCharts] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAddChart = (chartConfig) => {
    const newChart = {
      id: Date.now(),
      ...chartConfig,
      isDefault: false
    };
    setCustomCharts([...customCharts, newChart]);
    setShowGenerator(false);
  };

  const handleRemoveChart = (chartId) => {
    setCustomCharts(customCharts.filter(c => c.id !== chartId));
  };

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
      case 'all':
        date_from = '';
        break;
    }

    setDateRange({
      date_from,
      date_to: date_from ? new Date().toISOString().split('T')[0] : ''
    });
  };

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="stats-header">
        <div>
          <h1>Statistiques</h1>
          <p className="text-muted">Analyse des données de plaintes</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowGenerator(true)}>
            <Plus size={18} />
            <span>Ajouter un graphique</span>
          </button>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="period-filter">
        <Calendar size={18} />
        <span className="filter-label">Période :</span>
        <div className="period-buttons">
          <button 
            className={`period-btn ${!dateRange.date_from ? 'active' : ''}`}
            onClick={() => handleQuickDate('all')}
          >
            Tout
          </button>
          <button 
            className="period-btn"
            onClick={() => handleQuickDate('7d')}
          >
            7 jours
          </button>
          <button 
            className="period-btn"
            onClick={() => handleQuickDate('30d')}
          >
            30 jours
          </button>
          <button 
            className="period-btn"
            onClick={() => handleQuickDate('90d')}
          >
            90 jours
          </button>
        </div>
        <div className="custom-period">
          <input
            type="date"
            value={dateRange.date_from}
            onChange={(e) => setDateRange({ ...dateRange, date_from: e.target.value })}
            className="date-input"
          />
          <span>→</span>
          <input
            type="date"
            value={dateRange.date_to}
            onChange={(e) => setDateRange({ ...dateRange, date_to: e.target.value })}
            className="date-input"
          />
        </div>
      </div>

      {/* Graphiques par défaut */}
      <div className="stats-section">
        <h2 className="section-title">Statistiques principales</h2>
        <div className="charts-grid">
          {defaultCharts.map(chart => (
            <StatCard
              key={chart.id}
              chart={chart}
              filters={dateRange}
            />
          ))}
        </div>
      </div>

      {/* Graphiques personnalisés */}
      {customCharts.length > 0 && (
        <div className="stats-section">
          <h2 className="section-title">Graphiques personnalisés</h2>
          <div className="charts-grid">
            {customCharts.map(chart => (
              <StatCard
                key={chart.id}
                chart={chart}
                filters={dateRange}
                onRemove={() => handleRemoveChart(chart.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Générateur de graphique */}
      {showGenerator && (
        <ChartGenerator
          onGenerate={handleAddChart}
          onCancel={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

export default Statistics;
