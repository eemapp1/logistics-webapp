import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL ou Key manquante dans le fichier .env");
}

// Temporary logging for validation (remove after confirmation)
if (import.meta.env.DEV) {
  console.log('Supabase URL loaded:', !!supabaseUrl);
  console.log('Supabase Key loaded:', !!supabaseKey);
}

export const supabase = createClient(supabaseUrl, supabaseKey);