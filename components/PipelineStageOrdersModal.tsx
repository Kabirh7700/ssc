
import React from 'react';
import { Order, Supplier } from '../types';
import { OrderStatus, ORDER_STATUS_COLORS } from '../constants';
import { formatDate } from '../utils/dateUtils';
import { XMarkIcon, PackageIcon } from './icons/DashboardIcons';

interface PipelineStageOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: OrderStatus | null;
  orders: Order[];
  suppliers: Supplier[];
  onOrderSelect: (order: Order) => void;
}

const PipelineStageOrdersModal: React.FC<PipelineStageOrdersModalProps> = ({
  isOpen,
  onClose,
  stage,
  orders,
  suppliers,
  onOrderSelect,
}) => {
  if (!isOpen || !stage) return null;

  const getSupplierName = (supplierId?: string): string => {
    return suppliers.find(s => s.id === supplierId)?.name || 'N/A';
  };

  const displayProductTypes = (order: Order): string => {
    if (!order.lineItems || order.lineItems.length === 0) return 'N/A';
    const uniqueProductTypes = Array.from(new Set(order.lineItems.map(li => li.productType)));
    if (uniqueProductTypes.length === 1) return uniqueProductTypes[0];
    if (uniqueProductTypes.length > 1) return `${uniqueProductTypes.length} Product Types`;
    return order.lineItems[0]?.productType || 'N/A'; 
  };

  const displaySuppliers = (order: Order): string => {
      if (!order.lineItems || order.lineItems.length === 0) return 'N/A';
      const uniqueSupplierIds = Array.from(new Set(order.lineItems.map(li => li.supplierId)));
      if (uniqueSupplierIds.length === 1) return getSupplierName(uniqueSupplierIds[0]);
      if (uniqueSupplierIds.length > 1) return `${uniqueSupplierIds.length} Suppliers`;
      return getSupplierName(order.lineItems[0]?.supplierId) || 'N/A'; 
  };

  // Ensure stage badge color is dark-theme friendly
  let stageBadgeClasses = ORDER_STATUS_COLORS[stage] || 'bg-neutral-500 text-neutral-100';
    if (stage === OrderStatus.FRESH_ORDER) stageBadgeClasses = 'bg-blue-500 text-white';
    else if (stage === OrderStatus.PRODUCTION) stageBadgeClasses = 'bg-purple-500 text-white';
    else if (stage === OrderStatus.READY_FOR_DISPATCH) stageBadgeClasses = 'bg-amber-500 text-neutral-800';
    else if (stage === OrderStatus.DELIVERED) stageBadgeClasses = 'bg-teal-500 text-white';
    else if (stage === OrderStatus.PAID) stageBadgeClasses = 'bg-green-500 text-white';
    else if (stage === OrderStatus.CANCELLED) stageBadgeClasses = 'bg-neutral-500 text-white';


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[90] transition-opacity duration-300 ease-in-out" 
         aria-labelledby="pipelineStageModalTitle" role="dialog" aria-modal="true">
      <div className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeIn">
        <header className="flex justify-between items-center p-4 border-b border-neutral-700 sticky top-0 bg-neutral-800 z-10">
          <h2 id="pipelineStageModalTitle" className="text-xl font-semibold text-primary">
            Orders in: <span className={`${stageBadgeClasses} px-2 py-1 rounded-md text-lg`}>{stage}</span> ({orders.length})
          </h2>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-neutral-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-2 sm:p-4 flex-grow overflow-y-auto">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
                <PackageIcon className="w-20 h-20 text-neutral-600 mb-4" />
                <h3 className="text-xl font-semibold text-neutral-100">No Orders in this Stage</h3>
                <p className="text-neutral-300">There are currently no orders in the "{stage}" stage that match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-700">
                <thead className="bg-neutral-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Client</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Product(s)</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Order Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Exp. Delivery</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider hidden md:table-cell">Supplier(s)</th>
                  </tr>
                </thead>
                <tbody className="bg-neutral-800 divide-y divide-neutral-700">
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => onOrderSelect(order)} 
                      className="hover:bg-neutral-700/70 cursor-pointer transition-colors duration-150"
                      tabIndex={0}
                      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onOrderSelect(order)}
                      aria-label={`View details for order ${order.id}`}
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-primary hover:underline">{order.id}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-200 truncate max-w-[120px] sm:max-w-xs">{order.clientName}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-300 truncate max-w-[100px] sm:max-w-xs">{displayProductTypes(order)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-300 hidden sm:table-cell">{formatDate(order.orderDate)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-300">{formatDate(order.expectedDeliveryDate)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-neutral-300 hidden md:table-cell truncate max-w-[100px] sm:max-w-xs">{displaySuppliers(order)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
        <footer className="p-4 border-t border-neutral-700 text-right sticky bottom-0 bg-neutral-800 z-10">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-neutral-900 font-semibold rounded-md hover:bg-primary-hover transition-colors"
            >
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default PipelineStageOrdersModal;