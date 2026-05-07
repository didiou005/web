import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Skeleton from './Skeleton';

const KPICard = ({ title, value, subtitle, trend, icon: Icon, loading, onClick, variant }) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp size={16} className="trend-up" />;
    if (trend < 0) return <TrendingDown size={16} className="trend-down" />;
    return <Minus size={16} className="trend-neutral" />;
  };

  return (
    <div 
      className={`kpi-card ${variant || ''} ${onClick ? 'clickable' : ''}`} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div className="kpi-icon">
            <Icon size={24} />
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="kpi-loading-content">
          <Skeleton variant="title" width="80%" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton variant="text" width="60%" />
        </div>
      ) : (
        <>
          <div className="kpi-value">{value}</div>
          {subtitle && (
            <div className="kpi-subtitle">
              {trend !== undefined && getTrendIcon()}
              <span>{subtitle}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KPICard;
