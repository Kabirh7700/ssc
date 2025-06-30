
import React, { useState, useMemo } from 'react';
import { Order, Supplier } from '../types';
import { OrderStatus, ORDER_STATUS_COLORS } from '../constants';
import { formatDate } from '../utils/dateUtils';
import { ChevronUpIcon, ChevronDownIcon, ArrowsUpDownIcon, PackageIcon } from './icons/DashboardIcons';

interface OrderListTableProps {
  orders: Order[];
  suppliers: Supplier[];
  onOrderSelect: (order: Order) => void;
  isLoading: boolean;
}

type SortableOrderKeys = keyof Pick<Order, 'id' | 'clientName' | 'currentStage' | 'expectedDeliveryDate' | 'paymentStatus' | 'orderDate' | 'totalFinalPrice' | 'totalQuantity'>;

const OrderListTable: React.FC<OrderListTableProps> = ({ orders, suppliers, onOrderSelect, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortableOrderKeys; direction: 'ascending' | 'descending' } | null>(null);
  const itemsPerPage = 10;

  const sortedOrders = useMemo(() => {
    let sortableItems = [...orders];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (sortConfig.key === 'expectedDeliveryDate' || sortConfig.key === 'orderDate') {
             const dateA = new Date(valA as string).getTime();
             const dateB = new Date(valB as string).getTime();
             if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
             if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
             return 0;
        }
        if (sortConfig.key === 'totalFinalPrice' || sortConfig.key === 'totalQuantity') {
            if ((valA as number) < (valB as number)) return sortConfig.direction === 'ascending' ? -1 : 1;
            if ((valA as number) > (valB as number)) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }

        if ((valA as string).toLowerCase() < (valB as string).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((valA as string).toLowerCase() > (valB as string).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [orders, sortConfig]);

  const requestSort = (key: SortableOrderKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortIcon: React.FC<{ columnKey: SortableOrderKeys }> = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowsUpDownIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 ml-1" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ChevronUpIcon className="w-4 h-4 text-primary ml-1" />;
    }
    return <ChevronDownIcon className="w-4 h-4 text-primary ml-1" />;
  };


  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  if (isLoading) {
    return (
        <div className="bg-neutral-700 p-6 shadow-lg rounded-lg text-center border border-neutral-600/70">
            <p className="text-neutral-300">Loading orders...</p>
        </div>
    );
  }

  if (orders.length === 0 && !isLoading) {
    return (
        <div className="bg-neutral-700 p-6 shadow-lg rounded-lg text-center flex flex-col items-center justify-center h-64 border border-neutral-600/70">
            <PackageIcon className="w-16 h-16 text-neutral-500 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-100">No Orders Found</h3>
            <p className="text-neutral-300">There are no orders matching your current filters.</p>
        </div>
    );
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
      <nav className="flex items-center justify-between border-t border-neutral-600 bg-neutral-700 text-neutral-300 px-4 py-3 sm:px-6 mt-0 rounded-b-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-neutral-500 bg-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-neutral-500 bg-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-neutral-300">
              Showing <span className="font-medium text-neutral-100">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-neutral-100">{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</span> of{' '}
              <span className="font-medium text-neutral-100">{sortedOrders.length}</span> results
            </p>
          </div>
          <div>
            <ul className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <li>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-500 hover:bg-neutral-600 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDownIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                </button>
              </li>
              {startPage > 1 && (
                <>
                  <li>
                    <button onClick={() => setCurrentPage(1)} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-200 ring-1 ring-inset ring-neutral-500 hover:bg-neutral-600">1</button>
                  </li>
                  {startPage > 2 && <li className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-400 ring-1 ring-inset ring-neutral-500">...</li>}
                </>
              )}
              {pageNumbers.map(number => (
                <li key={number}>
                  <button
                    onClick={() => setCurrentPage(number)}
                    aria-current={currentPage === number ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === number ? 'z-10 bg-primary text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-neutral-200 ring-1 ring-inset ring-neutral-500 hover:bg-neutral-600'}`}
                  >
                    {number}
                  </button>
                </li>
              ))}
               {endPage < totalPages && (
                <>
                  {endPage < totalPages -1 && <li className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-400 ring-1 ring-inset ring-neutral-500">...</li>}
                  <li>
                    <button onClick={() => setCurrentPage(totalPages)} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-neutral-200 ring-1 ring-inset ring-neutral-500 hover:bg-neutral-600">{totalPages}</button>
                  </li>
                </>
              )}
              <li>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-500 hover:bg-neutral-600 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronUpIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  };

  const tableHeaders: { key: SortableOrderKeys; label: string; class?: string }[] = [
      { key: 'id', label: 'Order ID' }, { key: 'clientName', label: 'Client' },
      { key: 'totalQuantity', label: 'Items (Qty)' }, { key: 'orderDate', label: 'Order Date'},
      { key: 'currentStage', label: 'Stage' }, { key: 'expectedDeliveryDate', label: 'Exp. Delivery' },
      { key: 'totalFinalPrice', label: 'Client Price'}, { key: 'paymentStatus', label: 'Payment' },
  ];

  return (
    <div className="bg-neutral-700 shadow-lg rounded-lg border border-neutral-600/70">
      <h2 className="text-xl font-semibold text-neutral-100 p-4 border-b border-neutral-600">Order Overview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-600">
          <thead className="bg-neutral-600/50">
            <tr>
              {tableHeaders.map(({key, label, class: className}) => (
                <th
                  key={key} scope="col" onClick={() => requestSort(key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider cursor-pointer group ${className || ''}`}
                >
                  <span className="flex items-center">{label} <SortIcon columnKey={key} /></span>
                </th>
              ))}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Suppliers</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-700 divide-y divide-neutral-600">
            {paginatedOrders.map((order) => {
              const uniqueSuppliersCount = new Set(order.lineItems.map(li => li.supplierId)).size;
              const isCancelled = order.currentStage === OrderStatus.CANCELLED;
              
              // Use stage colors from constants.ts, ensure they are dark-theme friendly or override here
              let stageClasses = ORDER_STATUS_COLORS[order.currentStage] || 'bg-neutral-500 text-neutral-100';
              // Example specific overrides for dark theme if constants aren't updated yet:
              if (order.currentStage === OrderStatus.FRESH_ORDER) stageClasses = 'bg-blue-500 text-white';
              else if (order.currentStage === OrderStatus.PRODUCTION) stageClasses = 'bg-purple-500 text-white';
              else if (order.currentStage === OrderStatus.READY_FOR_DISPATCH) stageClasses = 'bg-amber-500 text-neutral-800'; // Amber needs dark text
              else if (order.currentStage === OrderStatus.DELIVERED) stageClasses = 'bg-teal-500 text-white';
              else if (order.currentStage === OrderStatus.PAID) stageClasses = 'bg-green-500 text-white';
              else if (order.currentStage === OrderStatus.CANCELLED) stageClasses = 'bg-neutral-500 text-white';


              let paymentStatusColorClass = 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'; // Pending
              if (order.paymentStatus === 'Paid') paymentStatusColorClass = 'bg-green-500/30 text-green-200 border border-green-500/50';
              else if (order.paymentStatus === 'Overdue') paymentStatusColorClass = 'bg-red-500/30 text-red-200 border border-red-500/50';
              else if (order.paymentStatus === 'Partially Paid') paymentStatusColorClass = 'bg-blue-500/30 text-blue-200 border border-blue-500/50';


              return (
                <tr
                    key={order.id}
                    onClick={() => onOrderSelect(order)}
                    className={`hover:bg-neutral-600/80 cursor-pointer transition-colors duration-150 ${isCancelled ? 'opacity-60' : ''}`}
                >
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isCancelled ? 'text-neutral-400 line-through' : 'text-primary hover:underline'}`}>{order.id}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-200'}`}>{order.clientName}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>
                    {order.lineItems.length > 1 ? `${order.lineItems.length} lines` : `${order.lineItems[0]?.productType || 'N/A'}`}<br/>
                    <span className={`text-xs ${isCancelled ? 'text-neutral-500' : 'text-neutral-400'}`}>({order.totalQuantity} units)</span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>{formatDate(order.orderDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${stageClasses}`}>
                      {order.currentStage}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>{formatDate(order.expectedDeliveryDate)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>${order.totalFinalPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isCancelled ? (
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[OrderStatus.CANCELLED] || 'bg-neutral-500 text-white'}`}>
                            N/A
                       </span>
                    ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColorClass}`}>
                        {order.paymentStatus}
                        </span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isCancelled ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>
                    {uniqueSuppliersCount > 1 ? `${uniqueSuppliersCount} Suppliers` : getSupplierNameById(order.lineItems[0]?.supplierId, suppliers) || 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

const getSupplierNameById = (supplierId: string | undefined, suppliers: Supplier[]): string | undefined => {
  if (!supplierId) return undefined;
  return suppliers.find(s => s.id === supplierId)?.name;
};

export default OrderListTable;