import React from 'react';
import { Order } from '../types';
import { ORDER_STATUS_LIST, OrderStatus, ORDER_STATUS_COLORS, DEFAULT_SLA_DAYS_PER_STAGE } from '../constants';

interface OrderPipelineProps {
  orders: Order[]; 
  allOrders: Order[]; 
  onStageSelect: (stage: OrderStatus) => void;
}

const calculateStageMetrics = (
    ordersForStage: Order[], 
    allOrders: Order[],      
    stage: OrderStatus
): { avgTat: number, sla: number, onTime: number, delayed: number, currentInStage: number, healthColor: string, healthTextColor: string, delayPercentage: number, delayedInstances: number } => {
  
  let totalTat = 0;
  let completedInStageHistorically = 0;
  let onTimeHistoricalCount = 0;
  let delayedHistoricalCount = 0;
  const sla = DEFAULT_SLA_DAYS_PER_STAGE[stage] || 0;
  const currentInStageCount = ordersForStage.filter(o => o.currentStage === stage).length;

  allOrders.forEach(order => {
    const stageEntry = order.stageHistory.find(h => h.stage === stage);
    if (stageEntry?.endDate) { 
      const startDate = new Date(stageEntry.startDate);
      const endDate = new Date(stageEntry.endDate);
      const tat = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      totalTat += tat;
      completedInStageHistorically++;
      if (tat <= sla) {
        onTimeHistoricalCount++;
      } else {
        delayedHistoricalCount++;
      }
    }
  });
  
  const avgTatHistorical = completedInStageHistorically > 0 ? parseFloat((totalTat / completedInStageHistorically).toFixed(1)) : 0;

  let delayedInstancesInCurrentStage = 0;
  let relevantForDelayCalcInCurrentStage = 0;

  ordersForStage.filter(o => o.currentStage === stage).forEach(order => {
    const stageEntry = order.stageHistory.find(h => h.stage === order.currentStage); 
    if (stageEntry) {
        relevantForDelayCalcInCurrentStage++;
        const daysInStage = (new Date().getTime() - new Date(stageEntry.startDate).getTime()) / (1000 * 3600 * 24);
        if (daysInStage > sla) {
            delayedInstancesInCurrentStage++;
        }
    }
  });
  
  let delayPercentage: number;
  let delayedInstancesToShow: number;

  if (relevantForDelayCalcInCurrentStage > 0) {
    delayPercentage = (delayedInstancesInCurrentStage / relevantForDelayCalcInCurrentStage) * 100;
    delayedInstancesToShow = delayedInstancesInCurrentStage;
  } else if (completedInStageHistorically > 0) { 
    delayPercentage = (delayedHistoricalCount / completedInStageHistorically) * 100;
    delayedInstancesToShow = delayedHistoricalCount;
  } else {
    delayPercentage = 0;
    delayedInstancesToShow = 0;
  }

  // Default health colors for dark theme
  let healthBgColor = 'bg-success/20'; // success.DEFAULT with opacity
  let healthTextColor = 'text-success-light'; // success.light

  // Specific health colors for certain stages if not overridden by delay status
  if (stage === OrderStatus.READY_FOR_DISPATCH) { // Amber based
      healthBgColor = 'bg-amber-500/20'; // amber with opacity
      healthTextColor = 'text-amber-300'; // lighter amber
  }
  
  if (stage === OrderStatus.CANCELLED) {
      healthBgColor = 'bg-neutral-600'; 
      healthTextColor = 'text-neutral-300';
  } else if (delayPercentage > 50) {
      healthBgColor = 'bg-danger/20';
      healthTextColor = 'text-red-400'; // danger.text or lighter red
  } else if (delayPercentage > 20) {
      healthBgColor = 'bg-warning/20'; 
      healthTextColor = 'text-yellow-300'; // warning.text or lighter yellow
  }


  return { 
    avgTat: avgTatHistorical, 
    sla,
    onTime: onTimeHistoricalCount,
    delayed: delayedHistoricalCount,
    currentInStage: currentInStageCount,
    healthColor: healthBgColor,
    healthTextColor,
    delayPercentage,
    delayedInstances: delayedInstancesToShow
  };
};

const OrderPipeline: React.FC<OrderPipelineProps> = ({ orders, allOrders, onStageSelect }) => {
  const ordersByStage = ORDER_STATUS_LIST.reduce((acc, stage) => {
    acc[stage] = orders.filter(order => order.currentStage === stage).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg border border-neutral-600/70">
      <h2 className="text-xl font-semibold text-neutral-100 mb-4">Order Pipeline</h2>
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {ORDER_STATUS_LIST.map((stage) => {
            if (stage === OrderStatus.CANCELLED && ordersByStage[stage] === 0 && !allOrders.some(o => o.currentStage === OrderStatus.CANCELLED)) {
                const isCancelledStageVisibleBasedOnFilters = allOrders.some(o => o.currentStage === OrderStatus.CANCELLED); 
                if (!isCancelledStageVisibleBasedOnFilters && ordersByStage[stage] === 0) return null;
            }
            
            const stageMetrics = calculateStageMetrics(orders, allOrders, stage);
            // Use ORDER_STATUS_COLORS for the main card background if they provide a dark-theme friendly version
            // For now, let's use a consistent base for cards and only vary text/accent slightly
            const cardBgFromConstant = ORDER_STATUS_COLORS[stage] || 'bg-neutral-600 text-neutral-200';
            // Determine if the constant color is light or dark to set text color appropriately.
            // This is a heuristic. Proper solution would involve defining dark-theme specific ORDER_STATUS_COLORS.
            const isBgDark = cardBgFromConstant.includes('700') || cardBgFromConstant.includes('800') || cardBgFromConstant.includes('900') || cardBgFromConstant.includes('slate');
            const cardTextColor = isBgDark ? 'text-neutral-100' : 'text-neutral-800'; // Default text if not in constant

            // A more robust way: define a dark theme variant for ORDER_STATUS_COLORS
            // For now, will use the defined colors but ensure the text on them is legible.
            // Example: bg-blue-500 text-white -> on dark theme, blue-500 might be too bright.
            // Let's use a slightly darker version or just ensure text contrast.
            // The ORDER_STATUS_COLORS should be reviewed for dark theme. Example override:
            let finalCardClasses = `${cardBgFromConstant} shadow-md`;
            if (stage === OrderStatus.FRESH_ORDER) finalCardClasses = "bg-blue-600 text-white shadow-md"; // Keep bright for emphasis
            else if (stage === OrderStatus.PRODUCTION) finalCardClasses = "bg-purple-600 text-white shadow-md";
            else if (stage === OrderStatus.READY_FOR_DISPATCH) finalCardClasses = "bg-amber-600 text-neutral-800 shadow-md"; // Amber, dark text
            else if (stage === OrderStatus.DELIVERED) finalCardClasses = "bg-teal-600 text-white shadow-md";
            else if (stage === OrderStatus.PAID) finalCardClasses = "bg-green-600 text-white shadow-md";
            else if (stage === OrderStatus.CANCELLED) finalCardClasses = "bg-neutral-500 text-white shadow-md";


            return (
              <div 
                key={stage} 
                className={`flex-1 min-w-[220px] p-4 rounded-lg ${finalCardClasses} cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-200 ease-in-out`}
                onClick={() => onStageSelect(stage)}
                role="button"
                tabIndex={0}
                aria-label={`View orders in ${stage} stage`}
                onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onStageSelect(stage)}
              >
                <h3 className={`font-semibold text-md truncate`}>{stage}</h3>
                <p className={`text-3xl font-bold my-2`}>{stageMetrics.currentInStage}</p>
                <p className={`text-sm opacity-90`}>Orders currently in stage</p>
                
                {stage !== OrderStatus.CANCELLED && (
                  <div className={`mt-3 p-2 rounded ${stageMetrics.healthColor} ${stageMetrics.healthTextColor} text-xs shadow-inner`}>
                    <p>Avg TAT (Hist.): {stageMetrics.avgTat > 0 ? `${stageMetrics.avgTat}d` : 'N/A'} (SLA: {stageMetrics.sla}d)</p>
                    { (stageMetrics.delayedInstances > 0 || stageMetrics.currentInStage > 0 || stageMetrics.avgTat > 0 ) &&
                       <p>Delayed: {stageMetrics.delayedInstances} ({stageMetrics.delayPercentage.toFixed(0)}%)</p>
                    }
                  </div>
                )}
                {stage === OrderStatus.CANCELLED && stageMetrics.currentInStage === 0 && (
                     <p className="text-xs mt-2 opacity-80">(No orders currently marked as cancelled based on active filters)</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderPipeline;