export enum OrderStatus {
  FRESH_ORDER = 'Fresh Order', // Renamed from RECEIVED
  // SUPPLIER_NEGOTIATION = 'Supplier Negotiation', // Removed
  PRODUCTION = 'Production',
  READY_FOR_DISPATCH = 'Ready for Dispatch',
  DELIVERED = 'Delivered to Client',
  PAID = 'Payment Received',
  CANCELLED = 'Cancelled', // New Status
}

export const ORDER_STATUS_LIST: OrderStatus[] = [
  OrderStatus.FRESH_ORDER, // Updated
  // OrderStatus.SUPPLIER_NEGOTIATION, // Removed
  OrderStatus.PRODUCTION,
  OrderStatus.READY_FOR_DISPATCH,
  OrderStatus.DELIVERED,
  OrderStatus.PAID,
  OrderStatus.CANCELLED, // Added
];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.FRESH_ORDER]: 'bg-blue-500 text-white', // Updated
  // [OrderStatus.SUPPLIER_NEGOTIATION]: 'bg-indigo-500 text-white', // Removed
  [OrderStatus.PRODUCTION]: 'bg-purple-500 text-white',
  [OrderStatus.READY_FOR_DISPATCH]: 'bg-amber-500 text-white', // Updated for better readability
  [OrderStatus.DELIVERED]: 'bg-teal-500 text-white',
  [OrderStatus.PAID]: 'bg-green-500 text-white',
  [OrderStatus.CANCELLED]: 'bg-slate-500 text-white', // Updated for better readability
};

export const DEFAULT_SLA_DAYS_PER_STAGE: Record<OrderStatus, number> = {
  [OrderStatus.FRESH_ORDER]: 2, // Updated, Adjusted SLA slightly
  // [OrderStatus.SUPPLIER_NEGOTIATION]: 3, // Removed
  [OrderStatus.PRODUCTION]: 20,
  [OrderStatus.READY_FOR_DISPATCH]: 2,
  [OrderStatus.DELIVERED]: 10,
  [OrderStatus.PAID]: 30,
  [OrderStatus.CANCELLED]: 0, // SLA not typically applicable
};

export enum ProductType {
  GRASS_CUTTER = 'Grass Cutter',
  WATER_PUMP = 'Water Pump',
  POWER_TILLER = 'Power Tiller',
  SPRAYER = 'Agricultural Sprayer',
  HARVESTER = 'Mini Harvester',
}

export const PRODUCT_TYPE_LIST: ProductType[] = [
  ProductType.GRASS_CUTTER,
  ProductType.WATER_PUMP,
  ProductType.POWER_TILLER,
  ProductType.SPRAYER,
  ProductType.HARVESTER,
];

export const CLIENT_COUNTRIES = ['USA', 'Germany', 'UK', 'France', 'Canada', 'Australia', 'Japan', 'Brazil', 'South Africa', 'UAE'];
export const SUPPLIER_NAMES = ['AgroEquip India', 'FarmMech Solutions', 'HarvestTech Ltd.', 'KrishiYantra Corp', 'GreenField Machines'];

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

export const DEFAULT_ORDER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1BYyNlSrCrXpxVDphyIzO3xtjcJkPjABD8QsnH_yqtT0/edit?gid=624509827#gid=624509827";
export const DEFAULT_SUPPLIER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1BYyNlSrCrXpxVDphyIzO3xtjcJkPjABD8QsnH_yqtT0/edit?gid=1281142439#gid=1281142439";
