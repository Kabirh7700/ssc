
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Order, OrderLineItem } from '../../types';
import { ProductType, PRODUCT_TYPE_LIST } from '../../constants';
import { TailWindColor } from '../../utils/colorUtils'; 


interface ProductPopularityChartProps {
  orders: Order[]; // Expects non-cancelled orders
}

const DARK_THEME_PIE_COLORS = [
  TailWindColor.sky?.[500] || '#0ea5e9',
  TailWindColor.emerald?.[500] || '#10b981',
  TailWindColor.primary?.DEFAULT || '#f59e0b', // Use primary for one slice
  TailWindColor.rose?.[500] || '#f43f5e',
  TailWindColor.indigo?.[500] || '#6366f1',
  TailWindColor.lime?.[400] || '#a3e635', // Lighter lime for dark bg
  TailWindColor.pink?.[500] || '#ec4899',
  TailWindColor.teal?.[400] || '#2dd4bf', 
  TailWindColor.cyan?.[500] || '#06b6d4',
];

const ProductPopularityChart: React.FC<ProductPopularityChartProps> = ({ orders }) => {
  const productData = PRODUCT_TYPE_LIST.map(type => ({ name: type, value: 0 }));

  orders.forEach(order => {
    order.lineItems.forEach(item => {
      const productIndex = productData.findIndex(p => p.name === item.productType);
      if (productIndex !== -1) {
        productData[productIndex].value += item.quantity;
      }
    });
  });

  const filteredData = productData.filter(p => p.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] flex items-center justify-center border border-neutral-600/70">
        <p className="text-neutral-400">No product data available for popularity analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg h-[400px] border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Product Popularity (by Quantity Sold)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={filteredData}
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
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={DARK_THEME_PIE_COLORS[index % DARK_THEME_PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${Number(value).toLocaleString()} units`}
            contentStyle={{ backgroundColor: TailWindColor.neutral?.[800], border: `1px solid ${TailWindColor.neutral?.[600]}`, color: TailWindColor.neutral?.[100] }}
            labelStyle={{ color: TailWindColor.neutral?.[50] }}
          />
          <Legend iconSize={10} wrapperStyle={{fontSize: "12px", color: TailWindColor.neutral?.[300]}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductPopularityChart;