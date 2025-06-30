

import { useState, useEffect, useCallback } from 'react';
import { Order, Supplier, FilterOptions, StageHistoryItem, OrderLineItem, ClientPayment, ProductType } from '../types';
import { OrderStatus, DEFAULT_SLA_DAYS_PER_STAGE, ORDER_STATUS_LIST, CLIENT_COUNTRIES, SUPPLIER_NAMES, PRODUCT_TYPE_LIST, DEFAULT_ORDER_SHEET_URL, DEFAULT_SUPPLIER_SHEET_URL } from '../constants';
import { addDaysToDate as addDaysUtil, daysBetween } from '../utils/dateUtils';
import { getExportUrlFromGoogleSheetUrl } from '../utils/googleSheetUtils';
import { processSeparateSheetsData } from '../services/dataTemplateService';

const PERSISTED_DATA_MODE_KEY = 'bonhoefferScmPersistedDataMode';

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const subtractDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const generateRandomStageHistory = (
    orderDateStr: string,
    currentStage: OrderStatus,
    sla: Record<OrderStatus, number>,
    isCancelled?: boolean,
    cancellationReason?: string
): { history: StageHistoryItem[], estimatedDispatchDate?: string, estimatedReadyDate?: string, productionStartDate?: string } => {
  const history: StageHistoryItem[] = [];
  let currentDate = orderDateStr;
  let estimatedDispatchDate: string | undefined;
  let estimatedReadyDate: string | undefined;
  let productionStartDate: string | undefined;

  for (const stage of ORDER_STATUS_LIST) {
    if (stage === OrderStatus.CANCELLED && !isCancelled) continue;

    const stageStartDate = currentDate;
    const actualDurationDays = (stage === OrderStatus.CANCELLED) ? 0 : Math.random() * sla[stage] + (sla[stage] * 0.75);
    const stageEndDate = addDays(stageStartDate, actualDurationDays);

    const isStageDelayed = (stage !== OrderStatus.CANCELLED) && actualDurationDays > sla[stage];

    if (stage === OrderStatus.PRODUCTION) productionStartDate = stageStartDate;
    if (stage === OrderStatus.READY_FOR_DISPATCH) estimatedReadyDate = stageStartDate;
    if (stage === OrderStatus.DELIVERED) estimatedDispatchDate = stageStartDate;

    if (ORDER_STATUS_LIST.indexOf(stage) <= ORDER_STATUS_LIST.indexOf(currentStage)) {
      history.push({
        stage,
        startDate: stageStartDate,
        endDate: (stage !== currentStage) ? stageEndDate : undefined,
        isDelayed: isStageDelayed,
        notes: isStageDelayed ? `Exceeded SLA of ${sla[stage]} days by ${(actualDurationDays - sla[stage]).toFixed(1)} days.` :
               (stage === OrderStatus.CANCELLED ? cancellationReason || 'Order cancelled' : undefined),
      });
      currentDate = stageEndDate;
      if (stage === OrderStatus.CANCELLED && currentStage === OrderStatus.CANCELLED) break;
    } else {
      if (stage === OrderStatus.PRODUCTION && !productionStartDate) {
        productionStartDate = addDays(currentDate, sla[OrderStatus.FRESH_ORDER]);
      }
      if (stage === OrderStatus.READY_FOR_DISPATCH && !estimatedReadyDate) {
        const prodStart = productionStartDate || addDays(currentDate, sla[OrderStatus.FRESH_ORDER]);
        estimatedReadyDate = addDays(prodStart, sla[OrderStatus.PRODUCTION]);
      }
      if (stage === OrderStatus.DELIVERED && !estimatedDispatchDate) {
        const readyStart = estimatedReadyDate || addDays(productionStartDate || addDays(currentDate, sla[OrderStatus.FRESH_ORDER]), sla[OrderStatus.PRODUCTION]);
        estimatedDispatchDate = addDays(readyStart, sla[OrderStatus.READY_FOR_DISPATCH]);
      }
      if (stage === OrderStatus.CANCELLED) continue;
      break;
    }
  }
  return { history, estimatedDispatchDate, estimatedReadyDate, productionStartDate };
};

const mockProductNames: Record<ProductType, string[]> = {
    [ProductType.GRASS_CUTTER]: ["Heavy Duty Lawn Mower GC-X1000", "EcoTrim Electric GC-E500", "ProSeries Reel Mower GC-R750", "Compact Gas Mower GC-G300"],
    [ProductType.WATER_PUMP]: ["Submersible Well Pump WP-S200", "High-Pressure Irrigation Pump WP-H1500", "Portable Utility Pump WP-U50", "Solar Powered Fountain Pump WP-SP80"],
    [ProductType.POWER_TILLER]: ["AgroPro Cultivator PT-C60", "GardenMaster Tiller PT-G45", "Mini Electric Tiller PT-E20", "Heavy Duty Diesel Tiller PT-D100"],
    [ProductType.SPRAYER]: ["Backpack Chemical Sprayer SP-B16L", "Orchard Mist Sprayer SP-M500", "Electrostatic Field Sprayer SP-ESF10", "Handheld Pump Sprayer SP-H2L"],
    [ProductType.HARVESTER]: ["Mini Rice Combine Harvester MH-R50", "Corn Silage Harvester MH-CS200", "Sugarcane Harvester MH-S120", "Manual Grain Harvester MH-G10"],
};

const generateMockOrders = (count: number, suppliers: Supplier[]): Order[] => {
  const orders: Order[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const orderId = `BM-${2024000 + i + 1}`;
    const orderDateDaysAgo = Math.floor(Math.random() * 90) + 1;
    const orderDate = subtractDays(now.toISOString(), orderDateDaysAgo);

    let currentStageIdx = Math.floor(Math.random() * (ORDER_STATUS_LIST.length -1));
    let currentStage = ORDER_STATUS_LIST[currentStageIdx];
    let reasonForCancellation: string | undefined = undefined;

    const isMockCancelled = Math.random() < 0.05;
    if (isMockCancelled) {
        currentStage = OrderStatus.CANCELLED;
        reasonForCancellation = "Cancelled due to client request (mock data).";
    }

    const { history, estimatedDispatchDate: stageEstimatedDispatchDate, estimatedReadyDate } =
        generateRandomStageHistory(orderDate, currentStage, DEFAULT_SLA_DAYS_PER_STAGE, isMockCancelled, reasonForCancellation);

    const lineItems: OrderLineItem[] = [];
    let totalOrderQuantity = 0;
    let totalOrderClientQuotedPrice = 0;
    let totalOrderClientNegotiatedPrice = 0;
    let totalOrderSupplierCost = 0;
    
    const numLineItems = Math.floor(Math.random() * 3) + 1; // Generate 1 to 3 line items per order


    for (let j = 0; j < numLineItems; j++) {
        const productType = PRODUCT_TYPE_LIST[Math.floor(Math.random() * PRODUCT_TYPE_LIST.length)];
        const availableProductNames = mockProductNames[productType];
        const productName = availableProductNames[Math.floor(Math.random() * availableProductNames.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const clientQuotedPricePerUnit = Math.floor(Math.random() * 700) + 100;
        let clientNegotiatedPricePerUnit: number | undefined = clientQuotedPricePerUnit;

        if (ORDER_STATUS_LIST.indexOf(currentStage) > ORDER_STATUS_LIST.indexOf(OrderStatus.FRESH_ORDER) && currentStage !== OrderStatus.CANCELLED) {
            if (Math.random() > 0.3) { 
              clientNegotiatedPricePerUnit = Number((clientQuotedPricePerUnit * (Math.random() * 0.1 + 0.9)).toFixed(2));
            }
        }
        const supplierCostPerUnit = Number(((clientNegotiatedPricePerUnit || clientQuotedPricePerUnit) * (Math.random() * 0.3 + 0.5)).toFixed(2));

        const lineItemSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

        let supplierProductionStartDate: string | undefined,
            supplierExpectedDispatchDate: string | undefined,
            supplierActualDispatchDate: string | undefined,
            supplierBLNumber: string | undefined,
            supplierPaymentTerms: string | undefined,
            supplierAdvancePaidAmount: number | undefined,
            supplierAdvancePaidDate: string | undefined,
            supplierBeforePaidAmount: number | undefined,
            supplierBeforePaidDate: string | undefined,
            supplierBalancePaidAmount: number | undefined,
            supplierBalancePaidDate: string | undefined,
            supplierNotes: string | undefined;

        if (currentStage !== OrderStatus.CANCELLED && currentStage !== OrderStatus.FRESH_ORDER) {
            supplierProductionStartDate = addDays(String(orderDate), Math.floor(Math.random() * 5) + 2);
            supplierExpectedDispatchDate = addDays(String(supplierProductionStartDate), Math.floor(Math.random() * 10) + 10);

            if (ORDER_STATUS_LIST.indexOf(currentStage) >= ORDER_STATUS_LIST.indexOf(OrderStatus.READY_FOR_DISPATCH)) {
                supplierActualDispatchDate = addDays(String(supplierExpectedDispatchDate), Math.floor(Math.random() * 5) - 2); // Can be early or late
                supplierBLNumber = `BL-${orderId.slice(-4)}-${j+1}${Math.floor(Math.random()*100)}`;
            }

            const paymentTermRand = Math.random();
            const totalSupplierItemCost = supplierCostPerUnit * quantity;

            if (paymentTermRand < 0.33) { // 3-part payment
                supplierPaymentTerms = "30% Adv, 40% Pre-Disp, 30% Post-Disp";
                supplierAdvancePaidAmount = parseFloat((totalSupplierItemCost * 0.3).toFixed(2));
                supplierAdvancePaidDate = addDays(String(supplierProductionStartDate), -(Math.floor(Math.random() * 2) + 1));
                
                supplierBeforePaidAmount = parseFloat((totalSupplierItemCost * 0.4).toFixed(2));
                supplierBeforePaidDate = addDays(String(supplierExpectedDispatchDate), -(Math.floor(Math.random() * 3) + 1)); // Before expected dispatch

                if (supplierActualDispatchDate) {
                    supplierBalancePaidAmount = parseFloat((totalSupplierItemCost * 0.3).toFixed(2));
                    supplierBalancePaidDate = addDays(String(supplierActualDispatchDate), Math.floor(Math.random() * 5) + 1);
                }
            } else if (paymentTermRand < 0.66) { // 2-part payment (Advance, Balance)
                supplierPaymentTerms = "50% Advance, 50% on Dispatch";
                supplierAdvancePaidAmount = parseFloat((totalSupplierItemCost * 0.5).toFixed(2));
                supplierAdvancePaidDate = addDays(String(supplierProductionStartDate), -(Math.floor(Math.random() * 3) + 1));
                if (supplierActualDispatchDate) {
                    supplierBalancePaidAmount = parseFloat((totalSupplierItemCost * 0.5).toFixed(2));
                    supplierBalancePaidDate = addDays(String(supplierActualDispatchDate), Math.floor(Math.random() * 5) + 1);
                }
            } else { // 1-part or other terms
                 if (Math.random() < 0.5 && supplierActualDispatchDate) {
                    supplierPaymentTerms = "100% on Dispatch";
                    supplierBalancePaidAmount = parseFloat(totalSupplierItemCost.toFixed(2));
                    supplierBalancePaidDate = addDays(String(supplierActualDispatchDate), Math.floor(Math.random() * 7) + 2);
                 } else if (supplierActualDispatchDate) {
                    supplierPaymentTerms = "30 Day Net after Dispatch";
                    supplierBalancePaidAmount = parseFloat(totalSupplierItemCost.toFixed(2));
                    supplierBalancePaidDate = addDays(String(supplierActualDispatchDate), Math.floor(Math.random() * 10) + 25);
                 } else {
                    supplierPaymentTerms = "Awaiting Dispatch for Final Terms";
                 }
            }
            if (Math.random() < 0.3) supplierNotes = `Supplier confirmed ETA for ${productName}.`;
        }


        lineItems.push({
            id: `${orderId}-li-${j+1}-${Date.now()}`,
            productId: `PROD-${productType.substring(0,3).toUpperCase()}${Math.floor(Math.random()*1000)}`,
            productName, productType, quantity,
            quotedPricePerUnit: clientQuotedPricePerUnit, 
            negotiatedPricePerUnit: clientNegotiatedPricePerUnit, 
            finalPricePerUnit: supplierCostPerUnit, 
            supplierId: lineItemSupplier.id,
            supplierProductionStartDate, supplierExpectedDispatchDate, supplierActualDispatchDate, supplierBLNumber,
            supplierPaymentTerms, supplierAdvancePaidAmount, supplierAdvancePaidDate,
            supplierBeforePaidAmount, supplierBeforePaidDate,
            supplierBalancePaidAmount, supplierBalancePaidDate, supplierNotes,
            lineItemNotes: Math.random() > 0.7 ? `Internal note for ${productName}` : undefined,
        });
        totalOrderQuantity += quantity;
        totalOrderClientQuotedPrice += clientQuotedPricePerUnit * quantity;
        totalOrderClientNegotiatedPrice += (clientNegotiatedPricePerUnit !== undefined ? clientNegotiatedPricePerUnit : clientQuotedPricePerUnit) * quantity;
        totalOrderSupplierCost += supplierCostPerUnit * quantity;
    }

    const totalOrderFinalClientPrice = parseFloat(totalOrderClientNegotiatedPrice.toFixed(2));

    const clientMoq = (Math.floor(Math.random() * 5) + 1) * Math.max(1, Math.floor(numLineItems / 2)) * 2;
    let expectedPaymentDate: string | undefined; 
    let actualPaymentDate: string | undefined; 
    let dispatchDate = stageEstimatedDispatchDate;
    const deliveryStageHistoryItem = history.find(h => h.stage === OrderStatus.DELIVERED);
    if (deliveryStageHistoryItem?.startDate) dispatchDate = deliveryStageHistoryItem.startDate;

    if (currentStage !== OrderStatus.CANCELLED && ORDER_STATUS_LIST.indexOf(currentStage) >= ORDER_STATUS_LIST.indexOf(OrderStatus.READY_FOR_DISPATCH) +1 ) {
      const readyEnd = history.find(h => h.stage === OrderStatus.READY_FOR_DISPATCH)?.endDate;
      const deliveredStart = history.find(h => h.stage === OrderStatus.DELIVERED)?.startDate;
      dispatchDate = deliveredStart || readyEnd || stageEstimatedDispatchDate;
    } else if (currentStage === OrderStatus.CANCELLED || ORDER_STATUS_LIST.indexOf(currentStage) < ORDER_STATUS_LIST.indexOf(OrderStatus.DELIVERED)) {
        dispatchDate = undefined;
    }

    let actualDeliveryDate: string | undefined = deliveryStageHistoryItem?.endDate;

    if (dispatchDate && currentStage !== OrderStatus.CANCELLED) {
        expectedPaymentDate = addDays(String(dispatchDate), DEFAULT_SLA_DAYS_PER_STAGE[OrderStatus.PAID]);
    }

    const clientPayments: ClientPayment[] = [];
    let paymentStatus: Order['paymentStatus'] = 'Pending';
    let totalPaidByClient = 0;

    if (currentStage !== OrderStatus.CANCELLED && totalOrderFinalClientPrice > 0) {
        const paymentScenario = Math.random();
        if (paymentScenario < 0.3 && dispatchDate) { 
            // paymentStatus remains 'Pending' or becomes 'Overdue'
        } else if (paymentScenario < 0.7 && dispatchDate) { 
            const numPartialPayments = Math.random() < 0.5 ? 1 : 2;
            let paymentDateTracker = addDays(String(dispatchDate), Math.floor(Math.random() * 10) + 1);
            for (let k=0; k < numPartialPayments; k++) {
                const amount = Number((totalOrderFinalClientPrice * (Math.random() * 0.3 + 0.2)).toFixed(2)); 
                 if (totalPaidByClient + amount < totalOrderFinalClientPrice * 0.95) { 
                    clientPayments.push({
                        id: `cp-${orderId}-${k}-${Date.now()}`,
                        amountPaid: amount,
                        paymentDate: paymentDateTracker,
                        paymentMethod: Math.random() < 0.7 ? 'Bank Transfer' : 'Cheque',
                        notes: `Partial payment ${k+1}`
                    });
                    totalPaidByClient += amount;
                    paymentDateTracker = addDays(paymentDateTracker, Math.floor(Math.random() * 10) + 5);
                }
            }
        } else if (dispatchDate) { 
            if (Math.random() < 0.6) { 
                const paymentDate = addDays(String(dispatchDate), Math.floor(Math.random() * DEFAULT_SLA_DAYS_PER_STAGE[OrderStatus.PAID] * 0.8));
                clientPayments.push({
                    id: `cp-${orderId}-full-${Date.now()}`,
                    amountPaid: totalOrderFinalClientPrice,
                    paymentDate: paymentDate,
                    paymentMethod: 'Bank Transfer',
                    notes: 'Full payment received.'
                });
                totalPaidByClient = totalOrderFinalClientPrice;
                actualPaymentDate = paymentDate;
            } else { 
                const firstPaymentAmount = Number((totalOrderFinalClientPrice * 0.4).toFixed(2));
                const firstPaymentDate = addDays(String(dispatchDate), Math.floor(Math.random() * 10) + 1);
                clientPayments.push({
                    id: `cp-${orderId}-p1-${Date.now()}`,
                    amountPaid: firstPaymentAmount,
                    paymentDate: firstPaymentDate,
                    paymentMethod: 'Bank Transfer',
                    notes: 'First installment.'
                });
                totalPaidByClient += firstPaymentAmount;

                const secondPaymentAmount = totalOrderFinalClientPrice - firstPaymentAmount;
                const secondPaymentDate = addDays(firstPaymentDate, Math.floor(Math.random() * 15) + 5);
                 clientPayments.push({
                    id: `cp-${orderId}-p2-${Date.now()}`,
                    amountPaid: secondPaymentAmount,
                    paymentDate: secondPaymentDate,
                    paymentMethod: 'Bank Transfer',
                    notes: 'Final installment.'
                });
                totalPaidByClient += secondPaymentAmount;
                actualPaymentDate = secondPaymentDate;
            }
        }
    }

    if (currentStage !== OrderStatus.CANCELLED) {
        if (totalPaidByClient >= totalOrderFinalClientPrice) {
            paymentStatus = 'Paid';
             if (clientPayments.length > 0) { 
                actualPaymentDate = clientPayments.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate;
            }
        } else if (expectedPaymentDate && new Date(expectedPaymentDate) < now) {
            paymentStatus = 'Overdue';
        } else if (totalPaidByClient > 0) {
            paymentStatus = 'Partially Paid';
        } else {
            paymentStatus = 'Pending';
        }
    }


    if (currentStage === OrderStatus.DELIVERED && deliveryStageHistoryItem?.endDate) {
      actualDeliveryDate = deliveryStageHistoryItem.endDate;
    } else if (paymentStatus === 'Paid') { 
      if (!actualDeliveryDate && deliveryStageHistoryItem?.endDate) actualDeliveryDate = deliveryStageHistoryItem.endDate;
      else if (!actualDeliveryDate && dispatchDate) actualDeliveryDate = addDaysUtil(String(dispatchDate), DEFAULT_SLA_DAYS_PER_STAGE[OrderStatus.DELIVERED] * (Math.random()*0.5 + 0.75) );
    }

    let expectedDeliveryDateOverall = addDays(orderDate, 45 + numLineItems * 5);
    if(estimatedReadyDate){
        expectedDeliveryDateOverall = addDaysUtil(String(estimatedReadyDate), DEFAULT_SLA_DAYS_PER_STAGE[OrderStatus.DELIVERED] + DEFAULT_SLA_DAYS_PER_STAGE[OrderStatus.READY_FOR_DISPATCH]);
    }
    if (currentStage === OrderStatus.CANCELLED) {
        paymentStatus = 'Pending'; 
        expectedPaymentDate = undefined;
        actualPaymentDate = undefined;
        clientPayments.length = 0; 
        expectedDeliveryDateOverall = orderDate;
        actualDeliveryDate = undefined;
        dispatchDate = undefined;
    }

    orders.push({
      id: orderId, clientName: `Client ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      clientCountry: CLIENT_COUNTRIES[Math.floor(Math.random() * CLIENT_COUNTRIES.length)],
      orderDate, currentStage, stageHistory: history, lineItems,
      totalQuantity: totalOrderQuantity,
      totalQuotedPrice: parseFloat(totalOrderClientQuotedPrice.toFixed(2)),
      totalNegotiatedPrice: parseFloat(totalOrderClientNegotiatedPrice.toFixed(2)),
      totalFinalPrice: totalOrderFinalClientPrice, 
      totalSupplierCost: parseFloat(totalOrderSupplierCost.toFixed(2)), 
      clientPayments,
      paymentStatus, 
      expectedPaymentDate, actualPaymentDate, 
      slaDaysPerStage: DEFAULT_SLA_DAYS_PER_STAGE,
      expectedDeliveryDate: expectedDeliveryDateOverall, actualDeliveryDate,
      dispatchDate, clientMoq,
      orderNotes: Math.random() > 0.8 ? `Order note for ${orderId}.` : undefined,
      reasonForCancellation
    });
  }
  return orders;
};

const generateMockSuppliers = (count: number): Supplier[] => {
  const suppliersList: Supplier[] = [];
  for (let i = 0; i < count; i++) {
    suppliersList.push({
      id: `SUP-${100 + i + 1}`,
      name: SUPPLIER_NAMES[i % SUPPLIER_NAMES.length] + (i >= SUPPLIER_NAMES.length ? ` ${Math.floor(i/SUPPLIER_NAMES.length)+1}` : ''),
      avgTat: Math.floor(Math.random() * 10) + 15,
      deliveryRate: parseFloat((Math.random() * 0.1 + 0.89).toFixed(2)),
      pricingVariance: parseFloat((Math.random() * 0.05).toFixed(2)),
      country: 'India',
    });
  }
  return suppliersList;
};

export const useMockData = (searchTerm?: string) => { // Added searchTerm parameter
  const [dataMode, setDataMode] = useState<'mock' | 'live'>('mock'); // Default to mock initially

  const [mockSuppliers, setMockSuppliers] = useState<Supplier[]>([]);
  const [mockOrders, setMockOrders] = useState<Order[]>([]);

  const [liveSuppliers, setLiveSuppliers] = useState<Supplier[]>([]);
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);

  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [dataStats, setDataStats] = useState<{ ordersCount: number; suppliersCount: number} | null>(null);

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {},
    supplierIds: [],
    clientCountries: [],
    productTypes: [],
    showCancelledOrders: false,
    year: '',
  });
  const [isLoading, setIsLoading] = useState(true); 
  const [hasAttemptedPersistedLoad, setHasAttemptedPersistedLoad] = useState(false);


  const activeOrders = dataMode === 'live' ? liveOrders : mockOrders;
  const activeSuppliers = dataMode === 'live' ? liveSuppliers : mockSuppliers;

  const loadInitialMockData = useCallback(() => {
    setIsLoading(true);
    setProcessingErrors([]);
    const newSuppliers = generateMockSuppliers(7);
    const newOrders = generateMockOrders(50, newSuppliers);
    setMockSuppliers(newSuppliers);
    setMockOrders(newOrders);
    setIsLoading(false);
  }, []);

  const attemptLoadFromDefaultSheets = useCallback(async (isInitialAttempt: boolean, isBackgroundRefresh: boolean = false) => {
    const shouldShowMainLoader = !isBackgroundRefresh || liveOrders.length === 0 || isInitialAttempt;

    if (shouldShowMainLoader) {
      setIsLoading(true);
    }
    setProcessingErrors([]); // Clear previous errors for this attempt
    
    const exportOrderUrl = getExportUrlFromGoogleSheetUrl(DEFAULT_ORDER_SHEET_URL);
    const exportSupplierUrl = getExportUrlFromGoogleSheetUrl(DEFAULT_SUPPLIER_SHEET_URL);

    if (!exportOrderUrl || !exportSupplierUrl) {
      const errorMsg = "Failed to load from default Google Sheets: Invalid URL(s) defined in constants.ts.";
      setProcessingErrors(prev => [...prev, errorMsg]);
      if (isInitialAttempt) {
        localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live'); 
        setDataMode('mock');
        if (mockOrders.length === 0) loadInitialMockData();
      }
      setIsLoading(false);
      return false;
    }

    let success = false;
    
    const fetchAndCheck = async (url: string, name: string): Promise<string> => {
        const response = await fetch(url, { cache: 'no-cache' });

        if (!response.ok) {
            const statusText = response.statusText || 'Request Failed';
            throw new Error(`${name} (${response.status}): ${statusText}. Ensure the Google Sheet is public ('Anyone with the link can view').`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/csv')) {
            throw new Error(`${name}: Expected CSV content, but received '${contentType || 'unknown'}'. This often happens if the sheet is private, causing a redirect to a login page.`);
        }

        return response.text();
    };

    try {
      const [orderResponse, supplierResponse] = await Promise.all([
        fetchAndCheck(exportOrderUrl, 'Order Sheet'),
        fetchAndCheck(exportSupplierUrl, 'Supplier Sheet')
      ]);
      
      if (orderResponse && supplierResponse) {
        const result = processSeparateSheetsData(orderResponse, supplierResponse);
        setLiveOrders(result.orders);
        setLiveSuppliers(result.suppliers);
        setProcessingErrors(result.errors || []); 
        
        if (result.orders.length > 0 || result.suppliers.length > 0) {
            setDataMode('live');
            setDataStats({ ordersCount: result.orders.length, suppliersCount: result.suppliers.length });
            if (isInitialAttempt || localStorage.getItem(PERSISTED_DATA_MODE_KEY) !== 'live') {
                localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live');
            }
            success = result.errors.length === 0;
        } else if (isInitialAttempt && result.errors.length > 0) { 
            localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live'); 
            setDataMode('mock');
            if (mockOrders.length === 0) loadInitialMockData();
        } else if (result.errors.length > 0) {
           // Non-initial attempt with errors: stay in live, errors are set.
        } else { 
             setProcessingErrors(prev => [...prev, "No data found in the default Google Sheets."]);
             if (isInitialAttempt) {
                localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live');
                setDataMode('mock');
                if (mockOrders.length === 0) loadInitialMockData();
             }
        }
      } else {
        throw new Error("One or both default Google Sheets returned empty data.");
      }
    } catch (error) {
      console.error("Error loading from default Google Sheets:", error);
      let detailedErrorMsg = `Error loading from default Google Sheets: ${(error as Error).message}`;
      // Generic message for network errors that are not handled by fetchAndCheck
      if ((error as Error).message.toLowerCase().includes('failed to fetch')) {
        detailedErrorMsg += " This may be a network issue or a browser extension blocking the request. Please check your internet connection and Google Sheet sharing settings.";
      }
      setProcessingErrors(prev => [...prev, detailedErrorMsg]);
      if (isInitialAttempt) {
        localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live'); 
        setDataMode('mock'); 
        if (mockOrders.length === 0) loadInitialMockData();
      }
    } finally {
        setIsLoading(false); // Ensure loading state is reset
    }
    return success;
  }, [loadInitialMockData, mockOrders.length, liveOrders.length]);


  useEffect(() => {
    if (hasAttemptedPersistedLoad) return;
    if (typeof window === 'undefined') { 
        setIsLoading(false);
        return;
    }
    setHasAttemptedPersistedLoad(true);

    const persistedDataMode = localStorage.getItem(PERSISTED_DATA_MODE_KEY);

    if (!persistedDataMode) { 
      console.log("No persisted data mode found, attempting to load live data by default.");
      attemptLoadFromDefaultSheets(true, false);
    } else if (persistedDataMode === 'live') { 
      console.log("Persisted data mode is 'live', attempting to refresh live data.");
      attemptLoadFromDefaultSheets(false, false); // Initial load from persisted 'live' is not a background refresh
    } else { 
      console.log("Persisted data mode is 'mock', loading mock data.");
      setDataMode('mock');
      if (mockOrders.length === 0) {
        loadInitialMockData();
      } else {
        setIsLoading(false);
      }
    }
  }, [hasAttemptedPersistedLoad, loadInitialMockData, mockOrders.length, attemptLoadFromDefaultSheets]);


  const loadLiveOrdersAndSuppliers = useCallback((
    data: { orders: Order[]; suppliers: Supplier[]; errors: string[] },
    sourceDetails?: { type: 'googleSheet', orderSheetUrl: string, supplierSheetUrl: string } | { type: 'files', orderFileName?: string, supplierFileName?: string }
  ) => {
    setIsLoading(true);
    setProcessingErrors(data.errors || []);
    if (data.orders.length > 0 || data.suppliers.length > 0 || data.errors.length === 0) {
        setLiveOrders(data.orders);
        setLiveSuppliers(data.suppliers);
        setDataMode('live');
        setDataStats({ ordersCount: data.orders.length, suppliersCount: data.suppliers.length });
        localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'live');
    } else {
        setDataStats(null); 
    }
    setIsLoading(false);
  }, [setIsLoading, setProcessingErrors]);

  const switchToMockData = useCallback(() => {
    setIsLoading(true);
    setProcessingErrors([]);
    localStorage.setItem(PERSISTED_DATA_MODE_KEY, 'mock');
    setDataMode('mock');
    setDataStats(null);
    if (mockOrders.length === 0 || mockSuppliers.length === 0) {
        loadInitialMockData();
    } else {
        setIsLoading(false);
    }
  }, [mockOrders, mockSuppliers, loadInitialMockData]);


  const updateOrder = useCallback((updatedOrder: Order) => {
    const updater = (prevOrders: Order[]) => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    if (dataMode === 'live') {
      setLiveOrders(updater);
    } else {
      setMockOrders(updater);
    }
  }, [dataMode]);

  const cancelOrder = useCallback((orderId: string, reason?: string) => {
    const canceller = (prevOrders: Order[]): Order[] => prevOrders.map((o): Order => {
      if (o.id === orderId) {
        const newHistoryItem: StageHistoryItem = {
            stage: OrderStatus.CANCELLED,
            startDate: new Date().toISOString(),
            notes: reason || "Order Cancelled",
        };
        const existingHistory = o.stageHistory.filter(h => h.stage !== OrderStatus.CANCELLED);

        const cancelledOrder: Order = {
          ...o,
          currentStage: OrderStatus.CANCELLED,
          reasonForCancellation: reason,
          stageHistory: [...existingHistory, newHistoryItem],
          paymentStatus: 'Pending', 
          expectedDeliveryDate: o.orderDate,
          actualDeliveryDate: undefined,
          expectedPaymentDate: undefined,
          actualPaymentDate: undefined,
          dispatchDate: undefined,
          clientPayments: [], 
        };
        return cancelledOrder;
      }
      return o;
    });
    if (dataMode === 'live') {
      setLiveOrders(canceller);
    } else {
      setMockOrders(canceller);
    }
  }, [dataMode]);


  useEffect(() => {
    let tempOrders = [...activeOrders];

    // 1. Apply global search term first
    if (searchTerm && searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        tempOrders = tempOrders.filter(order =>
            order.id.toLowerCase().includes(lowerSearchTerm) ||
            order.clientName.toLowerCase().includes(lowerSearchTerm) ||
            order.lineItems.some(li =>
                li.productName.toLowerCase().includes(lowerSearchTerm) ||
                li.productType.toLowerCase().includes(lowerSearchTerm)
            )
        );
    }

    // 2. Then apply existing filters from FiltersBar
    if (!filters.showCancelledOrders) {
        tempOrders = tempOrders.filter(o => o.currentStage !== OrderStatus.CANCELLED);
    }
    
    if (filters.year) {
      tempOrders = tempOrders.filter(o => new Date(o.orderDate).getFullYear().toString() === filters.year);
    }

    if (filters.dateRange.start) {
      tempOrders = tempOrders.filter(o => new Date(o.orderDate) >= new Date(filters.dateRange.start!));
    }
    if (filters.dateRange.end) {
      tempOrders = tempOrders.filter(o => new Date(o.orderDate) <= new Date(filters.dateRange.end!));
    }
    if (filters.supplierIds.length > 0) {
      tempOrders = tempOrders.filter(o =>
        o.lineItems.some(li => filters.supplierIds.includes(li.supplierId))
      );
    }
    if (filters.clientCountries.length > 0) {
      tempOrders = tempOrders.filter(o => filters.clientCountries.includes(o.clientCountry));
    }
    if (filters.productTypes.length > 0) {
      tempOrders = tempOrders.filter(o =>
        o.lineItems.some(li => filters.productTypes.includes(li.productType))
      );
    }
    setFilteredOrders(tempOrders);
  }, [activeOrders, filters, searchTerm]); // Added searchTerm to dependency array

  return {
    orders: filteredOrders, // These are now search-filtered THEN filter-bar-filtered
    allOrders: activeOrders, // These are only dataMode dependent (mock/live), not search/filter-bar filtered
    suppliers: activeSuppliers,
    filters,
    setFilters,
    isLoading,
    setIsLoading,
    dataMode,
    loadLiveOrdersAndSuppliers,
    switchToMockData,
    processingErrors,
    setProcessingErrors,
    dataStats,
    updateOrder,
    cancelOrder,
    attemptLoadFromDefaultSheets,
  };
};