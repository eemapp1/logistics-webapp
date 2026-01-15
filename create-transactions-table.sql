-- Create the transactions table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for development/demo purposes)
CREATE POLICY "Allow all operations on transactions" ON public.transactions
    FOR ALL USING (true);