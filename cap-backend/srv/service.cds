using deltux.pos from '../db/schema';

// ─── CATALOG SERVICE ──────────────────────────────────────────────────────────
// Public product catalog — read-only for most entities
// Consumed by: Next.js UI, Fiori app, Integration Suite

@path: '/odata/v4/catalog'
@(requires: 'authenticated-user')
service CatalogService {

  @readonly
  entity Products    as projection on pos.products;

  @readonly
  entity Categories  as projection on pos.categories;

  @readonly
  entity Suppliers   as projection on pos.suppliers;

  @readonly
  entity Customers   as projection on pos.customers {
    *,
    invoices : redirected to pos.invoices
  };

  @readonly
  entity Discounts   as projection on pos.discounts;
}

// ─── SALES SERVICE ────────────────────────────────────────────────────────────
// Full CRUD for sales operations
// Consumed by: POS terminal, Integration Suite (iFlows)

@path: '/odata/v4/sales'
@(requires: 'Cashier')
service SalesService {

  entity Invoices      as projection on pos.invoices;
  entity InvoiceItems  as projection on pos.invoice_items;
  entity POSSales      as projection on pos.pos_sales;
  entity POSSaleItems  as projection on pos.pos_sale_items;

  // Add readonly projections to satisfy associations
  @readonly entity Products as projection on pos.products;
  @readonly entity Customers as projection on pos.customers;
}

// ─── ADMIN SERVICE ────────────────────────────────────────────────────────────
// Full management: products, customers, categories, suppliers
// Consumed by: Dashboard admin, Integration Suite

@path: '/odata/v4/admin'
@(requires: 'Admin')
service AdminService {

  @cds.redirection.target
  entity Products    as projection on pos.products;
  entity Categories  as projection on pos.categories;
  entity Suppliers   as projection on pos.suppliers;
  entity Customers   as projection on pos.customers;
  entity Discounts   as projection on pos.discounts;

  // Low stock view — products below threshold
  @readonly
  view LowStockAlerts as select from pos.products {
    id, name, sku, stock, low_stock_threshold, category_id, image_url
  } where stock <= low_stock_threshold and is_active = true;
}
