import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://synudoglvwbogfzbcdii.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bnVkb2dsdndib2dmemJjZGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTkyNzUsImV4cCI6MjA3NzQ5NTI3NX0.ByJGR6UiLV4vchudgN0FEt7C67xt8EGzrREiOMr1awI'
export const supabase = createClient(supabaseUrl, supabaseKey)