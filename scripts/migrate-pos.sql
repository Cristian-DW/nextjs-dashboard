-- POS System Migration Script
-- Run with: psql $POSTGRES_URL -f scripts/migrate-pos.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'tag',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL, -- in cents
  category_id UUID REFERENCES categories(id),
  sku TEXT UNIQUE,
  stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  image_url TEXT DEFAULT '/products/placeholder.png',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  subtotal INT NOT NULL,            -- before discount/tax, in cents
  discount_amount INT DEFAULT 0,    -- in cents
  tax_amount INT DEFAULT 0,         -- in cents
  total INT NOT NULL,               -- final amount in cents
  payment_method TEXT DEFAULT 'cash', -- cash | card | transfer
  cash_tendered INT DEFAULT 0,
  change_given INT DEFAULT 0,
  status TEXT DEFAULT 'completed',  -- completed | refunded | voided
  notes TEXT,
  cashier TEXT DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sale Line Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL,
  unit_price INT NOT NULL,
  total INT NOT NULL
);

-- Seed categories
INSERT INTO categories (name, color, icon) VALUES
  ('Food & Beverage', '#f59e0b', 'cake'),
  ('Electronics', '#3b82f6', 'cpu-chip'),
  ('Clothing', '#ec4899', 'swatch'),
  ('Home & Office', '#10b981', 'home'),
  ('Health & Beauty', '#8b5cf6', 'sparkles'),
  ('Sports', '#ef4444', 'trophy'),
  ('Books & Media', '#6366f1', 'book-open'),
  ('Other', '#6b7280', 'archive-box')
ON CONFLICT (name) DO NOTHING;

-- Seed sample products
INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Espresso', 'Rich single-shot espresso', 250, c.id, 'BEV-001', 999, 10
FROM categories c WHERE c.name = 'Food & Beverage'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Cappuccino', 'Espresso with steamed milk foam', 450, c.id, 'BEV-002', 999, 10
FROM categories c WHERE c.name = 'Food & Beverage'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Latte', 'Espresso with lots of steamed milk', 500, c.id, 'BEV-003', 999, 10
FROM categories c WHERE c.name = 'Food & Beverage'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Croissant', 'Buttery flaky pastry', 300, c.id, 'FOD-001', 24, 5
FROM categories c WHERE c.name = 'Food & Beverage'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Chocolate Muffin', 'Double chocolate chip muffin', 350, c.id, 'FOD-002', 18, 5
FROM categories c WHERE c.name = 'Food & Beverage'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'USB-C Cable 1m', 'Braided fast-charging cable', 1499, c.id, 'ELC-001', 45, 10
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Wireless Earbuds', 'True wireless, 30h battery', 4999, c.id, 'ELC-002', 12, 5
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Phone Case', 'Clear protective case universal', 999, c.id, 'ELC-003', 3, 5
FROM categories c WHERE c.name = 'Electronics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Classic T-Shirt', 'Soft cotton unisex tee', 1800, c.id, 'CLO-001', 60, 10
FROM categories c WHERE c.name = 'Clothing'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (name, description, price, category_id, sku, stock, low_stock_threshold)
SELECT 'Notebook A5', 'Dotted grid, 200 pages', 800, c.id, 'OFF-001', 30, 8
FROM categories c WHERE c.name = 'Home & Office'
ON CONFLICT (sku) DO NOTHING;
