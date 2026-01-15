import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://miblxngrviebeiykzacr.supabase.co' // Remplace par ton URL
const SUPABASE_ANON_KEY = 'sb_publishable_d2KXbhYq6ULQi_13H-mkzw_JcLNoSiE' // Remplace par ta clé publique

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
