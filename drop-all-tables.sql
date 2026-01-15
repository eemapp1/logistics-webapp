-- =====================================================
-- DROP ALL TABLES (Use with caution!)
-- Run this first if you need to recreate all tables
-- =====================================================

-- Drop tables in reverse order (due to potential foreign keys)
DROP TABLE IF EXISTS public.departure_lists;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.shipments;
DROP TABLE IF EXISTS public.clients;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- =====================================================
-- TABLES DROPPED - You can now run create-all-tables.sql
-- =====================================================