// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  address?: string;
  vat_id?: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type CustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
  due_date?: string;
};

// ─────────────────────────────────────────
// POS SYSTEM TYPES
// ─────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number; // in cents
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type CartItem = {
  product_id: string;
  name: string;
  sku: string | null;
  price: number; // in cents
  quantity: number;
  total: number; // in cents
};

export type Sale = {
  id: string;
  customer_id: string | null;
  customer_name?: string;
  customer_image?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'transfer';
  cash_tendered: number;
  change_given: number;
  status: 'completed' | 'refunded' | 'voided';
  notes: string | null;
  cashier: string;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

export type SaleWithItems = Sale & {
  items: SaleItem[];
};

export type SalesTable = {
  id: string;
  customer_name: string | null;
  customer_image: string | null;
  total: number;
  payment_method: string;
  status: string;
  item_count: number;
  created_at: string;
};

export type AnalyticsSummary = {
  totalRevenue: number;
  totalSales: number;
  avgOrderValue: number;
  totalItemsSold: number;
  lowStockCount: number;
};

export type DailyRevenue = {
  day: string;
  revenue: number;
};

export type TopProduct = {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
};

export type HourlyData = {
  hour: number;
  sale_count: number;
};

export type StockAdjustment = {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: string;
  created_at: string;
};
