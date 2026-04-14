import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hsgqhgtdcyypxrvmpxmx.supabase.co'
const supabaseAnonKey = 'sb_publishable_RGGrKuR9vSQMiELOpCSAMw_UNb58NSE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
