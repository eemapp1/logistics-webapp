-- Create the clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for development/demo purposes)
CREATE POLICY "Allow all operations on clients" ON public.clients
    FOR ALL USING (true);