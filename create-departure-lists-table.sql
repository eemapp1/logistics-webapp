-- Create the departure_lists table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.departure_lists ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for development/demo purposes)
-- In production, you should implement proper authentication and restrict these policies
CREATE POLICY "Allow all operations on departure_lists" ON public.departure_lists
    FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_departure_lists_updated_at
    BEFORE UPDATE ON public.departure_lists
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();