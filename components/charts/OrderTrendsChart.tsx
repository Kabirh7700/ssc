
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order } from '../../types';
import { TailWindColor } from '../../utils/colorUtils'; 

interface OrderTrendsChartProps {
  orders: Order[]; // Expects non-cancelled orders
}

const processOrderDataForTrends = (orders: Order[]) => {
  const monthlyData: { [key: string]: { monthYear: string; totalValue: number; orderCount: number } } = {};

  orders.forEach(order => {
    const orderDate = new Date(order.orderDate);
    const monthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { monthYear, totalValue: 0, orderCount: 0 };
    }
    monthlyData[monthYear].totalValue += order.totalFinalPrice;
    monthlyData[monthYear].orderCount += 1;
  });

  return Object.values(monthlyData).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
};

const OrderTrendsChart: React.FC<OrderTrendsChartProps> = ({ orders }) => {
  const chartData = processOrderDataForTrends(orders);

  if (chartData.length === 0) {
    return (
      <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] flex items-center justify-center border border-neutral-600/70">
        <p className="text-neutral-400">No order data available for trends analysis.</p>
      </div>
    );
  }
  
  const primaryLineColor = TailWindColor.primary?.DEFAULT || '#F59E0B'; // Amber for value
  const secondaryLineColor = TailWindColor.sky?.[500] || '#0EA5E9'; // Sky blue for count


  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Order Trends Over Time</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={TailWindColor.neutral?.[600]} strokeOpacity={0.5} />
          <XAxis dataKey="monthYear" angle={-15} textAnchor="end" height={50} tick={{ fontSize: 12, fill: TailWindColor.neutral?.[400] }} />
          <YAxis yAxisId="left" label={{ value: 'Total Value ($)', angle: -90, position: 'insideLeft', style:{fontSize: '12px'}, fill: TailWindColor.neutral?.[400] }} stroke={primaryLineColor} tick={{ fontSize: 12, fill: TailWindColor.neutral?.[400] }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Number of Orders', angle: -90, position: 'insideRight', style:{fontSize: '12px'}, fill: TailWindColor.neutral?.[400] }} stroke={secondaryLineColor} tick={{ fontSize: 12, fill: TailWindColor.neutral?.[400] }} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'Total Value') return [`$${Number(value).toLocaleString()}`, name];
              if (name === 'Order Count') return [Number(value).toLocaleString(), name];
              return [value, name];
            }}
            contentStyle={{ backgroundColor: TailWindColor.neutral?.[800], border: `1px solid ${TailWindColor.neutral?.[600]}`, color: TailWindColor.neutral?.[100] }}
            labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: TailWindColor.neutral?.[50] }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend wrapperStyle={{fontSize: "12px", color: TailWindColor.neutral?.[300] }} />
          <Line yAxisId="left" type="monotone" dataKey="totalValue" name="Total Value" stroke={primaryLineColor} strokeWidth={2} dot={{ r: 4, fill: primaryLineColor }} activeDot={{ r: 6, stroke: TailWindColor.neutral?.[800] }} />
          <Line yAxisId="right" type="monotone" dataKey="orderCount" name="Order Count" stroke={secondaryLineColor} strokeWidth={2} dot={{ r: 4, fill: secondaryLineColor }} activeDot={{ r: 6, stroke: TailWindColor.neutral?.[800] }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderTrendsChart;