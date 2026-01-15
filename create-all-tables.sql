-- =====================================================
-- EEM Transport Manager - Complete Database Schema
-- Run this script to create all necessary tables
-- =====================================================

-- Create the handle_updated_at function first
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. SHIPMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    client_code TEXT,
    sender_name TEXT NOT NULL,
    sender_phone TEXT,
    sender_id TEXT,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT,
    receiver_address TEXT NOT NULL,
    zip_code TEXT,
    city TEXT NOT NULL,
    parcels JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_items INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'MAD',
    advance_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2),
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    note TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on shipments" ON public.shipments FOR ALL USING (true);
CREATE TRIGGER handle_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- 2. CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);

-- =====================================================
-- 3. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    code TEXT,
    client_name TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT,
    type TEXT NOT NULL CHECK (type IN ('Entrée', 'Dépense')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on transactions" ON public.transactions FOR ALL USING (true);

-- =====================================================
-- 4. DEPARTURE LISTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.departure_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    destination TEXT NOT NULL,
    shipments JSONB NOT NULL DEFAULT '[]'::jsonb,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_driver_mad DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_driver_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_client_price DECIMAL(10,2),
    item_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VALIDATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.departure_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on departure_lists" ON public.departure_lists FOR ALL USING (true);
CREATE TRIGGER handle_departure_lists_updated_at BEFORE UPDATE ON public.departure_lists FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================