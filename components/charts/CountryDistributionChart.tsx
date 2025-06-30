
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order } from '../../types';
import { TailWindColor } from '../../utils/colorUtils';

interface CountryDistributionChartProps {
  orders: Order[];
}

const CountryDistributionChart: React.FC<CountryDistributionChartProps> = ({ orders }) => {
  const data = orders.reduce((acc, order) => {
    const country = order.clientCountry;
    const orderValue = order.totalFinalPrice; 
    const existing = acc.find(item => item.name === country);
    if (existing) {
      existing.orders += 1;
      existing.value += orderValue;
    } else {
      acc.push({ name: country, orders: 1, value: orderValue });
    }
    return acc;
  }, [] as { name: string; orders: number; value: number }[]).sort((a,b) => b.orders - a.orders).slice(0,10); 

  if (data.length === 0) {
    return <div className="p-4 text-center text-neutral-400">No data for country distribution.</div>;
  }

  const barColor1 = TailWindColor.primary?.DEFAULT || '#F59E0B'; // Amber
  const barColor2 = TailWindColor.sky?.[500] || '#0ea5e9'; // Sky Blue


  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Country-wise Order Distribution (Top 10)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={60} tick={{ fill: TailWindColor.neutral?.[400] }} />
          <YAxis yAxisId="left" orientation="left" stroke={barColor1} label={{ value: 'Number of Orders', angle: -90, position: 'insideLeft', fill: TailWindColor.neutral?.[400] }} tick={{ fill: TailWindColor.neutral?.[400] }} />
          <YAxis yAxisId="right" orientation="right" stroke={barColor2} label={{ value: 'Total Order Value ($)', angle: -90, position: 'insideRight', offset:10, fill: TailWindColor.neutral?.[400] }} tick={{ fill: TailWindColor.neutral?.[400] }} />
          <Tooltip 
            formatter={(value, name) => name === 'value' ? `$${Number(value).toLocaleString()}` : value}
            contentStyle={{ backgroundColor: TailWindColor.neutral?.[800], border: `1px solid ${TailWindColor.neutral?.[600]}`, color: TailWindColor.neutral?.[100] }}
            labelStyle={{ color: TailWindColor.neutral?.[50] }}
          />
          <Legend wrapperStyle={{ color: TailWindColor.neutral?.[300] }} />
          <Bar yAxisId="left" dataKey="orders" fill={barColor1} name="Number of Orders" />
          <Bar yAxisId="right" dataKey="value" fill={barColor2} name="Total Order Value (Client Price)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CountryDistributionChart;