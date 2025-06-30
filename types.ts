

import React from 'react';
import { OrderStatus, ProductType } from './constants'; // Import for use within this file
export { OrderStatus, ProductType } from './constants'; // Re-exporting OrderStatus and ProductType

export interface StageHistoryItem {
  stage: OrderStatus;
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
  notes?: string;
  isDelayed?: boolean;
}

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  productType: ProductType;
  quantity: number;
  quotedPricePerUnit: number; // Client-facing initial price per unit
  negotiatedPricePerUnit?: number; // Client-facing negotiated price per unit
  finalPricePerUnit: number; // Cost from supplier per unit
  supplierId: string;
  lineItemNotes?: string; // Internal notes for this line item

  // Supplier-Specific Fields (Cost & Logistics from Bonhoeffer's side)
  supplierProductionStartDate?: string; // ISO Date string
  supplierExpectedDispatchDate?: string; // ISO Date string
  supplierActualDispatchDate?: string; // ISO Date string
  supplierBLNumber?: string;
  supplierPaymentTerms?: string; // e.g., "30% Advance, 40% Before Dispatch, 30% on BL"
  supplierAdvancePaidAmount?: number;
  supplierAdvancePaidDate?: string; // ISO Date string
  supplierBeforePaidAmount?: number; // New field
  supplierBeforePaidDate?: string; // New field - ISO Date string
  supplierBalancePaidAmount?: number;
  supplierBalancePaidDate?: string; // ISO Date string
  supplierNotes?: string; // Specific notes from/for the supplier regarding this line item
}

export interface ClientPayment {
  id: string;
  amountPaid: number;
  paymentDate: string; // ISO Date string
  paymentMethod?: string; // e.g., 'Bank Transfer', 'Credit Card', 'Cash'
  notes?: string;
}

export interface Order {
  id: string;
  clientName: string;
  clientCountry: string;
  orderDate: string;
  currentStage: OrderStatus;
  stageHistory: StageHistoryItem[];
  lineItems: OrderLineItem[];

  totalQuantity: number;

  // Client-Facing Prices
  totalQuotedPrice: number; // Sum of all lineItems' quotedPricePerUnit * quantity
  totalNegotiatedPrice?: number; // Order-level negotiated price with client, or sum of lineItems' negotiatedPricePerUnit
  totalFinalPrice: number; // Definitive final price client has to pay for the entire order

  // Internal Costs
  totalSupplierCost: number; // Sum of all lineItems' finalPricePerUnit * quantity (Bonhoeffer's COGS)
  
  // Client Payment Tracking
  clientPayments: ClientPayment[];
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue'; // Derived from totalFinalPrice and clientPayments
  expectedPaymentDate?: string; // Expected date for full payment from client
  actualPaymentDate?: string; // Date client made the final payment making the order 'Paid'
  
  // Logistics & Other
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  dispatchDate?: string;
  
  slaDaysPerStage: Record<OrderStatus, number>;
  clientMoq?: number;
  orderNotes?: string;
  reasonForCancellation?: string;
}

export interface Supplier {
  id: string;
  name: string;
  avgTat: number; // in days
  deliveryRate: number; // percentage (0-1)
  pricingVariance: number; // percentage (0-1) representing deviation from their own quote to final cost to Bonhoeffer
  country: string;
}

export interface Kpi {
  title: string;
  value: string | number;
  trend?: number; // percentage change
  unit?: string;
  status?: 'good' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export interface FilterOptions {
  dateRange: { start?: string; end?: string };
  supplierIds: string[];
  clientCountries: string[];
  productTypes: ProductType[];
  showCancelledOrders?: boolean;
  year?: string;
}

export interface SavedFilterSet {
  name: string;
  filters: FilterOptions;
}

// User Management Types
export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface ManagedUser extends AuthUser {
  passwordPlain: string; // Stored in plain text for this exercise - NOT FOR PRODUCTION
}


// These types were related to AI features, which are being removed.
// Kept for potential future re-integration or if other non-AI parts depend on them.
// If confirmed not needed, they can be fully removed.
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface AISuggestionItem {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  relatedOrderIds?: string[];
}