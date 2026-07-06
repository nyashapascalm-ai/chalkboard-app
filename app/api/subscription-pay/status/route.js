import { createClient } from '@supabase/supabase-js';
import { pollStatus } from '../../../../lib/paynow';

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) { return Response.json({ ok: true }); }
  try {
    const { schoolId } = body;
    if (!schoolId) return Response.json({ status: 'none' });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: pend } = await admin.from('subscription_payments').select('*').eq('school_id', schoolId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!pend || !pend.poll_url) return Response.json({ status: 'none' });
    const r = await pollStatus(pend.poll_url);
    const st = (r.status || '').toLowerCase();
    if (st === 'paid' || st === 'awaiting delivery' || st === 'delivered') {
      const { data: sub } = await admin.from('subscriptions').select('*').eq('school_id', schoolId).maybeSingle();
      const base = (sub && sub.next_due) ? new Date(sub.next_due) : new Date();
      const nd = new Date(base); nd.setMonth(nd.getMonth() + 1);
      await admin.from('subscriptions').upsert({ school_id: schoolId, amount: sub ? sub.amount : pend.amount, next_due: nd.toISOString().slice(0, 10), last_paid: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }, { onConflict: 'school_id' });
      await admin.from('subscription_payments').update({ status: 'paid' }).eq('id', pend.id);
      return Response.json({ status: 'paid' });
    }
    return Response.json({ status: st || 'pending' });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
