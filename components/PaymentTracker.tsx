
import React from 'react';
import { Order } from '../types';
import { DownloadIcon } from './icons/DashboardIcons';
import { OrderStatus } from '../constants'; 
import { formatDate } from '../utils/dateUtils';

interface PaymentTrackerProps {
  orders: Order[];
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({ orders }) => {
  const paymentOrders = orders.filter(o =>
    o.currentStage !== OrderStatus.CANCELLED && 
    (
      o.currentStage === OrderStatus.DELIVERED ||
      o.currentStage === OrderStatus.PAID || 
      o.paymentStatus === 'Overdue' ||
      o.paymentStatus === 'Partially Paid' || 
      (o.paymentStatus === 'Pending' && o.expectedPaymentDate) 
    )
  );

  if (paymentOrders.length === 0) {
    return <div className="p-4 text-center text-neutral-400 bg-neutral-700 rounded-lg border border-neutral-600/70">No client payment data to display for current filters.</div>;
  }

  const exportToCSV = () => {
    const headers = ['Order ID', 'Client Name', 'Total Client Price ($)', 'Total Paid by Client ($)', 'Remaining Balance ($)', 'Payment Status', 'Expected Final Payment Date'];
    const rows = paymentOrders.map(order => {
        const totalPaidByClient = order.clientPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const remainingBalance = order.totalFinalPrice - totalPaidByClient;
        return [
            order.id,
            order.clientName,
            order.totalFinalPrice.toLocaleString(),
            totalPaidByClient.toLocaleString(),
            remainingBalance.toLocaleString(),
            order.paymentStatus,
            order.expectedPaymentDate ? formatDate(order.expectedPaymentDate) : 'N/A',
        ];
    });

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "client_payment_tracker_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-neutral-700 p-4 shadow-lg rounded-lg border border-neutral-600/70">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">Client Payment Tracker</h3>
        <button
            onClick={exportToCSV}
            className="px-3 py-1.5 border border-primary text-primary rounded-md text-sm hover:bg-primary hover:text-neutral-900 transition-colors flex items-center"
            title="Download Client Payment Report (CSV)"
        >
            <DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-neutral-600">
          <thead className="bg-neutral-600/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Total Client Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Total Paid</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Remaining Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Payment Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Expected Date</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-700 divide-y divide-neutral-600">
            {paymentOrders.map((order) => {
              const totalPaidByClient = order.clientPayments.reduce((sum, p) => sum + p.amountPaid, 0);
              const remainingBalance = order.totalFinalPrice - totalPaidByClient;
              // Dark theme friendly status colors
              let statusColorClass = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'; // Pending
              if (order.paymentStatus === 'Paid') statusColorClass = 'bg-green-500/20 text-green-300 border border-green-500/40';
              else if (order.paymentStatus === 'Overdue') statusColorClass = 'bg-red-500/20 text-red-300 border border-red-500/40';
              else if (order.paymentStatus === 'Partially Paid') statusColorClass = 'bg-blue-500/20 text-blue-300 border border-blue-500/40';

              return (
                <tr key={order.id} className="hover:bg-neutral-600/70 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-100">{order.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300 truncate max-w-xs" title={order.clientName}>{order.clientName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300">${order.totalFinalPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400">${totalPaidByClient.toLocaleString()}</td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${remainingBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ${remainingBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorClass}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-300">{order.expectedPaymentDate ? formatDate(order.expectedPaymentDate) : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentTracker;