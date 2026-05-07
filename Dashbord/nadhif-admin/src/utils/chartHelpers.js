// src/utils/chartHelpers.js
export const formatChartData = (data, labelKey, valueKey) => {
  return data.map(item => ({
    label: item[labelKey],
    value: item[valueKey]
  }));
};

export const getChartColor = (index, total) => {
  const colors = [
    '#16a34a',
    '#22c55e',
    '#4ade80',
    '#86efac',
    '#bbf7d0'
  ];
  return colors[index % colors.length];
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-DZ').format(num);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};
