-- ============================================================
-- Migration 001: Initial Schema
-- Platform Jasa OB Rusun
-- ============================================================

-- 1. Enum types
CREATE TYPE user_role AS ENUM ('customer', 'ob', 'admin');
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);
CREATE TYPE payment_method AS ENUM ('cash', 'transfer');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  unit_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Service Categories
CREATE TABLE service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Services (Katalog Layanan)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  requested_date DATE NOT NULL,
  preferred_time_note TEXT,
  confirmed_datetime TIMESTAMPTZ,
  ob_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  invoice_sent_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  customer_notes TEXT,
  ob_notes TEXT,
  midtrans_transaction_id TEXT,
  midtrans_payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Status History
CREATE TABLE order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notification Log
CREATE TABLE notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_ob ON orders(ob_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(requested_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_services
  BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Order Number Generator
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM orders
  WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE;
  RETURN 'ORD-' || today || '-' || LPAD(seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, unit_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'unit_number',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Services: public read for active, admin write
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services"
  ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service Categories: public read
CREATE POLICY "Anyone can view categories"
  ON service_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories"
  ON service_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders: customers see own, OB see assigned, admin see all
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "OB can view assigned and unassigned orders"
  ON orders FOR SELECT USING (
    ob_id = auth.uid() OR ob_id IS NULL
  );
CREATE POLICY "Admins can view all orders"
  ON orders FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "OB can update assigned orders"
  ON orders FOR UPDATE USING (ob_id = auth.uid());

-- Order items: readable by order owner/OB/admin
CREATE POLICY "Order items visible with order access"
  ON order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.customer_id = auth.uid() OR o.ob_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- ============================================================
-- Seed Data: Service Categories
-- ============================================================
INSERT INTO service_categories (name, slug, sort_order) VALUES
  ('Kebersihan Unit', 'kebersihan-unit', 1),
  ('Kasur & Sprei', 'kasur-sprei', 2),
  ('Karpet & Lantai', 'karpet-lantai', 3),
  ('Kamar Mandi', 'kamar-mandi', 4),
  ('Dapur', 'dapur', 5);

-- Seed Data: Services
INSERT INTO services (category_id, name, description, price, is_active, sort_order)
SELECT
  sc.id,
  s.name,
  s.description,
  s.price,
  true,
  s.sort_order
FROM (VALUES
  ('kebersihan-unit', 'Bersih Unit Studio', 'Pembersihan menyeluruh unit studio (sapu, pel, lap permukaan)', 75000, 1),
  ('kebersihan-unit', 'Bersih Unit 1BR', 'Pembersihan menyeluruh unit 1 kamar tidur', 100000, 2),
  ('kebersihan-unit', 'Bersih Unit 2BR', 'Pembersihan menyeluruh unit 2 kamar tidur', 135000, 3),
  ('kasur-sprei', 'Cuci Kasur Single', 'Pembersihan dan penghilangan debu kasur ukuran single', 85000, 1),
  ('kasur-sprei', 'Cuci Kasur Double', 'Pembersihan dan penghilangan debu kasur ukuran double', 110000, 2),
  ('kasur-sprei', 'Ganti & Cuci Sprei', 'Ganti sprei bersih dan cuci sprei kotor', 45000, 3),
  ('karpet-lantai', 'Cuci Karpet Kecil (< 2m²)', 'Pembersihan karpet ukuran kecil', 60000, 1),
  ('karpet-lantai', 'Cuci Karpet Besar (> 2m²)', 'Pembersihan karpet ukuran besar', 95000, 2),
  ('kamar-mandi', 'Bersih Kamar Mandi', 'Pembersihan toilet, wastafel, lantai, dan cermin', 65000, 1),
  ('dapur', 'Bersih Dapur', 'Pembersihan kompor, wastafel, dan area masak', 60000, 1)
) AS s(slug, name, description, price, sort_order)
JOIN service_categories sc ON sc.slug = s.slug;
