// src/components/common/Placeholder.jsx
import React from 'react';
import { Clock } from 'lucide-react';

const Placeholder = ({ title, description }) => {
  return (
    <div className="placeholder-container">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <Clock size={64} />
        </div>
        <h2>{title}</h2>
        <p>{description || 'Cette section est en cours de développement'}</p>
        <span className="placeholder-badge">Bientôt disponible</span>
      </div>
    </div>
  );
};

export default Placeholder;
