// src/Skeleton.jsx
import React from 'react';

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
