// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClass = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg'
  }[size];

  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className={`spinner ${sizeClass}`}></div>
      </div>
    );
  }

  return <div className={`spinner ${sizeClass}`}></div>;
};

export default LoadingSpinner;
