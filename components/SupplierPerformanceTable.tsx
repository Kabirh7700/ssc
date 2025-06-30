
import React from 'react';
import { Supplier } from '../types';

interface SupplierPerformanceTableProps {
  suppliers: Supplier[];
}

const SupplierPerformanceTable: React.FC<SupplierPerformanceTableProps> = ({ suppliers }) => {
    if (suppliers.length === 0) {
        return <div className="p-4 text-center text-neutral-400 bg-neutral-700 rounded-lg border border-neutral-600/70">No supplier data available.</div>;
    }
  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg border border-neutral-600/70">
      <h3 className="text-lg font-semibold text-neutral-100 mb-4">Supplier Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-600">
          <thead className="bg-neutral-600/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Supplier Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Avg. TAT (days)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Delivery Rate</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Pricing Variance</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-700 divide-y divide-neutral-600">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-neutral-600/70 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-100">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{supplier.avgTat}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    <span className={supplier.deliveryRate >= 0.95 ? 'text-success-light' : supplier.deliveryRate >= 0.9 ? 'text-yellow-300' : 'text-red-400'}>
                        {(supplier.deliveryRate * 100).toFixed(1)}%
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    <span className={supplier.pricingVariance <= 0.02 ? 'text-success-light' : supplier.pricingVariance <= 0.05 ? 'text-yellow-300' : 'text-red-400'}>
                        {(supplier.pricingVariance * 100).toFixed(1)}%
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierPerformanceTable;