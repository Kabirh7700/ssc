
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Order } from '../../types';
import { TailWindColor } from '../../utils/colorUtils'; 

interface ClientPaymentStatusChartProps {
  orders: Order[]; // Expects non-cancelled orders
}

const ClientPaymentStatusChart: React.FC<ClientPaymentStatusChartProps> = ({ orders }) => {
  const statusCounts = {
    Paid: 0,
    'Partially Paid': 0,
    Pending: 0,
    Overdue: 0,
  };

  orders.forEach(order => {
    if (statusCounts.hasOwnProperty(order.paymentStatus)) {
      statusCounts[order.paymentStatus as keyof typeof statusCounts]++;
    }
  });

  const data = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] flex items-center justify-center border border-neutral-600/70">
        <p className="text-neutral-400">No client payment status data available.</p>
      </div>
    );
  }

  // Define colors that work well on a dark background
  const DARK_THEME_STATUS_COLORS: { [key: string]: string } = {
    Paid: TailWindColor.success?.DEFAULT || '#10B981', // Emerald-500
    'Partially Paid': TailWindColor.sky?.[500] || '#0EA5E9', // Sky-500
    Pending: TailWindColor.amber?.[400] || '#FBBF24',      // Amber-400 (brighter for dark bg)
    Overdue: TailWindColor.danger?.DEFAULT || '#EF4444',   // Red-500
  };

  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Client Payment Status Overview</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent, x, y, cx: pieCenterX }) => ( // Use cx from provided args
                <text x={x} y={y} fill={TailWindColor.neutral?.[200]} textAnchor={x > pieCenterX ? 'start' : 'end'} dominantBaseline="central" fontSize="11px">
                  {`${name}: ${(percent * 100).toFixed(0)}%`}
                </text>
              )}
            outerRadius={100}
            innerRadius={60} 
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DARK_THEME_STATUS_COLORS[entry.name] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${Number(value).toLocaleString()} orders`}
            contentStyle={{ backgroundColor: TailWindColor.neutral?.[800], border: `1px solid ${TailWindColor.neutral?.[600]}`, color: TailWindColor.neutral?.[100] }}
            labelStyle={{ color: TailWindColor.neutral?.[50] }}
          />
          <Legend iconSize={10} wrapperStyle={{fontSize: "12px", color: TailWindColor.neutral?.[300]}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientPaymentStatusChart;