namespace deltux.pos;

// ─── EXISTING (mapped to existing PostgreSQL tables) ─────────────────────────

@cds.persistence.exists
entity categories {
  key id          : UUID;
  name            : String;
  color           : String;
  icon            : String;
  created_at      : Timestamp;
  products        : Association to many products on products.category_id = $self.id;
}

@cds.persistence.exists
entity suppliers {
  key id           : UUID;
  name             : String;
  contact_name     : String;
  email            : String;
  phone            : String;
  address          : String;
  notes            : String;
  is_active        : Boolean;
  created_at       : Timestamp;
  products         : Association to many products on products.supplier_id = $self.id;
}

@cds.persistence.exists
entity products {
  key id                 : UUID;
  name                   : String;
  description            : String;
  price                  : Integer;
  category_id            : UUID;
  category               : Association to categories on category.id = $self.category_id;
  supplier_id            : UUID;
  supplier               : Association to suppliers on supplier.id = $self.supplier_id;
  sku                    : String;
  stock                  : Integer;
  low_stock_threshold    : Integer;
  image_url              : String;
  is_active              : Boolean;
  created_at             : Timestamp;
}

@cds.persistence.exists
entity customers {
  key id           : UUID;
  name             : String;
  email            : String;
  phone            : String;
  address          : String;
  image_url        : String;
  created_at       : Timestamp;
  invoices         : Association to many invoices on invoices.customer_id = $self.id;
}

@cds.persistence.exists
entity invoices {
  key id           : UUID;
  customer_id      : UUID;
  customer         : Association to customers on customer.id = $self.customer_id;
  amount           : Integer;
  status           : String;
  date             : Date;
  due_date         : Date;
  items            : Association to many invoice_items on items.invoice_id = $self.id;
}

@cds.persistence.exists
entity invoice_items {
  key id           : UUID;
  invoice_id       : UUID;
  invoice          : Association to invoices on invoice.id = $self.invoice_id;
  product_id       : UUID;
  product          : Association to products on product.id = $self.product_id;
  quantity         : Integer;
  unit_price       : Integer;
  subtotal         : Integer;
}

@cds.persistence.exists
entity pos_sales {
  key id           : UUID;
  sale_date        : Timestamp;
  total_amount     : Integer;
  payment_method   : String;
  customer_id      : UUID;
  customer         : Association to customers on customer.id = $self.customer_id;
  cashier_id       : UUID;
  status           : String;
  notes            : String;
  items            : Association to many pos_sale_items on items.sale_id = $self.id;
}

@cds.persistence.exists
entity pos_sale_items {
  key id           : UUID;
  sale_id          : UUID;
  sale             : Association to pos_sales on sale.id = $self.sale_id;
  product_id       : UUID;
  product          : Association to products on product.id = $self.product_id;
  quantity         : Integer;
  unit_price       : Integer;
  subtotal         : Integer;
  discount_pct     : Integer;
}

@cds.persistence.exists
entity discounts {
  key id           : UUID;
  name             : String;
  discount_type    : String;
  value            : Integer;
  applies_to       : String;
  target_id        : UUID;
  is_active        : Boolean;
  valid_from       : Date;
  valid_until      : Date;
  created_at       : Timestamp;
}
