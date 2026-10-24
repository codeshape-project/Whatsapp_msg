import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
export const supabase = config.supabaseUrl && config.supabaseServiceKey
  ? createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
export function requireDb(req,res,next) { if (!supabase) return res.status(503).json({error:'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.'}); next(); }
