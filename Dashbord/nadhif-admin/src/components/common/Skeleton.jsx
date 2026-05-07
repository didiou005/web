// src/components/common/Skeleton.jsx
import React from 'react';

/**
 * Skeleton loading component
 * @param {string} variant - 'text', 'circle', 'rectangle', 'title'
 * @param {string|number} width - manual width
 * @param {string|number} height - manual height
 * @param {string} className - additional classes
 */
const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  style = {}
}) => {
  const classes = [
    'skeleton',
    variant === 'circle' ? 'skeleton-circle' : '',
    variant === 'text' ? 'skeleton-text' : '',
    variant === 'title' ? 'skeleton-title' : '',
    className
  ].filter(Boolean).join(' ');

  const customStyle = {
    ...style,
    width: width || style.width,
    height: height || style.height
  };

  return <div className={classes} style={customStyle} />;
};

export default Skeleton;
