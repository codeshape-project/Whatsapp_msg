import { Router } from 'express';
import { config } from '../config.js';
import { supabase } from '../db.js';
const router=Router();
router.get('/whatsapp',(req,res)=>{const mode=req.query['hub.mode'];const token=req.query['hub.verify_token'];const challenge=req.query['hub.challenge'];if(mode==='subscribe'&&token&&token===config.metaVerifyToken)return res.status(200).send(challenge);return res.sendStatus(403);});
router.post('/whatsapp',async(req,res,next)=>{try{res.sendStatus(200);const entries=req.body?.entry||[];for(const entry of entries)for(const change of entry.changes||[]){const statuses=change.value?.statuses||[];for(const status of statuses){const id=status.id;const state=status.status;if(!id||!state)continue;const patch={status:state,updated_at:new Date().toISOString()};if(state==='delivered')patch.delivered_at=new Date((Number(status.timestamp)||Date.now()/1000)*1000).toISOString();if(state==='read')patch.read_at=new Date((Number(status.timestamp)||Date.now()/1000)*1000).toISOString();if(state==='failed')patch.last_error=JSON.stringify(status.errors||[]).slice(0,500);await supabase?.from('messages').update(patch).eq('meta_message_id',id);}}}catch(e){next(e)}});
export default router;
