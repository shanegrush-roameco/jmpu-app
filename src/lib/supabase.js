import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mbwiaojxmaxsmoykdnww.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id2lhb2p4bWF4c21veWtkbnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTEyOTgsImV4cCI6MjA3OTkyNzI5OH0.Ieo5FHF06q0TN2t9KiElPPy3iZZopwBUkHXyVt91cYI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)