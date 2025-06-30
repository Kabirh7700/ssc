import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Order, OrderLineItem } from '../../types';
import { ProductType, PRODUCT_TYPE_LIST } from '../../constants';
import { TailWindColor } from '../../utils/colorUtils';

interface PricingSummaryChartProps {
  orders: Order[];
}

const PricingSummaryChart: React.FC<PricingSummaryChartProps> = ({ orders }) => {
  const dataByProductType = PRODUCT_TYPE_LIST.map(productType => {
    let totalQuotedForType = 0;
    let totalNegotiatedForType = 0;
    let relevantOrderCount = 0;

    orders.forEach(order => {
      let orderContributesToThisType = false;
      order.lineItems.forEach(item => {
        if (item.productType === productType) {
          totalQuotedForType += item.quotedPricePerUnit * item.quantity;
          totalNegotiatedForType += (item.negotiatedPricePerUnit || item.quotedPricePerUnit) * item.quantity;
          orderContributesToThisType = true;
        }
      });
      if (orderContributesToThisType) {
        relevantOrderCount++;
      }
    });

    return {
      name: productType,
      totalQuoted: totalQuotedForType,
      totalNegotiated: totalNegotiatedForType,
      count: relevantOrderCount, 
    };
  }).filter(d => d.count > 0);


  if (dataByProductType.length === 0) {
    return <div className="p-4 text-center text-neutral-400">No pricing data for current filters.</div>;
  }
  
  const chartColors = [
    TailWindColor.primary?.DEFAULT || '#F59E0B', // Amber
    TailWindColor.sky?.[500] || '#0ea5e9',      // Sky Blue
    TailWindColor.emerald?.[500] || '#10b981',  // Emerald
    TailWindColor.rose?.[500] || '#f43f5e',     // Rose
    TailWindColor.indigo?.[500] || '#6366f1',   // Indigo
  ];

  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Pricing Summary: Quoted vs. Negotiated (by Product Type)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={dataByProductType} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
          <XAxis dataKey="name" tick={{ fill: TailWindColor.neutral?.[400] }} />
          <YAxis label={{ value: 'Total Value ($)', angle: -90, position: 'insideLeft', fill: TailWindColor.neutral?.[400] }} tick={{ fill: TailWindColor.neutral?.[400] }} />
          <Tooltip 
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            contentStyle={{ backgroundColor: TailWindColor.neutral?.[800], border: `1px solid ${TailWindColor.neutral?.[600]}`, color: TailWindColor.neutral?.[100] }}
            labelStyle={{ color: TailWindColor.neutral?.[50] }}
          />
          <Legend wrapperStyle={{ color: TailWindColor.neutral?.[300] }}/>
          <Bar dataKey="totalQuoted" name="Total Quoted Price" >
            {dataByProductType.map((entry, index) => (
              <Cell key={`cell-quoted-${index}`} fill={chartColors[index % chartColors.length]} fillOpacity={0.6} />
            ))}
          </Bar>
          <Bar dataKey="totalNegotiated" name="Total Negotiated Price" >
            {dataByProductType.map((entry, index) => (
              <Cell key={`cell-negotiated-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PricingSummaryChart;