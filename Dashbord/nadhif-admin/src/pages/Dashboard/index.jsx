// src/pages/Dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import KPICard from '../../components/common/KPICard';
import ComplaintsChart from '../../components/dashboard/ComplaintsChart';
import StatusDistribution from '../../components/dashboard/StatusDistribution';
import CommunesTable from '../../components/dashboard/CommunesTable'; // ✅ NOUVEAU
import { dashboardService } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [regions, setRegions] = useState([]); // ✅ NOUVEAU
  const [loading, setLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true); // ✅ NOUVEAU

  useEffect(() => {
    fetchDashboardData();
    fetchRegionsData(); // ✅ NOUVEAU
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await dashboardService.getKPIs();
      setKpis(data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU
  const fetchRegionsData = async () => {
    try {
      const data = await dashboardService.getRegionsStats();
      setRegions(data);
    } catch (error) {
      console.error('Erreur chargement régions:', error);
    } finally {
      setRegionsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Vue Globale par Commune</h1>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          title="Total des plaintes"
          value={kpis?.total_complaints || 0}
          icon={AlertCircle}
          loading={loading}
          onClick={() => navigate('/complaints')}
          variant="info"
        />
        <KPICard
          title="Plaintes ouvertes"
          value={kpis?.open_complaints || 0}
          icon={Clock}
          loading={loading}
          onClick={() => navigate('/complaints')}
          variant="warning"
        />
        <KPICard
          title="Nouvelles aujourd'hui"
          value={kpis?.new_today || 0}
          icon={TrendingUp}
          loading={loading}
          onClick={() => navigate('/complaints')}
          variant="info"
        />
        <KPICard
          title="Temps moyen résolution"
          value={kpis?.avg_resolution_time ? `${kpis.avg_resolution_time}h` : '--'}
          icon={CheckCircle}
          loading={loading}
          variant="primary"
        />
        <KPICard
          title="Résolues < 48h"
          value={kpis?.resolved_under_48h || '--'}
          icon={TrendingUp}
          loading={loading}
          variant="primary"
        />
      </div>

      {/* Graphiques */}
      <div className="dashboard-charts">
        <div className="chart-row">
          <ComplaintsChart />
          <StatusDistribution />
        </div>
      </div>

      {/* ✅ NOUVEAU - Tableau des régions */}
      <div className="dashboard-regions">
        <CommunesTable regions={regions} loading={regionsLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
