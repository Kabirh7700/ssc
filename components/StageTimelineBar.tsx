
import React from 'react';
import { StageHistoryItem, OrderStatus } from '../types';
import { daysBetween, formatDate } from '../utils/dateUtils';
import { ORDER_STATUS_COLORS, DEFAULT_SLA_DAYS_PER_STAGE } from '../constants';

interface StageTimelineBarProps {
  stageHistory: StageHistoryItem[];
  orderDate: string;
  currentStage: OrderStatus;
  expectedDeliveryDate: string; 
  actualDeliveryDate?: string; 
  isCancelled: boolean;
  cancellationDate?: string; 
}

const StageTimelineBar: React.FC<StageTimelineBarProps> = ({
  stageHistory,
  orderDate,
  currentStage,
  expectedDeliveryDate,
  actualDeliveryDate,
  isCancelled,
  cancellationDate,
}) => {
  if (!stageHistory || stageHistory.length === 0) {
    return <p className="text-xs text-neutral-400">No stage history to display timeline.</p>;
  }

  const relevantHistory = stageHistory.filter(
    (item) => item.stage !== OrderStatus.PAID 
  );
  if (isCancelled && cancellationDate) {
    relevantHistory.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); 
    const cancelIdx = relevantHistory.findIndex(s => s.stage === OrderStatus.CANCELLED);
    if (cancelIdx !== -1) {
        relevantHistory.length = cancelIdx + 1;
    }
  }


  let totalDurationForNormalization = 0;
  const processedSegments = relevantHistory.map((item, index) => {
    let segmentEndDate = item.endDate;
    if (!segmentEndDate && item.stage === currentStage && !isCancelled) {
      segmentEndDate = new Date().toISOString(); 
    } else if (isCancelled && item.stage === OrderStatus.CANCELLED) {
        segmentEndDate = item.startDate; 
    }

    const durationDays = segmentEndDate ? (daysBetween(item.startDate, segmentEndDate) || 0) : 0;
    totalDurationForNormalization += Math.max(0, durationDays); 

    return {
      ...item,
      durationDays: Math.max(0, durationDays), 
      actualEndDate: segmentEndDate,
    };
  });

  if (!isCancelled && currentStage !== OrderStatus.DELIVERED && currentStage !== OrderStatus.PAID && currentStage !== OrderStatus.CANCELLED) {
    const lastHistoryItem = processedSegments[processedSegments.length -1];
    if (lastHistoryItem && !lastHistoryItem.endDate) { 
        const timeFromLastStartToExpectedDelivery = daysBetween(lastHistoryItem.startDate, expectedDeliveryDate) || 0;
        if (timeFromLastStartToExpectedDelivery > lastHistoryItem.durationDays) {
            totalDurationForNormalization += (timeFromLastStartToExpectedDelivery - lastHistoryItem.durationDays);
        }
    } else if (expectedDeliveryDate) { 
        const lastActualEndDate = processedSegments[processedSegments.length -1]?.actualEndDate || orderDate;
        const remainingExpected = daysBetween(lastActualEndDate, expectedDeliveryDate) || 0;
        if (remainingExpected > 0) totalDurationForNormalization += remainingExpected;
    }
  }
  
  const minTotalDuration = Math.max(1, ...processedSegments.map(s => DEFAULT_SLA_DAYS_PER_STAGE[s.stage] || 1));
  totalDurationForNormalization = Math.max(totalDurationForNormalization, minTotalDuration, 1);


  return (
    <div className="w-full bg-neutral-600 rounded-full h-6 flex my-2 shadow-inner" title="Order Stage Timeline">
      {processedSegments.map((segment, index) => {
        const widthPercentage = (segment.durationDays / totalDurationForNormalization) * 100;
        if (widthPercentage <= 0 && segment.stage !== OrderStatus.CANCELLED) return null; 

        let bgColor = ORDER_STATUS_COLORS[segment.stage] || 'bg-neutral-500 text-white'; // Default from constants
        let textColor = 'text-white'; // Default, often overridden by ORDER_STATUS_COLORS

        // Adjust for dark theme if constants aren't dark-theme aware
        // This is a heuristic. Ideally, ORDER_STATUS_COLORS has dark theme variants.
        if (segment.stage === OrderStatus.READY_FOR_DISPATCH) { // Amber
             bgColor = 'bg-amber-500'; textColor = 'text-neutral-800'; // Amber needs dark text
        } else if (ORDER_STATUS_COLORS[segment.stage]) {
            const constantColor = ORDER_STATUS_COLORS[segment.stage];
            if (!constantColor.includes('text-white') && !constantColor.includes('text-neutral-800')) { // if no explicit text color, assume white on colored bg
                textColor = 'text-white';
            } else if (constantColor.includes('text-neutral-800')) {
                textColor = 'text-neutral-800';
            }
        }


        if (segment.isDelayed) {
          bgColor = 'bg-red-600'; // Darker red for dark theme
          textColor = 'text-white';
        } else if (segment.stage === currentStage && !segment.endDate && !isCancelled) {
           // Current active stage retains its standard color defined above
        } else if (segment.stage === OrderStatus.CANCELLED) {
            bgColor = 'bg-neutral-500';
            textColor = 'text-white';
        }
        
        const titleText = `${segment.stage}: ${formatDate(segment.startDate)} - ${segment.actualEndDate ? formatDate(segment.actualEndDate) : 'Ongoing'}\nDuration: ${segment.durationDays} day(s)${segment.isDelayed ? ` (Delayed, SLA: ${DEFAULT_SLA_DAYS_PER_STAGE[segment.stage]}d)` : ` (SLA: ${DEFAULT_SLA_DAYS_PER_STAGE[segment.stage]}d)`}${segment.notes ? `\nNotes: ${segment.notes}` : ''}`;

        return (
          <div
            key={segment.stage + segment.startDate}
            className={`h-full flex items-center justify-center ${bgColor} ${
              index === 0 ? 'rounded-l-full' : ''
            } ${
              index === processedSegments.length - 1 ? 'rounded-r-full' : ''
            } transition-all duration-300 ease-in-out overflow-hidden`}
            style={{ width: `${Math.max(widthPercentage, 0.5)}%` }} 
            title={titleText}
          >
            {widthPercentage > 5 && ( 
              <span className={`text-xs font-medium truncate px-1 ${textColor}`}>
                {segment.stage}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StageTimelineBar;