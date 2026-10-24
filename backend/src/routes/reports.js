import { Router } from 'express';
import { supabase } from '../db.js';
const router=Router();
router.get('/',async(req,res,next)=>{try{const since=new Date();since.setDate(since.getDate()-179);const {data,error}=await supabase.from('messages').select('status,created_at,sent_at,delivered_at,read_at').eq('organization_id',req.organizationId).gte('created_at',since.toISOString()).order('created_at',{ascending:true}).limit(10000);if(error)throw error;const byDate=new Map();for(const m of data||[]){const d=(m.sent_at||m.created_at||'').slice(0,10);if(!d)continue;if(!byDate.has(d))byDate.set(d,{date:new Date(`${d}T00:00:00`).toLocaleDateString('en-IN'),sent:0,delivered:0,read:0,failed:0});const r=byDate.get(d);if(['sent','delivered','read','failed'].includes(m.status))r.sent++;if(['delivered','read'].includes(m.status))r.delivered++;if(m.status==='read')r.read++;if(m.status==='failed')r.failed++;}res.json({data:[...byDate.values()]});}catch(e){next(e)}});
export default router;
