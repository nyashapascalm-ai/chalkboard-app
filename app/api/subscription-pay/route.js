import { createClient } from '@supabase/supabase-js';
import { initiate } from '../../../lib/paynow';

export async function POST(req) {
  try {
    const { schoolId, origin } = await req.json();
    if (!schoolId) return Response.json({ error: 'school required' }, { status: 400 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: sub } = await admin.from('subscriptions').select('*').eq('school_id', schoolId).maybeSingle();
    if (!sub || !sub.amount) return Response.json({ error: 'No subscription amount set yet. Ask the platform admin.' }, { status: 400 });
    const id = process.env.PAYNOW_ID, key = process.env.PAYNOW_KEY, authemail = process.env.PAYNOW_AUTHEMAIL;
    if (!id || !key) return Response.json({ error: 'Online payment is not enabled yet. Please pay the platform admin directly.' }, { status: 400 });
    const reference = 'SUB-' + String(schoolId).slice(0, 8) + '-' + Date.now();
    const base = origin || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const p = await initiate({ id, key, authemail, reference, amount: sub.amount, returnurl: base + '/app?subpay=1', resulturl: base + '/api/subscription-pay/status', additionalinfo: 'Chalkboard subscription' });
    if ((p.status || '').toLowerCase() !== 'ok' || !p.browserurl) return Response.json({ error: p.error || 'Could not start payment.' }, { status: 400 });
    await admin.from('subscription_payments').insert({ school_id: schoolId, amount: sub.amount, method: 'paynow', status: 'pending', poll_url: p.pollurl, reference });
    return Response.json({ browserurl: p.browserurl });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
