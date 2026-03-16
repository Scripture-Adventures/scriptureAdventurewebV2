import { createClient } from '@supabase/supabase-js';

// Use environment variables or exactly the provided constants from Flutter
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rpnwvaptbtpkislfxcbh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbnd2YXB0YnRwa2lzbGZ4Y2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTgyMTAsImV4cCI6MjA3NDI5NDIxMH0.hRFtf0RRdFor9LOK7vedNeYGZp1lU2Btr6kuEcc3zvs';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
