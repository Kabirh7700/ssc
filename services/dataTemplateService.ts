
import { Order, Supplier, StageHistoryItem, OrderLineItem, ClientPayment } from '../types';
import { OrderStatus, ProductType, PRODUCT_TYPE_LIST, DEFAULT_SLA_DAYS_PER_STAGE, ORDER_STATUS_LIST, CLIENT_COUNTRIES } from '../constants';
import { parseCSVFromString } from '../utils/csvUtils';
import { addDaysToDate, daysBetween, parseDateString } from '../utils/dateUtils'; // Import parseDateString

// === ORDER SHEET ===
const activeStagesForHeaders = ORDER_STATUS_LIST.filter(s => s !== OrderStatus.CANCELLED);

export const ORDER_SHEET_CSV_HEADERS: string[] = [
    'OrderID', 'ClientName', 'ClientCountry', 'OrderDate', 'CurrentStage',
    'ExpectedDeliveryDate', /* 'PaymentStatus' (derived) */ 'ExpectedPaymentDate', 'ActualPaymentDate',
    'ClientMOQ', 'OrderNotes', 'ReasonForCancellation',
    'TotalNegotiatedPrice', 'TotalFinalPrice', // TotalFinalPrice IS CLIENT_PRICE
    ...activeStagesForHeaders.map(s => `Stage_${s.replace(/\s+/g, '')}_StartDate`),
    ...activeStagesForHeaders.map(s => `Stage_${s.replace(/\s+/g, '')}_EndDate`),
    `Stage_${OrderStatus.CANCELLED.replace(/\s+/g, '')}_StartDate`
];

export const generateOrderSheetTemplateCSV = (): string => {
    const exampleDate = (offset = 0) => new Date(Date.now() - offset * 24*60*60*1000).toISOString().split('T')[0];
    const headerString = ORDER_SHEET_CSV_HEADERS.join(',');
    
    const baseFieldsCount = 13; // Updated count: OrderID to TotalFinalPrice inclusive (13 fields)

    const exampleRow1Values: (string | number | undefined)[] = [
        'BM-2025001', 'Global Farm Inc.', 'USA', exampleDate(30), OrderStatus.PRODUCTION,
        exampleDate(-15), exampleDate(-5), '', // ExpectedPaymentDate, ActualPaymentDate
        '100', 'Rush order for Global Farm.', '', // ClientMOQ, OrderNotes, ReasonForCancellation
        '12000', '11800', // TotalNegotiatedPrice, TotalFinalPrice
    ];
    
    // Fill stage dates for example row 1
    activeStagesForHeaders.forEach((stage, index) => {
        if (stage === OrderStatus.FRESH_ORDER) exampleRow1Values.push(exampleDate(30)); // StartDate
        else if (stage === OrderStatus.PRODUCTION) exampleRow1Values.push(exampleDate(25)); // StartDate
        else exampleRow1Values.push(''); // Other StartDates
    });
    activeStagesForHeaders.forEach((stage, index) => {
        if (stage === OrderStatus.FRESH_ORDER) exampleRow1Values.push(exampleDate(28)); // EndDate
        else exampleRow1Values.push(''); // Other EndDates
    });
    exampleRow1Values.push(''); // Cancelled_StartDate for row 1


    const exampleRow2Values: (string | number | undefined)[] = [
        'BM-2025002', 'Euro Landwirtschaft', 'Germany', exampleDate(10), OrderStatus.CANCELLED,
        exampleDate(5), '', '', // ExpDelivery, ExpPayment, ActualPayment
        '20', 'Initial inquiry, requirements changed.', 'Client changed requirements.', // MOQ, Notes, CancelReason
        '9000', '8800', // NegotiatedPrice, FinalPrice
    ];
     activeStagesForHeaders.forEach((stage, index) => {
        if (stage === OrderStatus.FRESH_ORDER) exampleRow2Values.push(exampleDate(10)); // StartDate
        else exampleRow2Values.push(''); // Other StartDates
    });
    activeStagesForHeaders.forEach((stage, index) => {
        if (stage === OrderStatus.FRESH_ORDER) exampleRow2Values.push(exampleDate(9)); // EndDate
        else exampleRow2Values.push(''); // Other EndDates
    });
    exampleRow2Values.push(exampleDate(9)); // Cancelled_StartDate for row 2
    
    const formatRow = (values: (string|number|undefined)[]) => values.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',');

    const exampleRows = [
        formatRow(exampleRow1Values),
        formatRow(exampleRow2Values)
    ];
    return headerString + '\n' + exampleRows.join('\n');
};


// === SUPPLIER / LINE ITEM SHEET ===
export const SUPPLIER_SHEET_CSV_HEADERS: string[] = [
    'OrderID', 
    'LineItemID', 
    'Quantity',
    'SupplierID_for_LineItem', 
    'SupplierName_for_LineItem', 
    'SupplierAvgTATDays_for_LineItem', 
    'SupplierDeliveryRate_for_LineItem', 
    'SupplierPricingVariance_for_LineItem',
    'SupplierProductionStartDate', 
    'SupplierExpectedDispatchDate', 
    'SupplierActualDispatchDate',
    'SupplierBLNumber', 
    'SupplierPaymentTerms',
    'SupplierAdvancePaidAmount', 'SupplierAdvancePaidDate',
    'SupplierBeforePaidAmount', 'SupplierBeforePaidDate',
    'SupplierBalancePaidAmount', 'SupplierBalancePaidDate',
    'SupplierNotes'
];

export const generateSupplierSheetTemplateCSV = (): string => {
    const exampleDate = (offset = 0) => new Date(Date.now() - offset * 24*60*60*1000).toISOString().split('T')[0];
    const headerString = SUPPLIER_SHEET_CSV_HEADERS.join(',');
    const exampleRows = [
        [ // Order 1, Line Item 1
            'BM-2025001', // OrderID
            'BM-2025001-LI1', // LineItemID
            '50', // Quantity
            'SUP-101', // SupplierID_for_LineItem
            'AgroEquip India', // SupplierName_for_LineItem
            '20', // SupplierAvgTATDays_for_LineItem
            '0.95', // SupplierDeliveryRate_for_LineItem
            '0.02', // SupplierPricingVariance_for_LineItem
            exampleDate(20), // SupplierProductionStartDate
            exampleDate(5), // SupplierExpectedDispatchDate
            exampleDate(4), // SupplierActualDispatchDate
            'BL12345XYZ', // SupplierBLNumber
            '30% Adv, 40% Pre-Disp, 30% Post-Disp', // SupplierPaymentTerms
            '2700', exampleDate(22), // SupplierAdvancePaidAmount, SupplierAdvancePaidDate
            '3600', exampleDate(6),  // SupplierBeforePaidAmount, SupplierBeforePaidDate
            '2700', exampleDate(3),  // SupplierBalancePaidAmount, SupplierBalancePaidDate
            'Awaiting final QC check from supplier side.' // SupplierNotes
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','),
        [ // Order 1, Line Item 2
            'BM-2025001', 'BM-2025001-LI2', '20', 
            'SUP-102', 'FarmMech Solutions', '15', '0.98', '0.01',
            exampleDate(18), exampleDate(3), exampleDate(3), 'BL98765ABC', '100% on Dispatch',
            '', '', '', '', '1400', exampleDate(2), 'All clear.'
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','),
         [ // Order 2, Line Item 1 (Order is Cancelled)
            'BM-2025002', 'BM-2025002-LI1', '20',
            'SUP-101', 'AgroEquip India', '20', '0.95', '0.02',
            '', '', '', '', '',
            '', '', '', '', '', '', 'Related to cancelled order BM-2025002.'
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
    ];
    return headerString + '\n' + exampleRows.join('\n');
};


export const processSeparateSheetsData = (
    orderCsvString: string,
    supplierCsvString: string
): { orders: Order[], suppliers: Supplier[], errors: string[] } => {
    const errors: string[] = [];
    const todayISO = new Date().toISOString();

    const parsedOrders = parseCSVFromString(orderCsvString);
    if (!parsedOrders || parsedOrders.length < 2) {
        errors.push("Order Data CSV is empty or invalid (must have headers and at least one data row).");
    }
    const orderHeaders = parsedOrders.length > 0 ? parsedOrders[0].map(h => h.trim()) : [];
    const orderDataRows = parsedOrders.length > 1 ? parsedOrders.slice(1) : [];

    const requiredOrderHeaders = ['OrderID', 'ClientName', 'OrderDate', 'CurrentStage', 'TotalFinalPrice'];
    for (const rh of requiredOrderHeaders) {
        if (!orderHeaders.includes(rh)) {
             errors.push(`Order Data CSV: Missing required header "${rh}".`);
        }
    }

    const parsedSuppliers = parseCSVFromString(supplierCsvString);
    if (!parsedSuppliers || parsedSuppliers.length < 2) {
        errors.push("Supplier/Line Item Data CSV is empty or invalid (must have headers and at least one data row).");
    }
    const supplierHeaders = parsedSuppliers.length > 0 ? parsedSuppliers[0].map(h => h.trim()) : [];
    const supplierDataRows = parsedSuppliers.length > 1 ? parsedSuppliers.slice(1) : [];
    
    const requiredSupplierHeaders = ['OrderID', 'LineItemID', 'Quantity', 'SupplierID_for_LineItem', 'SupplierName_for_LineItem'];
    for (const rh of requiredSupplierHeaders) {
        if (!supplierHeaders.includes(rh)) errors.push(`Supplier/Line Item Data CSV: Missing required header "${rh}".`);
    }

    if (errors.length > 0 && !(parsedOrders.length < 2 && parsedSuppliers.length < 2)) {
       return { orders: [], suppliers: [], errors };
    }

    const suppliersMap = new Map<string, Supplier>();
    const ordersMap = new Map<string, Partial<Order>>();
    const lineItemsByOrderId = new Map<string, OrderLineItem[]>();

    supplierDataRows.forEach((row, rowIndex) => {
        const lineData: Record<string, string> = {};
        supplierHeaders.forEach((header, index) => {
            lineData[header] = row[index]?.trim();
        });

        const orderId = lineData['OrderID'];
        if (!orderId) {
            errors.push(`Supplier CSV (Row ${rowIndex + 2}): Missing OrderID for linking.`);
            return;
        }

        const supplierId = lineData['SupplierID_for_LineItem'];
        if (supplierId && !suppliersMap.has(supplierId)) {
            const supName = lineData['SupplierName_for_LineItem'];
            if (!supName) errors.push(`Supplier CSV (Row ${rowIndex + 2}): Missing SupplierName_for_LineItem for SupplierID ${supplierId}.`);
            suppliersMap.set(supplierId, {
                id: supplierId,
                name: supName || `Unknown Supplier ${supplierId}`,
                country: 'India', 
                avgTat: parseFloat(lineData['SupplierAvgTATDays_for_LineItem'] || '0') || 0,
                deliveryRate: parseFloat(lineData['SupplierDeliveryRate_for_LineItem'] || '0') || 0,
                pricingVariance: parseFloat(lineData['SupplierPricingVariance_for_LineItem'] || '0') || 0,
            });
        }

        const quantity = parseFloat(lineData['Quantity'] || '0');
        if (isNaN(quantity)) {
             errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID ${lineData['LineItemID'] || `auto-${rowIndex}`}): Invalid number format for quantity. Defaulting to 0.`);
        }
        
        const lineItem: OrderLineItem = {
            id: lineData['LineItemID'] || `${orderId}-li-${rowIndex}-${Date.now()}`,
            productId: `prod-${lineData['LineItemID']?.slice(-4) || rowIndex}`,
            productName: `Product ${lineData['LineItemID'] || `LI-${rowIndex + 1}`}`,
            productType: PRODUCT_TYPE_LIST[rowIndex % PRODUCT_TYPE_LIST.length],
            quantity: isNaN(quantity) ? 0 : quantity,
            quotedPricePerUnit: 0,
            negotiatedPricePerUnit: undefined,
            finalPricePerUnit: 0,
            supplierId: lineData['SupplierID_for_LineItem'],
            lineItemNotes: undefined,
            supplierProductionStartDate: parseDateString(lineData['SupplierProductionStartDate'])?.toISOString(),
            supplierExpectedDispatchDate: parseDateString(lineData['SupplierExpectedDispatchDate'])?.toISOString(),
            supplierActualDispatchDate: parseDateString(lineData['SupplierActualDispatchDate'])?.toISOString(),
            supplierBLNumber: lineData['SupplierBLNumber'] || undefined,
            supplierPaymentTerms: lineData['SupplierPaymentTerms'] || undefined,
            supplierAdvancePaidAmount: lineData['SupplierAdvancePaidAmount'] ? parseFloat(lineData['SupplierAdvancePaidAmount']) : undefined,
            supplierAdvancePaidDate: parseDateString(lineData['SupplierAdvancePaidDate'])?.toISOString(),
            supplierBeforePaidAmount: lineData['SupplierBeforePaidAmount'] ? parseFloat(lineData['SupplierBeforePaidAmount']) : undefined,
            supplierBeforePaidDate: parseDateString(lineData['SupplierBeforePaidDate'])?.toISOString(),
            supplierBalancePaidAmount: lineData['SupplierBalancePaidAmount'] ? parseFloat(lineData['SupplierBalancePaidAmount']) : undefined,
            supplierBalancePaidDate: parseDateString(lineData['SupplierBalancePaidDate'])?.toISOString(),
            supplierNotes: lineData['SupplierNotes'] || undefined,
        };
        
        if (lineData['SupplierProductionStartDate'] && !lineItem.supplierProductionStartDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierProductionStartDate "${lineData['SupplierProductionStartDate']}".`);
        if (lineData['SupplierExpectedDispatchDate'] && !lineItem.supplierExpectedDispatchDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierExpectedDispatchDate "${lineData['SupplierExpectedDispatchDate']}".`);
        if (lineData['SupplierActualDispatchDate'] && !lineItem.supplierActualDispatchDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierActualDispatchDate "${lineData['SupplierActualDispatchDate']}".`);
        if (lineData['SupplierAdvancePaidDate'] && !lineItem.supplierAdvancePaidDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierAdvancePaidDate "${lineData['SupplierAdvancePaidDate']}".`);
        if (lineData['SupplierBeforePaidDate'] && !lineItem.supplierBeforePaidDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierBeforePaidDate "${lineData['SupplierBeforePaidDate']}".`);
        if (lineData['SupplierBalancePaidDate'] && !lineItem.supplierBalancePaidDate) errors.push(`Supplier CSV (OrderID: ${orderId}, LineItemID: ${lineItem.id}): Invalid SupplierBalancePaidDate "${lineData['SupplierBalancePaidDate']}".`);


        if (!lineItemsByOrderId.has(orderId)) {
            lineItemsByOrderId.set(orderId, []);
        }
        lineItemsByOrderId.get(orderId)!.push(lineItem);
    });

    orderDataRows.forEach((row, rowIndex) => {
        const rowData: Record<string, string> = {};
        orderHeaders.forEach((header, index) => {
            rowData[header] = row[index]?.trim();
        });

        const orderId = rowData['OrderID'];
        if (!orderId) {
            errors.push(`Order CSV (Row ${rowIndex + 2}): Missing OrderID.`);
            return;
        }

        if (!Object.values(OrderStatus).includes(rowData['CurrentStage'] as OrderStatus)) {
            errors.push(`Order CSV (OrderID: ${orderId}): Invalid CurrentStage value "${rowData['CurrentStage']}". Defaulting to '${OrderStatus.FRESH_ORDER}'.`);
            rowData['CurrentStage'] = OrderStatus.FRESH_ORDER;
        }
        
        const parsedOrderDate = parseDateString(rowData['OrderDate']);
        if (!parsedOrderDate && rowData['OrderDate']) {
             errors.push(`Order CSV (OrderID: ${orderId}): Invalid OrderDate "${rowData['OrderDate']}". Using current date as fallback.`);
        }
        const orderDateISO = parsedOrderDate ? parsedOrderDate.toISOString() : todayISO;

        const parsedExpectedDeliveryDate = parseDateString(rowData['ExpectedDeliveryDate']);
        if (rowData['ExpectedDeliveryDate'] && !parsedExpectedDeliveryDate) errors.push(`Order CSV (OrderID: ${orderId}): Invalid ExpectedDeliveryDate "${rowData['ExpectedDeliveryDate']}".`);
        
        const parsedExpectedPaymentDate = parseDateString(rowData['ExpectedPaymentDate']);
        if (rowData['ExpectedPaymentDate'] && !parsedExpectedPaymentDate) errors.push(`Order CSV (OrderID: ${orderId}): Invalid ExpectedPaymentDate "${rowData['ExpectedPaymentDate']}".`);

        const parsedActualPaymentDate = parseDateString(rowData['ActualPaymentDate']);
        if (rowData['ActualPaymentDate'] && !parsedActualPaymentDate) errors.push(`Order CSV (OrderID: ${orderId}): Invalid ActualPaymentDate "${rowData['ActualPaymentDate']}".`);

        const totalNegotiatedPriceNum = rowData['TotalNegotiatedPrice'] ? parseFloat(rowData['TotalNegotiatedPrice']) : undefined;
        const totalFinalPriceNum = rowData['TotalFinalPrice'] ? parseFloat(rowData['TotalFinalPrice']) : undefined; 

        if (rowData['TotalNegotiatedPrice'] && isNaN(totalNegotiatedPriceNum!)) errors.push(`Order CSV (OrderID: ${orderId}): Invalid TotalNegotiatedPrice "${rowData['TotalNegotiatedPrice']}".`);
        if (rowData['TotalFinalPrice'] && isNaN(totalFinalPriceNum!)) errors.push(`Order CSV (OrderID: ${orderId}): Invalid TotalFinalPrice "${rowData['TotalFinalPrice']}".`);

        ordersMap.set(orderId, {
            id: orderId,
            clientName: rowData['ClientName'],
            clientCountry: rowData['ClientCountry'] || CLIENT_COUNTRIES[0],
            orderDate: orderDateISO,
            currentStage: rowData['CurrentStage'] as OrderStatus,
            expectedDeliveryDate: parsedExpectedDeliveryDate?.toISOString(),
            expectedPaymentDate: parsedExpectedPaymentDate?.toISOString(),
            actualPaymentDate: parsedActualPaymentDate?.toISOString(), 
            clientMoq: parseFloat(rowData['ClientMOQ'] || '0') || undefined,
            orderNotes: rowData['OrderNotes'],
            reasonForCancellation: rowData['ReasonForCancellation'],
            slaDaysPerStage: DEFAULT_SLA_DAYS_PER_STAGE,
            totalNegotiatedPrice: !isNaN(totalNegotiatedPriceNum!) ? totalNegotiatedPriceNum : undefined, 
            totalFinalPrice: !isNaN(totalFinalPriceNum!) ? totalFinalPriceNum : 0, 
            clientPayments: [], 
            stageHistory: [],
            lineItems: [], 
        });

        const stageHistory: StageHistoryItem[] = [];
        let lastKnownStageEndDate: string | undefined = orderDateISO;

        activeStagesForHeaders.forEach(stage => { 
            const startDateHeader = `Stage_${stage.replace(/\s+/g, '')}_StartDate`;
            const endDateHeader = `Stage_${stage.replace(/\s+/g, '')}_EndDate`;
            
            const rawStageStartDate = rowData[startDateHeader];
            const parsedStageStartDate = parseDateString(rawStageStartDate);
            if (rawStageStartDate && !parsedStageStartDate) errors.push(`Order CSV (OrderID: ${orderId}, Stage: ${stage}): Invalid StartDate "${rawStageStartDate}".`);

            const rawStageEndDate = rowData[endDateHeader];
            let parsedStageEndDate = parseDateString(rawStageEndDate);
            if (rawStageEndDate && !parsedStageEndDate) errors.push(`Order CSV (OrderID: ${orderId}, Stage: ${stage}): Invalid EndDate "${rawStageEndDate}".`);
            
            if (parsedStageStartDate) {
                const stageStartDateISO = parsedStageStartDate.toISOString();
                const stageEndDateISO = parsedStageEndDate?.toISOString();
                const sla = DEFAULT_SLA_DAYS_PER_STAGE[stage];
                let isDelayed = false;
                if(stageEndDateISO && sla) isDelayed = (daysBetween(stageStartDateISO, stageEndDateISO) || 0) > sla;
                else if (!stageEndDateISO && stage === (rowData['CurrentStage'] as OrderStatus) && sla && stage !== OrderStatus.PAID) isDelayed = (daysBetween(stageStartDateISO, todayISO) || 0) > sla;
                
                stageHistory.push({ stage, startDate: stageStartDateISO, endDate: stageEndDateISO, isDelayed, notes: isDelayed ? `Exceeded SLA of ${sla} days.` : undefined });
                if (stageEndDateISO) lastKnownStageEndDate = stageEndDateISO;
                else lastKnownStageEndDate = undefined; 
            }
        });
        
        const rawCancelledStageStartDate = rowData[`Stage_${OrderStatus.CANCELLED.replace(/\s+/g, '')}_StartDate`];
        const parsedCancelledStageStartDate = parseDateString(rawCancelledStageStartDate);
        if (rawCancelledStageStartDate && !parsedCancelledStageStartDate) errors.push(`Order CSV (OrderID: ${orderId}): Invalid Cancelled Stage StartDate "${rawCancelledStageStartDate}".`);

        if (parsedCancelledStageStartDate) {
            stageHistory.push({ stage: OrderStatus.CANCELLED, startDate: parsedCancelledStageStartDate.toISOString(), notes: rowData['ReasonForCancellation'] });
        }


        if (stageHistory.length === 0 && orderDateISO) { 
            stageHistory.push({ stage: OrderStatus.FRESH_ORDER, startDate: orderDateISO, isDelayed: false });
             if ((rowData['CurrentStage'] as OrderStatus) !== OrderStatus.FRESH_ORDER && (rowData['CurrentStage'] as OrderStatus) !== OrderStatus.CANCELLED) {
                const currentStageInHistory = stageHistory.find(sh => sh.stage === rowData['CurrentStage']);
                if(!currentStageInHistory) {
                    stageHistory.push({ stage: rowData['CurrentStage'] as OrderStatus, startDate: addDaysToDate(orderDateISO,1), }); 
                }
            }
        }
        ordersMap.get(orderId)!.stageHistory = stageHistory;

        const deliveredStageEntry = stageHistory.find(h => h.stage === OrderStatus.DELIVERED);
        const readyStageEntry = stageHistory.find(h => h.stage === OrderStatus.READY_FOR_DISPATCH);
        let dispatchDateCalc: string | undefined;
        if (deliveredStageEntry?.startDate) dispatchDateCalc = deliveredStageEntry.startDate;
        else if (readyStageEntry?.endDate) dispatchDateCalc = readyStageEntry.endDate; 
        if (rowData['CurrentStage'] === OrderStatus.CANCELLED) dispatchDateCalc = undefined;
        ordersMap.get(orderId)!.dispatchDate = dispatchDateCalc;

    });

    const finalOrders: Order[] = [];
    ordersMap.forEach((partialOrder, orderId) => {
        const linkedLineItems = lineItemsByOrderId.get(orderId) || [];
        let sum_li_quantity = 0;
        let sum_li_supplier_cost = 0;

        linkedLineItems.forEach(li => {
            sum_li_quantity += li.quantity;
            sum_li_supplier_cost += li.finalPricePerUnit * li.quantity; 
        });

        const orderTotalSupplierCost = parseFloat(sum_li_supplier_cost.toFixed(2));

        const orderTotalFinalClientPrice = partialOrder.totalFinalPrice 
            ? parseFloat(partialOrder.totalFinalPrice.toFixed(2))
            : 0; 
        
        const orderTotalNegotiatedClientPrice = partialOrder.totalNegotiatedPrice
            ? parseFloat(partialOrder.totalNegotiatedPrice.toFixed(2))
            : orderTotalFinalClientPrice; 

        const orderTotalQuotedClientPrice = orderTotalNegotiatedClientPrice; 

        if (partialOrder.totalFinalPrice === undefined || partialOrder.totalFinalPrice === null) {
             errors.push(`Warning (OrderID: ${orderId}): TotalFinalPrice (Client Price) is missing or invalid in Order CSV. Order value calculations may be incorrect. Defaulted to $0.`);
        }

        let paymentStatus: Order['paymentStatus'] = 'Pending';
        if (partialOrder.actualPaymentDate) {
            paymentStatus = 'Paid';
        } else if (partialOrder.expectedPaymentDate && new Date(partialOrder.expectedPaymentDate) < new Date() && partialOrder.currentStage !== OrderStatus.CANCELLED) {
            paymentStatus = 'Overdue';
        }
        if (partialOrder.currentStage === OrderStatus.CANCELLED) {
            paymentStatus = 'Pending'; 
        }

        const completeOrder: Order = {
            id: partialOrder.id!, clientName: partialOrder.clientName!, clientCountry: partialOrder.clientCountry!,
            orderDate: partialOrder.orderDate!, currentStage: partialOrder.currentStage!,
            stageHistory: partialOrder.stageHistory || [], lineItems: linkedLineItems,
            totalQuantity: sum_li_quantity,
            totalQuotedPrice: orderTotalQuotedClientPrice,
            totalNegotiatedPrice: orderTotalNegotiatedClientPrice,
            totalFinalPrice: orderTotalFinalClientPrice, 
            totalSupplierCost: orderTotalSupplierCost, 
            clientPayments: [], 
            paymentStatus: paymentStatus, 
            slaDaysPerStage: partialOrder.slaDaysPerStage || DEFAULT_SLA_DAYS_PER_STAGE,
            expectedDeliveryDate: partialOrder.expectedDeliveryDate!, actualDeliveryDate: partialOrder.actualDeliveryDate,
            expectedPaymentDate: partialOrder.expectedPaymentDate, actualPaymentDate: partialOrder.actualPaymentDate,
            dispatchDate: partialOrder.dispatchDate,
            clientMoq: partialOrder.clientMoq, orderNotes: partialOrder.orderNotes,
            reasonForCancellation: partialOrder.reasonForCancellation,
        };
        finalOrders.push(completeOrder);

        if (orderTotalSupplierCost === 0 && linkedLineItems.length > 0 && completeOrder.currentStage !== OrderStatus.CANCELLED && linkedLineItems.some(li => li.quantity > 0)) {
            errors.push(`Warning (OrderID: ${orderId}): Total Supplier Cost is $0. 'FinalPricePerUnit' (supplier cost) is no longer imported from the Supplier/Line Item CSV. Financial metrics related to supplier costs will be inaccurate. Defaulting unit supplier costs to $0.`);
        }
    });

    const finalSuppliers = Array.from(suppliersMap.values());
    return { orders: finalOrders, suppliers: finalSuppliers, errors };
};
