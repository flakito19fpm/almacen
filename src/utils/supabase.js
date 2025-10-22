import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eolsplfcblddwzcdvwfx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvbHNwbGZjYmxkZHd6Y2R2d2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTQxMDAsImV4cCI6MjA3NjY5MDEwMH0.IfrfnWXdjqaSpB1i_Jr_tZ5BXWA8JM1Li3H6fZZo2R4';

export const supabase = createClient(supabaseUrl, supabaseKey);