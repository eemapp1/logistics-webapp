-- Create the shipments table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for development/demo purposes)
CREATE POLICY "Allow all operations on shipments" ON public.shipments
    FOR ALL USING (true);

-- Create updated_at trigger
CREATE TRIGGER handle_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();