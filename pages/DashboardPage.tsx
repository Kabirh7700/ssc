

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import FiltersBar from '../components/FiltersBar';
import OrderPipeline from '../components/OrderPipeline';
import KpiCard from '../components/KpiCard';
import CountryDistributionChart from '../components/charts/CountryDistributionChart';
import SupplierPerformanceTable from '../components/SupplierPerformanceTable';
import PaymentTracker from '../components/PaymentTracker';
// import PricingSummaryChart from '../components/charts/PricingSummaryChart'; // Removed import
import OrderListTable from '../components/OrderListTable';
import OrderDrillDownModal from '../components/OrderDrillDownModal';
import PipelineStageOrdersModal from '../components/PipelineStageOrdersModal';
import DataManagementPanel from '../components/DataManagementPanel';
import UserManagementModal from '../components/UserManagementModal';

// New Chart Imports
import OrderTrendsChart from '../components/charts/OrderTrendsChart';
import ProductPopularityChart from '../components/charts/ProductPopularityChart';
import ClientPaymentStatusChart from '../components/charts/ClientPaymentStatusChart';


import { useMockData } from '../hooks/useMockData';
import { useAuth } from '../contexts/AuthContext';
import { Kpi, Order, FilterOptions, Supplier, ProductType, ManagedUser, UserRole } from '../types';
import { PackageIcon, DollarSignIcon, AlertTriangleIcon, GlobeAltIcon, ArchiveBoxIcon, BanIcon, WalletIcon, ReceiptPercentIcon, CreditCardIcon, TruckIcon } from '../components/icons/DashboardIcons';
import { OrderStatus } from '../constants';

const AUTO_REFRESH_INTERVAL = 60 * 1000; // 1 minute

const calculateKPIs = (
    ordersToDisplay: Order[],
    allOrdersInCurrentMode: Order[]
): Kpi[] => {

  const nonCancelledOrdersInView = ordersToDisplay.filter(o => o.currentStage !== OrderStatus.CANCELLED);
  const totalNonCancelledOrdersOverall = allOrdersInCurrentMode.filter(o => o.currentStage !== OrderStatus.CANCELLED).length;

  const totalOrdersInView = ordersToDisplay.length;

  // --- Calculate stats for orders in the current filtered view ---
  let overdueClientPaymentsCount = 0;
  let totalSupplierAdvanceDue = 0;
  let totalSupplierPreDispatchDue = 0;
  let totalSupplierBalanceDue = 0;

  nonCancelledOrdersInView.forEach(order => {
    if (order.paymentStatus === 'Overdue') overdueClientPaymentsCount++;

    order.lineItems.forEach(li => {
      if (li.supplierAdvancePaidAmount && !li.supplierAdvancePaidDate) {
        totalSupplierAdvanceDue += li.supplierAdvancePaidAmount;
      }
      if (li.supplierBeforePaidAmount && !li.supplierBeforePaidDate) {
        totalSupplierPreDispatchDue += li.supplierBeforePaidAmount;
      }
      if (li.supplierBalancePaidAmount && !li.supplierBalancePaidDate) {
        totalSupplierBalanceDue += li.supplierBalancePaidAmount;
      }
    });
  });

  // --- Calculate stats for ALL delivered orders (All Time) as per user request ---
  const allTimeDeliveredOrders = allOrdersInCurrentMode.filter(
    o => o.currentStage === OrderStatus.DELIVERED || o.currentStage === OrderStatus.PAID
  );

  const totalDeliveredOrdersCount = allTimeDeliveredOrders.length;
  let totalItemsSoldFromDelivered = 0;
  let totalClientValueFromDelivered = 0;
  let totalCollectedFromDelivered = 0;

  allTimeDeliveredOrders.forEach(order => {
    totalItemsSoldFromDelivered += order.totalQuantity;
    totalClientValueFromDelivered += order.totalFinalPrice;
    
    if (order.paymentStatus === 'Paid') {
      // If the order is marked as 'Paid', the collected amount is the full price,
      // aligning with the logic in other UI components.
      totalCollectedFromDelivered += order.totalFinalPrice;
    } else {
      // For other statuses (like 'Partially Paid'), sum up the actual recorded payments.
      totalCollectedFromDelivered += order.clientPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    }
  });

  const overallDelayedOrdersCount = allOrdersInCurrentMode.filter(o => {
    if (o.currentStage === OrderStatus.CANCELLED) return false;
    for (const historyItem of o.stageHistory) {
        if (historyItem.isDelayed && historyItem.stage !== OrderStatus.PAID && historyItem.stage !== OrderStatus.CANCELLED) {
            return true;
        }
    }
    return false;
  }).length;


  return [
    // --- User-requested KPIs (based on All-Time data) ---
    { title: 'Total Orders Delivered', value: totalDeliveredOrdersCount, unit: '(All Time)', icon: <TruckIcon className="w-6 h-6 text-sky-400"/>, status: 'good' },
    { title: 'Total Items Sold', value: totalItemsSoldFromDelivered, unit: '(From Delivered)', icon: <ArchiveBoxIcon className="w-6 h-6 text-emerald-400"/>, status: 'good' },
    { title: 'Total Client Value', value: `$${totalClientValueFromDelivered.toLocaleString()}`, unit:`(Collected: $${totalCollectedFromDelivered.toLocaleString()})`, icon: <WalletIcon className="w-6 h-6 text-amber-400"/>, status: 'good' },

    // --- Other KPIs (View-based or All-Time where appropriate) ---
    { title: 'Orders (Active View)', value: totalOrdersInView, icon: <PackageIcon className="w-6 h-6"/>, status: 'good' },
    {
      title: 'Delayed Orders',
      value: overallDelayedOrdersCount,
      unit: `(${(totalNonCancelledOrdersOverall > 0 ? (overallDelayedOrdersCount / totalNonCancelledOrdersOverall) * 100 : 0).toFixed(0)}% of total)`,
      icon: <AlertTriangleIcon className="w-6 h-6"/>,
      status: totalNonCancelledOrdersOverall > 0 && overallDelayedOrdersCount / totalNonCancelledOrdersOverall > 0.2 ? 'danger' : totalNonCancelledOrdersOverall > 0 && overallDelayedOrdersCount / totalNonCancelledOrdersOverall > 0.1 ? 'warning' : 'good'
    },
    {
      title: 'Overdue Client Payments',
      value: overdueClientPaymentsCount,
      unit:'(In View)',
      icon: <DollarSignIcon className="w-6 h-6"/>,
      status: overdueClientPaymentsCount > 5 ? 'danger' : overdueClientPaymentsCount > 2 ? 'warning' : 'good'
    },
    { title: 'Supplier Adv. Due', value: `$${totalSupplierAdvanceDue.toLocaleString()}`, icon: <ReceiptPercentIcon className="w-6 h-6"/>, status: totalSupplierAdvanceDue > 20000 ? 'danger' : totalSupplierAdvanceDue > 5000 ? 'warning' : 'good', unit: '(In View)' },
    { title: 'Supplier Pre-Disp. Due', value: `$${totalSupplierPreDispatchDue.toLocaleString()}`, icon: <ReceiptPercentIcon className="w-6 h-6"/>, status: totalSupplierPreDispatchDue > 20000 ? 'danger' : totalSupplierPreDispatchDue > 5000 ? 'warning' : 'good', unit: '(In View)' },
    { title: 'Supplier Balance Due', value: `$${totalSupplierBalanceDue.toLocaleString()}`, icon: <ReceiptPercentIcon className="w-6 h-6"/>, status: totalSupplierBalanceDue > 20000 ? 'danger' : totalSupplierBalanceDue > 5000 ? 'warning' : 'good', unit: '(In View)' },
  ];
};


const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState(''); 
  const {
    orders, suppliers: activeSuppliers, 
    filters, setFilters, isLoading: dataLoading, setIsLoading,
    allOrders, dataMode, loadLiveOrdersAndSuppliers, switchToMockData,
    processingErrors, setProcessingErrors, dataStats,
    updateOrder, cancelOrder, attemptLoadFromDefaultSheets,
  } = useMockData(searchTerm); 

  const { currentUser, managedUsers, addManagedUser, deleteManagedUser, updateManagedUserRole } = useAuth();

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  const [selectedOrderForDrillDown, setSelectedOrderForDrillDown] = useState<Order | null>(null);
  const [isDrillDownModalOpen, setIsDrillDownModalOpen] = useState(false);

  const [selectedPipelineStage, setSelectedPipelineStage] = useState<OrderStatus | null>(null);
  const [ordersInSelectedStage, setOrdersInSelectedStage] = useState<Order[]>([]);
  const [isPipelineStageModalOpen, setIsPipelineStageModalOpen] = useState(false);

  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false); 


  const uniqueClientCountries = useMemo(() => 
    Array.from(new Set(allOrders.map(order => order.clientCountry))).sort(), 
    [allOrders]
  );

  const uniqueProductTypes = useMemo(() => 
    Array.from(new Set(allOrders.flatMap(order => order.lineItems.map(item => item.productType)))).sort() as ProductType[],
    [allOrders]
  );
  
  const uniqueYears = useMemo(() => {
    const years = new Set(allOrders.map(order => new Date(order.orderDate).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending for newest first
  }, [allOrders]);
  
  const nonCancelledOrdersForCharts = useMemo(() => 
    orders.filter(o => o.currentStage !== OrderStatus.CANCELLED), 
    [orders] 
  );
  
  const performRefresh = useCallback(async (isAuto: boolean = false) => {
    console.log(`performRefresh called. isAuto: ${isAuto}, dataMode: ${dataMode}, isRefreshing (manual UI): ${isRefreshing}, isAutoRefreshing (lock): ${isAutoRefreshing}`);
    if (dataMode !== 'live') {
      if (!isAuto) console.log("Refresh: Not in live mode (manual call).");
      return;
    }

    if (isAuto) {
        if (isAutoRefreshing) {
            console.log("Refresh: Auto-refresh skipped, another auto-refresh is already in progress.");
            return;
        }
        console.log("Refresh: Starting auto-refresh.");
        setIsAutoRefreshing(true); 
    } else { 
        if (isRefreshing) {
            console.log("Refresh: Manual refresh skipped, manual refresh already in progress (UI).");
            return;
        }
        console.log("Refresh: Starting manual refresh (UI).");
        setIsRefreshing(true); 
    }

    const success = await attemptLoadFromDefaultSheets(false, isAuto); 
    if (success) {
      console.log("Refresh: Succeeded. Updating lastRefreshed.");
      setLastRefreshed(new Date());
    } else {
      console.warn("Refresh: Failed. Errors might be in Data Management Panel.");
    }

    if (isAuto) {
        console.log("Refresh: Ending auto-refresh. Releasing lock.");
        setIsAutoRefreshing(false); 
    } else {
        console.log("Refresh: Ending manual refresh (UI).");
        setIsRefreshing(false); 
    }
  }, [
    dataMode,
    attemptLoadFromDefaultSheets,
    isRefreshing, 
    setIsRefreshing, 
    isAutoRefreshing, 
    setIsAutoRefreshing, 
    setLastRefreshed
  ]);


  const performRefreshRef = useRef(performRefresh);
  useEffect(() => {
    performRefreshRef.current = performRefresh;
  }, [performRefresh]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (dataMode === 'live') {
      console.log("Setting up auto-refresh interval for live mode.");
      intervalId = window.setInterval(() => {
        console.log("Auto-refresh: Interval triggered.");
        performRefreshRef.current(true); 
      }, AUTO_REFRESH_INTERVAL);
    }
    return () => {
      if (intervalId) {
        console.log("Cleaning up auto-refresh interval ID:", intervalId);
        window.clearInterval(intervalId);
      }
    };
  }, [dataMode]);

  useEffect(() => {
    if (dataMode === 'live' && !lastRefreshed && !dataLoading && !isAutoRefreshing) { 
      console.log("Triggering initial/opportunistic auto-refresh for live mode.");
      performRefreshRef.current(true); 
    }
  }, [dataMode, lastRefreshed, dataLoading, isAutoRefreshing]); 
  

  useEffect(() => { 
      setKpis(calculateKPIs(orders, allOrders)); 
  }, [orders, allOrders]);

  const handleFiltersChange = (newFilters: FilterOptions) => setFilters(newFilters);

  const handleOrderSelectForDrillDown = (order: Order) => {
    setSelectedOrderForDrillDown(order);
    setIsDrillDownModalOpen(true);
    if(isPipelineStageModalOpen) setIsPipelineStageModalOpen(false);
  };
  const handleCloseDrillDownModal = () => setIsDrillDownModalOpen(false);

  const handleCancelOrder = (orderId: string, reason?: string) => {
    cancelOrder(orderId, reason);
    if (selectedOrderForDrillDown?.id === orderId) handleCloseDrillDownModal();
  };

  const handlePipelineStageSelect = (stage: OrderStatus) => {
    setSelectedPipelineStage(stage);
    setOrdersInSelectedStage(orders.filter(order => order.currentStage === stage));
    setIsPipelineStageModalOpen(true);
  };
  const handleClosePipelineStageModal = () => setIsPipelineStageModalOpen(false);

  const handleLoadLiveData = useCallback((
    data: { orders: Order[]; suppliers: Supplier[]; errors: string[] },
    sourceDetails?: { type: 'googleSheet', orderSheetUrl: string, supplierSheetUrl: string } | { type: 'files', orderFileName?: string, supplierFileName?: string }
  ) => {
    loadLiveOrdersAndSuppliers(data, sourceDetails);
    setLastRefreshed(new Date()); 
  }, [loadLiveOrdersAndSuppliers]);

  const handleManualRefresh = () => {
    console.log("Manual refresh button clicked.");
    performRefreshRef.current(false); 
  };
  const handleToggleUserManagement = () => setIsUserManagementModalOpen(prev => !prev);
  const handleSearchTermChange = (term: string) => setSearchTerm(term);


  return (
    <div className="flex flex-col min-h-screen bg-neutral-800 text-neutral-300"> {/* Main dark background */}
      <DashboardHeader
        onToggleDataPanel={() => setIsDataPanelOpen(prev => !prev)}
        lastRefreshed={lastRefreshed}
        onManualRefresh={handleManualRefresh}
        isRefreshing={isRefreshing} 
        dataMode={dataMode}
        onToggleUserManagement={handleToggleUserManagement}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
      />

      <DataManagementPanel
        isOpen={isDataPanelOpen}
        onClose={() => setIsDataPanelOpen(false)}
        onLoadLiveData={handleLoadLiveData}
        onSwitchToMockData={switchToMockData}
        processingErrors={processingErrors}
        setProcessingErrors={setProcessingErrors}
        dataStats={dataStats}
        currentDataMode={dataMode}
        setIsLoading={setIsLoading} 
      />

      {currentUser?.role === 'admin' && (
        <UserManagementModal
            isOpen={isUserManagementModalOpen}
            onClose={handleToggleUserManagement}
            users={managedUsers}
            onAddUser={addManagedUser}
            onDeleteUser={deleteManagedUser}
            onUpdateUserRole={updateManagedUserRole}
            currentUserEmail={currentUser.email}
        />
      )}


      <main className="flex-grow p-6 md:p-8 space-y-8">
        <FiltersBar 
            suppliers={activeSuppliers} 
            clientCountriesList={uniqueClientCountries}
            productTypesList={uniqueProductTypes}
            yearsList={uniqueYears}
            onFiltersChange={handleFiltersChange} 
            initialFilters={filters}
        />

        {dataLoading && !isRefreshing && !isAutoRefreshing && ( 
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-4 text-xl text-neutral-300">Loading Dashboard Data...</p>
            </div>
        )}

        {(!dataLoading || isRefreshing || isAutoRefreshing || orders.length > 0) ? ( 
          <>
            {(orders.length > 0 || activeSuppliers.length > 0 || (dataMode === 'mock' && allOrders.length > 0)) ? ( 
              <>
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"> 
                  {kpis.map(kpi => <KpiCard key={kpi.title} kpi={kpi} icon={kpi.icon || <GlobeAltIcon className="w-6 h-6 text-primary" />} />)}
                </section>
                <section><OrderPipeline orders={orders} allOrders={allOrders} onStageSelect={handlePipelineStageSelect} /></section>
                
                <section>
                    <h2 className="text-2xl font-semibold text-neutral-100 mb-6">Key Analytics Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <OrderTrendsChart orders={nonCancelledOrdersForCharts} />
                        <ProductPopularityChart orders={nonCancelledOrdersForCharts} />
                        <ClientPaymentStatusChart orders={nonCancelledOrdersForCharts} />
                        <CountryDistributionChart orders={nonCancelledOrdersForCharts} /> 
                    </div>
                </section>

                <section><OrderListTable orders={orders} suppliers={activeSuppliers} onOrderSelect={handleOrderSelectForDrillDown} isLoading={dataLoading && !isRefreshing && !isAutoRefreshing}/></section>
                
                <section>
                    <h2 className="text-2xl font-semibold text-neutral-100 mb-6">Additional Insights</h2>
                    <div className="space-y-8"> 
                        {/* <PricingSummaryChart orders={nonCancelledOrdersForCharts} /> // Removed */}
                        <SupplierPerformanceTable suppliers={activeSuppliers} />
                        <PaymentTracker orders={orders} /> 
                    </div>
                </section>
              </>
            ) : ( 
               !dataLoading && 
                <div className="text-center py-10 bg-neutral-700 shadow-xl rounded-lg p-8">
                    <PackageIcon className="w-24 h-24 text-neutral-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-semibold text-neutral-100 mb-3">No Data to Display</h2>
                    <p className="text-neutral-300 mb-2 text-lg">
                        {searchTerm ? "No orders match your current search and filter combination." : "Please use the 'Manage Data' panel to load live data or switch to mock data."}
                    </p>
                    {searchTerm && <p className="text-neutral-400 mb-8 text-sm">Try adjusting your search term or filters.</p>}
                    {!searchTerm && 
                        <button
                            onClick={() => setIsDataPanelOpen(true)}
                            className="mt-6 px-8 py-3 bg-primary text-neutral-900 font-semibold rounded-lg hover:bg-primary-hover transition-all duration-150 text-lg shadow-md hover:shadow-lg"
                        >
                            Open Data Management
                        </button>
                    }
                </div>
            )}
          </>
        ) : null}
      </main>

      {isDrillDownModalOpen && selectedOrderForDrillDown && (
        <OrderDrillDownModal 
            order={selectedOrderForDrillDown} 
            suppliers={activeSuppliers} 
            onClose={handleCloseDrillDownModal} 
            onCancelOrder={handleCancelOrder} 
        />
      )}
      {isPipelineStageModalOpen && selectedPipelineStage && (
        <PipelineStageOrdersModal 
            isOpen={isPipelineStageModalOpen} 
            onClose={handleClosePipelineStageModal} 
            stage={selectedPipelineStage} 
            orders={ordersInSelectedStage} 
            suppliers={activeSuppliers} 
            onOrderSelect={handleOrderSelectForDrillDown} 
        />
      )}

      <footer className="text-center p-6 text-sm text-neutral-400 border-t border-neutral-700 bg-neutral-900">
        &copy; {new Date().getFullYear()} Bonhoeffer Machines Pvt. Ltd. SCM Dashboard. All rights reserved.
      </footer>
    </div>
  );
};

export default DashboardPage;
