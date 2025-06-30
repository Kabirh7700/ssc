
import React from 'react';
import { Kpi } from '../types';

interface KpiCardProps {
  kpi: Kpi;
  icon?: React.ReactNode;
}

const TrendArrow: React.FC<{ trend?: number }> = ({ trend }) => {
    if (trend === undefined) return null;
    const isPositive = trend >= 0; // Assuming positive trend is good
    // For KPIs like 'Delayed Orders', a negative trend (fewer delayed orders) is good.
    // This simple TrendArrow doesn't know context, so it just shows increase/decrease.
    // If specific KPIs need inverted trend meaning, that logic should be in KPI calculation.
    return (
        <span className={`ml-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
    );
};

const KpiCard: React.FC<KpiCardProps> = ({ kpi, icon }) => {
  let cardBgColor = 'bg-neutral-700 hover:bg-neutral-600/70'; // Default dark card
  let titleColor = 'text-neutral-400';
  let valueColor = 'text-neutral-100';
  let unitColor = 'text-neutral-300';
  let iconBgColor = 'bg-primary/10'; // Use primary (amber) for icon background tint
  let iconColor = 'text-primary';    // Use primary (amber) for icon color

  // Status-specific overrides (using semantic colors from Tailwind config)
  // These are based on the Kpi.status which is set in calculateKPIs
  if (kpi.status === 'good') {
    // cardBgColor = 'bg-success/10 hover:bg-success/20'; // Very subtle green tint
    valueColor = 'text-success-light'; // Brighter green for value
    // iconColor = 'text-success'; 
    // iconBgColor = 'bg-success/10';
  } else if (kpi.status === 'warning') {
    // cardBgColor = 'bg-warning/10 hover:bg-warning/20';
    valueColor = 'text-yellow-300'; // Brighter yellow for value (assuming warning is yellow-ish)
    // iconColor = 'text-warning';
    // iconBgColor = 'bg-warning/10';
  } else if (kpi.status === 'danger') {
    // cardBgColor = 'bg-danger/10 hover:bg-danger/20';
    valueColor = 'text-red-400'; // Brighter red for value
    // iconColor = 'text-danger';
    // iconBgColor = 'bg-danger/10';
  }

  return (
    <div className={`${cardBgColor} p-4 shadow-lg rounded-lg flex items-center space-x-3 transition-colors duration-150 border border-neutral-600/50`}>
      {icon && <div className={`p-2 ${iconBgColor} rounded-full ${iconColor}`}>{icon}</div>}
      <div>
        <h3 className={`text-sm font-medium ${titleColor}`}>{kpi.title}</h3>
        <p className={`text-2xl font-semibold ${valueColor}`}>
            {kpi.value}
            {kpi.unit && <span className={`text-xs font-normal ${unitColor} ml-1`}>{kpi.unit}</span>}
        </p>
        {kpi.trend !== undefined && <TrendArrow trend={kpi.trend} />}
      </div>
    </div>
  );
};

export default KpiCard;