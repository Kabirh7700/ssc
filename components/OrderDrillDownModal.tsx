

import React from 'react';
import { Order, Supplier, StageHistoryItem, OrderLineItem, ClientPayment } from '../types';
import { OrderStatus, PRODUCT_TYPE_LIST, ORDER_STATUS_COLORS, DEFAULT_SLA_DAYS_PER_STAGE } from '../constants';
import { formatDate, daysBetween, getStageDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext'; 
import StageTimelineBar from './StageTimelineBar'; 
import {
    XMarkIcon, CalendarDaysIcon, ClockIcon, TruckIcon, DollarSignIcon, PackageIcon,
    CheckCircleIcon, XCircleIcon, MinusCircleIcon, DocumentTextIcon, BuildingStorefrontIcon,
    InfoIcon, UserCircleIcon, GlobeAltIcon, TagIcon, ArchiveBoxIcon, BanIcon,
    PencilIcon, WalletIcon as WalletIconOutline, 
    ReceiptPercentIcon, 
    CreditCardIcon, 
} from './icons/DashboardIcons'; 


const WalletIcon = WalletIconOutline; // Use imported WalletIconOutline


interface OrderDrillDownModalProps {
  order: Order | null;
  suppliers: Supplier[];
  onClose: () => void;
  onCancelOrder: (orderId: string, reason?: string) => void;
}

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value?: string | number | React.ReactNode, valueClass?: string, fullWidth?: boolean, alignTop?: boolean, smallText?: boolean }> =
    ({ icon, label, value, valueClass = 'text-neutral-100', fullWidth, alignTop, smallText }) => (
    <div className={`flex ${alignTop ? 'items-start' : 'items-center'} space-x-2 ${fullWidth ? 'col-span-1 md:col-span-2' : ''} ${smallText ? 'text-xs' : ''}`}>
        <div className={`flex-shrink-0 w-4 h-4 text-primary ${alignTop ? 'mt-0.5' : ''} ${smallText ? 'mt-px' :''}`}>{icon}</div>
        <div>
            <p className={`text-neutral-400 ${smallText ? 'text-xs' : 'text-sm'}`}>{label}</p>
            <p className={`${smallText ? 'text-sm' : 'text-md'} font-semibold ${valueClass}`}>{value || <span className="text-neutral-500">N/A</span>}</p>
        </div>
    </div>
);

const TimelineEvent: React.FC<{ date?: string, label: string, statusIcon?: React.ReactNode, details?: React.ReactNode}> = ({date, label, statusIcon, details}) => (
    <div className="flex items-center space-x-3">
        {statusIcon ? <div className="w-5 h-5">{statusIcon}</div> : <div className="w-5 h-5"></div>}
        <p className="text-sm font-medium text-neutral-200">{label}: <span className="font-normal text-neutral-300">{formatDate(date)}</span></p>
        {details && <div className="text-xs text-neutral-400">({details})</div>}
    </div>
);


const OrderDrillDownModal: React.FC<OrderDrillDownModalProps> = ({ order, suppliers, onClose, onCancelOrder }) => {
  const { currentUser } = useAuth(); 
  if (!order) return null;

  const isOrderCancelled = order.currentStage === OrderStatus.CANCELLED;
  const cancellationDate = order.stageHistory.find(s => s.stage === OrderStatus.CANCELLED)?.startDate;

  const productionStartDate = getStageDate(order.stageHistory, OrderStatus.PRODUCTION);
  const readyDate = getStageDate(order.stageHistory, OrderStatus.READY_FOR_DISPATCH);
  const dispatchDate = order.dispatchDate || getStageDate(order.stageHistory, OrderStatus.DELIVERED);

  const totalProductionTime = daysBetween(productionStartDate, readyDate);

  const totalPaidByClient = order.clientPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remainingBalanceClient = order.totalFinalPrice - totalPaidByClient;

  const getStageStatusIcon = (stageDate?: string, isDelayed?: boolean) => {
    if (isOrderCancelled && stageDate) return <MinusCircleIcon className="text-neutral-500" />;
    if (!stageDate) return <MinusCircleIcon className="text-neutral-500" />;
    if (isDelayed) return <XCircleIcon className="text-red-400" />;
    return <CheckCircleIcon className="text-green-400" />;
  };

  const getClientPaymentStatusDisplay = (): React.ReactNode => {
    if (isOrderCancelled) return <span className="text-neutral-400 font-semibold">N/A (Cancelled)</span>;
    switch (order.paymentStatus) {
        case 'Paid':
            return <span className="text-green-400 font-semibold flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1"/>Paid</span>;
        case 'Overdue':
            const overdueDays = order.expectedPaymentDate ? daysBetween(order.expectedPaymentDate, new Date().toISOString()) : null;
            return <span className="text-red-400 font-semibold flex items-center"><XCircleIcon className="w-4 h-4 mr-1"/>Overdue {overdueDays ? `(${overdueDays} days)` : ''}</span>;
        case 'Partially Paid':
            return <span className="text-sky-400 font-semibold flex items-center"><WalletIcon className="w-4 h-4 mr-1"/>Partially Paid</span>;
        case 'Pending':
            return <span className="text-yellow-400 font-semibold flex items-center"><ClockIcon className="w-4 h-4 mr-1"/>Pending</span>;
        default:
            return <span className="text-neutral-300 font-semibold">{order.paymentStatus}</span>;
    }
  };


  const uniqueSupplierIds = new Set(order.lineItems.map(li => li.supplierId));
  const involvedSuppliersCount = uniqueSupplierIds.size;

  const getSupplierNameById = (supplierId: string): string => {
    return suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
  };

  const handleCancelOrderClick = () => {
    const reason = prompt("Enter reason for cancellation (optional):");
    if (reason !== null) { 
        onCancelOrder(order.id, reason || undefined);
        onClose(); 
    }
  };

  const grossMargin = order.totalFinalPrice - order.totalSupplierCost;
  const grossMarginPercentage = order.totalFinalPrice > 0 ? (grossMargin / order.totalFinalPrice) * 100 : 0;

  let totalAdvanceDue = 0;
  let totalBeforeDispatchDue = 0;
  let totalBalanceDue = 0;

  order.lineItems.forEach(li => {
    if (li.supplierAdvancePaidAmount && !li.supplierAdvancePaidDate) {
      totalAdvanceDue += li.supplierAdvancePaidAmount;
    }
    if (li.supplierBeforePaidAmount && !li.supplierBeforePaidDate) {
      totalBeforeDispatchDue += li.supplierBeforePaidAmount;
    }
    if (li.supplierBalancePaidAmount && !li.supplierBalancePaidDate) {
      totalBalanceDue += li.supplierBalancePaidAmount;
    }
  });
  
  const grandTotalSupplierPaymentsDue = totalAdvanceDue + totalBeforeDispatchDue + totalBalanceDue;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out">
      <div className={`bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeIn ${isOrderCancelled ? 'border-t-4 border-neutral-500' : 'border-t-4 border-primary'}`}>
        <header className="flex justify-between items-center p-4 border-b border-neutral-700">
          <div>
            <h2 className="text-xl font-semibold text-primary">Order Details: {order.id}</h2>
            {isOrderCancelled && (
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-neutral-500 text-white ml-2">CANCELLED</span>
            )}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-100">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          {isOrderCancelled && order.reasonForCancellation && (
             <div className="p-3 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-sm text-yellow-300">
                <strong>Reason for Cancellation:</strong> {order.reasonForCancellation}
            </div>
          )}
          <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Client & Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem icon={<UserCircleIcon />} label="Client Name" value={order.clientName} />
              <DetailItem icon={<GlobeAltIcon />} label="Client Country" value={order.clientCountry} />
              <DetailItem icon={<ArchiveBoxIcon />} label="Total Items" value={order.totalQuantity.toString()} />
              <DetailItem icon={<DollarSignIcon />} label="Order Value (Client)" valueClass="text-green-400 font-bold" value={`$${order.totalFinalPrice.toLocaleString()}`} />
              <DetailItem icon={<BuildingStorefrontIcon />} label="Suppliers Involved" value={involvedSuppliersCount.toString()} />
              <DetailItem icon={<DollarSignIcon />} label="Total Cost (Supplier)" valueClass="text-red-400" value={`$${order.totalSupplierCost.toLocaleString()}`} />
              <DetailItem
                icon={<ReceiptPercentIcon className="w-4 h-4"/>} 
                label="Gross Margin"
                valueClass={grossMargin >= 0 ? 'text-green-400' : 'text-red-400'}
                value={<>$ {grossMargin.toLocaleString()} ({grossMarginPercentage.toFixed(1)}%)</>}
              />
            </div>
          </section>

          <section>
             <h3 className="text-lg font-semibold text-neutral-100 mb-1">Visual Stage Timeline</h3>
             <StageTimelineBar
                stageHistory={order.stageHistory}
                orderDate={order.orderDate}
                currentStage={order.currentStage}
                expectedDeliveryDate={order.expectedDeliveryDate}
                actualDeliveryDate={order.actualDeliveryDate}
                isCancelled={isOrderCancelled}
                cancellationDate={cancellationDate}
             />
          </section>

          <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Order Line Items ({order.lineItems.length})</h3>
            <div className={`space-y-4 ${isOrderCancelled ? 'opacity-60' : ''}`}>
              {order.lineItems.map((item) => {
                return (
                  <div key={item.id} className="p-4 border border-neutral-700 rounded-lg bg-neutral-700/50 shadow-sm">
                    <div className="flex justify-between items-start mb-3 pb-2 border-b border-neutral-600">
                        <h4 className="font-semibold text-md text-primary-light flex items-center">
                            <TagIcon className="w-5 h-5 mr-2"/> {item.productName} (Qty: {item.quantity})
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-neutral-600 text-neutral-300 rounded-full">{item.productType}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="space-y-2">
                           <p className="text-sm font-medium text-neutral-300 mb-1">Supplier Info:</p>
                           <DetailItem smallText icon={<BuildingStorefrontIcon />} label="Supplier" value={getSupplierNameById(item.supplierId)} valueClass="text-neutral-200" />
                        </div>

                        <div className="space-y-2">
                           <p className="text-sm font-medium text-neutral-300 mb-1">Supplier Production & Dispatch:</p>
                           <DetailItem smallText icon={<CalendarDaysIcon />} label="Prod. Start Date" value={formatDate(item.supplierProductionStartDate)} valueClass="text-neutral-200" />
                           <DetailItem smallText icon={<CalendarDaysIcon />} label="Exp. Dispatch Date" value={formatDate(item.supplierExpectedDispatchDate)} valueClass="text-neutral-200" />
                           <DetailItem smallText icon={<TruckIcon />} label="Actual Dispatch Date" value={formatDate(item.supplierActualDispatchDate)} valueClass="text-neutral-200" />
                           <DetailItem smallText icon={<DocumentTextIcon />} label="B/L Number" value={item.supplierBLNumber} valueClass="text-neutral-200" />
                        </div>

                        {(item.supplierPaymentTerms || item.supplierAdvancePaidAmount || item.supplierBeforePaidAmount || item.supplierBalancePaidAmount) && (
                            <div className="md:col-span-2 pt-2 mt-2 border-t border-neutral-600 space-y-2">
                                <p className="text-sm font-medium text-neutral-300 mb-1">Payment to Supplier (for this item):</p>
                                <DetailItem smallText icon={<PencilIcon />} label="Payment Terms" value={item.supplierPaymentTerms} valueClass="text-neutral-200" />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                                  {item.supplierAdvancePaidAmount !== undefined && <DetailItem smallText icon={<DollarSignIcon />} label="Advance Paid" valueClass={item.supplierAdvancePaidDate ? 'text-green-400' : 'text-yellow-400'} value={`$${item.supplierAdvancePaidAmount.toLocaleString()}${item.supplierAdvancePaidDate ? ` on ${formatDate(item.supplierAdvancePaidDate)}` : ' (Due)'}`} />}
                                  {item.supplierBeforePaidAmount !== undefined && <DetailItem smallText icon={<DollarSignIcon />} label="Before Disp. Paid" valueClass={item.supplierBeforePaidDate ? 'text-green-400' : 'text-yellow-400'} value={`$${item.supplierBeforePaidAmount.toLocaleString()}${item.supplierBeforePaidDate ? ` on ${formatDate(item.supplierBeforePaidDate)}` : ' (Due)'}`} />}
                                  {item.supplierBalancePaidAmount !== undefined && <DetailItem smallText icon={<DollarSignIcon />} label="Balance Paid" valueClass={item.supplierBalancePaidDate ? 'text-green-400' : 'text-yellow-400'} value={`$${item.supplierBalancePaidAmount.toLocaleString()}${item.supplierBalancePaidDate ? ` on ${formatDate(item.supplierBalancePaidDate)}` : ' (Due)'}`} />}
                                </div>
                            </div>
                        )}

                        {item.supplierNotes && ( 
                            <div className="md:col-span-2 pt-2 mt-2 border-t border-neutral-600 space-y-2">
                               {item.supplierNotes && <DetailItem smallText icon={<InfoIcon />} label="Supplier Notes" value={item.supplierNotes} alignTop valueClass="text-neutral-200" />}
                            </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

           <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Aggregate Payments to Suppliers (Due)</h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-md ${isOrderCancelled ? 'opacity-60 bg-neutral-700/50 border-neutral-600' : 'bg-primary/10 border-primary/30'}`}>
                <DetailItem icon={<WalletIconOutline />} label="Total Advance Due" valueClass={totalAdvanceDue > 0 ? 'text-yellow-300 font-bold' : 'text-neutral-100'} value={`$${totalAdvanceDue.toLocaleString()}`} />
                <DetailItem icon={<WalletIconOutline />} label="Total Pre-Dispatch Due" valueClass={totalBeforeDispatchDue > 0 ? 'text-yellow-300 font-bold' : 'text-neutral-100'} value={`$${totalBeforeDispatchDue.toLocaleString()}`} />
                <DetailItem icon={<WalletIconOutline />} label="Total Balance Due" valueClass={totalBalanceDue > 0 ? 'text-yellow-300 font-bold' : 'text-neutral-100'} value={`$${totalBalanceDue.toLocaleString()}`} />
                
                <div className="md:col-span-2 mt-2 pt-2 border-t border-primary/40">
                    <DetailItem 
                        icon={<DollarSignIcon />} 
                        label="Grand Total Supplier Payments Due" 
                        value={`$${grandTotalSupplierPaymentsDue.toLocaleString()}`}
                        valueClass="text-lg font-bold text-neutral-50"
                    />
                </div>
            </div>
          </section>


          <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Key Dates & Lifecycle Events</h3>
            <div className={`space-y-3 pl-2 border-l-2 ml-2.5 ${isOrderCancelled ? 'border-neutral-600 opacity-60' : 'border-neutral-700'}`}>
                <TimelineEvent date={order.orderDate} label={OrderStatus.FRESH_ORDER} statusIcon={getStageStatusIcon(order.orderDate)}/>
                <TimelineEvent date={productionStartDate} label="Production Started" statusIcon={getStageStatusIcon(productionStartDate, order.stageHistory.find(s=>s.stage===OrderStatus.PRODUCTION)?.isDelayed)}
                               details={daysBetween(order.orderDate, productionStartDate) !== null ? `${daysBetween(order.orderDate, productionStartDate)} days from order` : undefined} />
                <TimelineEvent date={readyDate} label="Ready for Dispatch" statusIcon={getStageStatusIcon(readyDate, order.stageHistory.find(s=>s.stage===OrderStatus.READY_FOR_DISPATCH)?.isDelayed)}
                               details={totalProductionTime !== null ? `${totalProductionTime} days production` : undefined} />
                <TimelineEvent date={dispatchDate} label="Dispatched" statusIcon={getStageStatusIcon(dispatchDate, order.stageHistory.find(s=>s.stage===OrderStatus.DELIVERED)?.isDelayed)}
                               details={daysBetween(readyDate, dispatchDate) !== null ? `${daysBetween(readyDate, dispatchDate)} days from ready` : undefined} />
                <TimelineEvent date={order.actualDeliveryDate} label="Delivered to Client" statusIcon={getStageStatusIcon(order.actualDeliveryDate)} />
                <TimelineEvent
                    date={order.actualPaymentDate} 
                    label="Client Payment Finalized"
                    statusIcon={getStageStatusIcon(order.actualPaymentDate, order.paymentStatus === 'Overdue' && totalPaidByClient < order.totalFinalPrice )}
                    details={getClientPaymentStatusDisplay()} />
                {isOrderCancelled && cancellationDate && (
                    <TimelineEvent
                        date={cancellationDate}
                        label="Order Cancelled"
                        statusIcon={<BanIcon className="text-neutral-400"/>}
                        details={order.reasonForCancellation}
                    />
                )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-neutral-100 mb-3">Client Payment Details</h3>
             <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-md ${isOrderCancelled ? 'opacity-60 bg-neutral-700/50 border-neutral-600' : 'bg-sky-500/10 border-sky-500/30'}`}>
                <DetailItem icon={<DollarSignIcon />} label="Total Client Price" valueClass="text-lg font-bold text-neutral-50" value={`$${order.totalFinalPrice.toLocaleString()}`} />
                <DetailItem icon={<WalletIcon />} label="Total Paid by Client" valueClass="text-lg text-green-400 font-bold" value={`$${totalPaidByClient.toLocaleString()}`} />
                <DetailItem icon={<DollarSignIcon />} label="Remaining Balance" valueClass={`text-lg font-bold ${remainingBalanceClient > 0 ? 'text-red-400' : 'text-green-400'}`} value={`$${remainingBalanceClient.toLocaleString()}`} />
                <DetailItem icon={<ClockIcon />} label="Overall Payment Status" value={getClientPaymentStatusDisplay()} />
                <DetailItem icon={<CalendarDaysIcon />} label="Expected Final Payment Date" value={isOrderCancelled ? 'N/A' : formatDate(order.expectedPaymentDate)} valueClass="text-neutral-200" />
                {order.actualPaymentDate && order.paymentStatus === 'Paid' && !isOrderCancelled && (
                    <DetailItem icon={<CheckCircleIcon className="text-green-400" />} label="Actual Full Payment Date" value={formatDate(order.actualPaymentDate)} valueClass="text-neutral-200" />
                )}
             </div>
             {order.clientPayments.length > 0 && !isOrderCancelled && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold text-neutral-200 mb-2">Payment History:</h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto border border-neutral-700 rounded-md p-3 bg-neutral-700/60">
                        {order.clientPayments.map(payment => (
                            <li key={payment.id} className="text-sm p-2 border-b border-neutral-600 last:border-b-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-neutral-100">${payment.amountPaid.toLocaleString()}</span>
                                    <span className="text-neutral-400">{formatDate(payment.paymentDate)}</span>
                                </div>
                                {payment.paymentMethod && <p className="text-xs text-neutral-400">Method: {payment.paymentMethod}</p>}
                                {payment.notes && <p className="text-xs text-neutral-400 mt-0.5">Note: {payment.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
             )}
             {order.clientPayments.length === 0 && !isOrderCancelled && (
                <p className="text-sm text-neutral-400 mt-3">No client payments recorded for this order yet.</p>
             )}
          </section>


          {order.orderNotes && (
            <section className={`${isOrderCancelled ? 'opacity-60' : ''}`}>
                <h3 className="text-lg font-semibold text-neutral-100 mb-3">Overall Order Notes</h3>
                <div className="flex items-start space-x-2 p-3 bg-sky-500/10 rounded-md border border-sky-500/30">
                    <InfoIcon className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-200">{order.orderNotes}</p>
                </div>
            </section>
          )}

        </main>
        <footer className="p-4 border-t border-neutral-700 flex justify-end items-center space-x-3 sticky bottom-0 bg-neutral-800">
            {!isOrderCancelled && currentUser?.role === 'admin' && (
              <>
                <button
                    onClick={handleCancelOrderClick}
                    className="px-4 py-2 bg-danger text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
                >
                    <BanIcon className="w-4 h-4 mr-2"/> Mark as Cancelled
                </button>
              </>
            )}
            <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-600 text-neutral-100 rounded-md hover:bg-neutral-500 transition-colors"
            >
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default OrderDrillDownModal;