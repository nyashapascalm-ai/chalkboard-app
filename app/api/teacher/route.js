import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const b = crypto.randomBytes(12); let p = '';
  for (let i = 0; i < 12; i++) p += chars[b[i] % chars.length];
  return p.slice(0, 4) + '-' + p.slice(4, 8) + '-' + p.slice(8, 12);
}

export async function POST(req) {
  try {
    const { schoolId, email, fullName, classIds } = await req.json();
    if (!email || !schoolId) return Response.json({ error: 'email and school are required' }, { status: 400 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const password = genPassword();
    const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (cErr) return Response.json({ error: cErr.message }, { status: 400 });
    const uid = created.user.id;
    const { error: pErr } = await admin.from('profiles').upsert({ id: uid, role: 'teacher', school_id: schoolId, full_name: fullName || null });
    if (pErr) return Response.json({ error: pErr.message }, { status: 400 });
    if (Array.isArray(classIds) && classIds.length) {
      const rows = classIds.map(cid => ({ school_id: schoolId, teacher_id: uid, class_id: cid }));
      await admin.from('teacher_classes').insert(rows);
    }
    return Response.json({ email, password });
  } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 500 }); }
}
