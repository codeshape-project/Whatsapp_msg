import { supabase } from '../db.js';
export async function requireAuth(req,res,next) {
  try {
    if (!supabase) return res.status(503).json({error:'Database is not configured.'});
    const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
    if (!token) return res.status(401).json({error:'Sign in to continue.'});
    const {data,error}=await supabase.auth.getUser(token);
    if(error || !data?.user) return res.status(401).json({error:'Your session is invalid or expired. Please sign in again.'});
    req.user=data.user;
    const orgId=String(req.headers['x-organization-id']||'');
    if(!orgId) return res.status(400).json({error:'Select an organization first.'});
    const isUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orgId);
    const {data:orgRow,error:orgError}=await supabase.from('organizations').select('id,slug').eq(isUuid?'id':'slug',orgId).maybeSingle();
    if(orgError) throw orgError;
    if(!orgRow) return res.status(404).json({error:'Organization not found.'});
    const {data:membership,error:memberError}=await supabase.from('organization_members').select('organization_id,role').eq('organization_id',orgRow.id).eq('user_id',req.user.id).maybeSingle();
    if(memberError) throw memberError;
    if(!membership) return res.status(403).json({error:'You do not have access to this organization.'});
    req.organizationId=orgRow.id; req.organizationSlug=orgRow.slug; req.membership=membership; next();
  } catch(e) { next(e); }
}
export function requireOwner(req,res,next){ if(!['owner','admin'].includes(req.membership?.role)) return res.status(403).json({error:'Organization admin permission is required.'}); next(); }
