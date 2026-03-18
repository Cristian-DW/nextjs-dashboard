-- Phase 2 Migration: Settings, Suppliers, Discount Codes, Purchase Orders
-- Run: npm run migrate-p2

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Settings key-value store
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('business_name', 'Deltux POS'),
  ('business_address', '123 Main Street, City, Country'),
  ('business_phone', '+1 (555) 000-0000'),
  ('currency', 'USD'),
  ('default_tax_rate', '0'),
  ('receipt_footer', 'Thank you for your purchase!')
ON CONFLICT (key) DO NOTHING;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link products to suppliers
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Discount codes
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'percentage',  -- 'percentage' | 'fixed'
  value INT NOT NULL,              -- percentage (0-100) or cents for fixed
  min_amount INT DEFAULT 0,        -- minimum order amount in cents
  max_uses INT,                    -- null = unlimited
  uses_count INT DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO discount_codes (code, description, type, value, max_uses) VALUES
  ('WELCOME10', '10% off for new customers', 'percentage', 10, 100),
  ('SAVE5', '$5 off any order', 'fixed', 500, 200),
  ('VIP20', '20% VIP discount', 'percentage', 20, NULL)
ON CONFLICT (code) DO NOTHING;

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft',  -- draft | ordered | received | cancelled
  notes TEXT,
  expected_at DATE,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase order line items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity_ordered INT NOT NULL,
  quantity_received INT DEFAULT 0,
  unit_cost INT DEFAULT 0   -- in cents
);

-- Seed sample suppliers
INSERT INTO suppliers (name, contact_name, email, phone) VALUES
  ('Global Beverages Co.', 'Maria Garcia', 'orders@globalbev.com', '+1 (555) 100-2000'),
  ('TechParts Inc.', 'John Smith', 'supply@techparts.io', '+1 (555) 300-4000'),
  ('Fashion Forward Ltd.', 'Sophie Chen', 'wholesale@ff.com', '+1 (555) 500-6000')
ON CONFLICT DO NOTHING;
