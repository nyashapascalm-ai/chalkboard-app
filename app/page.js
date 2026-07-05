'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function installApp() {
  const p = typeof window !== 'undefined' ? window.__cbPrompt : null;
  if (p) { p.prompt(); if (p.userChoice) p.userChoice.finally(() => { window.__cbPrompt = null; }); }
  else { alert('To install Chalkboard as an app: on desktop Chrome or Edge, click the install icon in the address bar. On iPhone (Safari): Share then Add to Home Screen. On Android: menu then Install app.'); }
}

function ChalkMark(size) {
  return (<svg width={size} height={size} viewBox="0 0 96 96"><defs><linearGradient id="cb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1e4a38"/><stop offset="1" stopColor="#2f7a52"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#cb)"/><path d="M28 49 L43 64 L69 33" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, sn) => { setSession(sn); if (e === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.querySelector('link[rel="manifest"]')) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json'; document.head.appendChild(l); }
    if (!document.querySelector('meta[name="theme-color"]')) { const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#2f7a52'; document.head.appendChild(m); }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) { const a = document.createElement('link'); a.rel = 'apple-touch-icon'; a.href = '/apple-touch-icon.png'; document.head.appendChild(a); }
    window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); window.__cbPrompt = ev; });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  if (checking) return <div className="center muted">Loading…</div>;
  if (recovery) return <SetNewPassword onDone={() => setRecovery(false)} />;
  return session ? <App session={session} /> : <Login />;
}

function SetNewPassword({ onDone }) {
  const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false);
  async function save(e) { e.preventDefault(); if (pw.length < 6) { setErr('Use at least 6 characters.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw }); if (error) setErr(error.message); else setOk(true); setBusy(false); }
  return (<div className="center"><div className="card" style={{ maxWidth: 400 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>{ChalkMark(42)}<div style={{ fontWeight: 800, fontSize: 21 }}>Set a new password</div></div>
    {ok ? (<><p className="muted">Password updated.</p><button style={{ width: '100%' }} onClick={onDone}>Continue</button></>) : (<form onSubmit={save}>
      <input type="password" placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} />
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Saving…' : 'Update password'}</button>
    </form>)}
    {err && <p className="error">{err}</p>}
  </div></div>);
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState('signin'); const [sent, setSent] = useState(false);
  async function signIn(e) { e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setErr(error.message); setBusy(false); }
  async function sendReset(e) { e.preventDefault(); if (!email.trim()) { setErr('Enter your email.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin }); if (error) setErr(error.message); else setSent(true); setBusy(false); }
  return (<div className="center"><div className="card" style={{ maxWidth: 400 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>{ChalkMark(42)}<div style={{ fontWeight: 800, fontSize: 24 }}>Chalkboard</div></div>
    <p className="muted" style={{ marginTop: 0 }}>Run your school — attendance, records and reports.</p>
    {mode === 'reset' ? (sent ? (<><p>Check your email for a reset link, then open it on this device to set a new password.</p><button className="ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setMode('signin'); setSent(false); }}>Back to sign in</button></>) : (<form onSubmit={sendReset}>
      <input placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <p className="muted" style={{ fontSize: 13, marginTop: 12, cursor: 'pointer' }} onClick={() => { setMode('signin'); setErr(''); }}>Back to sign in</p>
    </form>)) : (<><form onSubmit={signIn}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <div style={{ position: 'relative' }}>
        <input placeholder="Password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
        <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 4, top: 12, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 16, padding: 6 }}>{showPw ? '🙈' : '👁️'}</button>
      </div>
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="muted" style={{ fontSize: 13, marginTop: 12, cursor: 'pointer' }} onClick={() => { setMode('reset'); setErr(''); }}>Forgot password?</p></>)}
    {err && <p className="error">{err}</p>}
    <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>Use the login your operator created for you.</p>
  </div></div>);
}

function App({ session }) {
  const [role, setRole] = useState(undefined); const [schoolId, setSchoolId] = useState(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.from('profiles').select('role, school_id').eq('id', session.user.id).single();
    setRole(data?.role ?? null); setSchoolId(data?.school_id ?? null);
  })(); }, [session]);
  if (role === undefined) return <div className="center muted">Loading…</div>;
  if (role === 'operator') return <Console session={session} role="operator" canPick={true} initialSchool={null} />;
  if (role === 'school_admin' || role === 'teacher') return <Console session={session} role={role} canPick={false} initialSchool={schoolId} />;
  return (<div className="center"><div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>{ChalkMark(44)}</div>
    <h1 style={{ fontSize: 20 }}>No access yet</h1>
    <p className="muted">Your account isn't linked to a school yet. Ask the operator to set you up in ConnectHub.</p>
    <button className="ghost" onClick={() => supabase.auth.signOut()} style={{ marginTop: 12 }}>Sign out</button>
  </div></div>);
}

function Console({ session, role, canPick, initialSchool }) {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState(initialSchool);
  const [nav, setNav] = useState('dashboard');
  const [allClasses, setAllClasses] = useState([]);
  const [myIds, setMyIds] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [school, setSchool] = useState(null);
  const [settings, setSettings] = useState(null);
  const isTeacher = role === 'teacher';

  useEffect(() => { (async () => {
    if (canPick) { const { data } = await supabase.from('schools').select('id,name').order('name'); setSchools(data || []); if (!schoolId && data && data.length) setSchoolId(data[0].id); }
  })(); }, [canPick]);

  async function loadClasses() {
    if (!schoolId) { setAllClasses([]); return; }
    const { data } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name');
    setAllClasses(data || []);
  }
  async function loadMine() {
    if (!isTeacher || !schoolId) { setMyIds([]); return; }
    const { data } = await supabase.from('teacher_classes').select('class_id').eq('teacher_id', session.user.id).eq('school_id', schoolId);
    setMyIds((data || []).map(r => r.class_id));
  }
  async function loadSubjects() {
    if (!schoolId) { setSubjects([]); return; }
    const { data } = await supabase.from('subjects').select('*').eq('school_id', schoolId).order('name');
    setSubjects(data || []);
  }
  async function loadSchoolMeta() {
    if (!schoolId) { setSchool(null); setSettings(null); return; }
    const { data: sc } = await supabase.from('schools').select('id,name').eq('id', schoolId).single();
    setSchool(sc || null);
    const { data: ss } = await supabase.from('school_settings').select('*').eq('school_id', schoolId).maybeSingle();
    setSettings(ss || null);
  }
  useEffect(() => { loadClasses(); loadMine(); loadSubjects(); loadSchoolMeta(); }, [schoolId]);

  const available = isTeacher ? allClasses.filter(c => myIds.includes(c.id)) : allClasses;

  const items = [];
  items.push(['dashboard', 'Dashboard', '🏠']);
  items.push(['attendance', 'Attendance', '📋'], ['students', 'Students', '👤'], ['marks', 'Marks', '📝'], ['reportcards', 'Report cards', '📄'], ['reports', 'Attendance report', '📊'], ['announcements', 'Announcements', '📣']);
  if (!isTeacher) { items.push(['academics', 'Academics', '📈']); items.push(['fees', 'Fees', '💰']); items.push(['classes', 'Classes', '🏫']); items.push(['subjects', 'Subjects', '📚']); items.push(['teachers', 'Teachers', '👥']); items.push(['staff', 'Staff', '👔']); items.push(['admissions', 'Admissions', '🎓']); items.push(['timetable', 'Timetable', '📅']); items.push(['finance', 'Finance', '💵']); items.push(['banking', 'Banking', '🏦']); items.push(['inventory', 'Inventory', '📦']); items.push(['assets', 'Assets', '🏢']); items.push(['school', 'School', '⚙️']); }
  const sideItem = (id, label, icon) => (<button key={id} className={'side-item' + (nav === id ? ' active' : '')} onClick={() => setNav(id)}><span className="si">{icon}</span>{label}</button>);
  const title = { dashboard: 'Dashboard', academics: 'Academics', fees: 'Fees', announcements: 'Announcements', staff: 'Staff', admissions: 'Admissions', timetable: 'Timetable', attendance: 'Attendance', students: 'Students', classes: 'Classes', teachers: 'Teachers', reports: 'Attendance report', marks: 'Enter marks', reportcards: 'Report cards', subjects: 'Subjects', school: 'School letterhead', finance: 'Income & expenses', banking: 'Banking', inventory: 'Inventory', assets: 'Asset register' }[nav];

  return (<div className="shell">
    <aside className="sidebar">
      <div className="side-brand">{ChalkMark(28)}<span>Chalkboard</span></div>
      <nav className="side-nav">{items.map(it => sideItem(it[0], it[1], it[2]))}</nav>
      <div style={{ fontSize: 12, color: '#5b6570', padding: '8px 12px', wordBreak: 'break-all' }}>{session.user.email}{isTeacher ? ' · teacher' : ''}</div>
      <button className="side-item" onClick={installApp}><span className="si">⬇</span>Download app</button>
      <button className="side-item" onClick={() => supabase.auth.signOut()} style={{ color: '#c0392b' }}><span className="si">⏏</span>Sign out</button>
    </aside>
    <main className="main">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <h1>{title}</h1>
        {canPick && <select value={schoolId || ''} onChange={e => setSchoolId(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
      </div>
      {!schoolId ? <p className="muted">No school selected.</p> :
        nav === 'fees' ? <FeesPanel schoolId={schoolId} classes={allClasses} school={school} settings={settings} /> :
        nav === 'academics' ? <AcademicsPanel schoolId={schoolId} classes={allClasses} subjects={subjects} /> :
        nav === 'dashboard' ? (isTeacher ? <TeacherDashboardPanel schoolId={schoolId} classes={available} session={session} /> : <DashboardPanel schoolId={schoolId} school={school} />) :
        nav === 'announcements' ? <AnnouncementsPanel schoolId={schoolId} canPost={!isTeacher} /> :
        nav === 'staff' ? <StaffPanel schoolId={schoolId} /> :
        nav === 'admissions' ? <AdmissionsPanel schoolId={schoolId} classes={allClasses} /> :
        nav === 'timetable' ? <TimetablePanel schoolId={schoolId} classes={allClasses} subjects={subjects} school={school} settings={settings} /> :
        nav === 'banking' ? <BankingPanel schoolId={schoolId} /> :
        nav === 'finance' ? <FinancePanel schoolId={schoolId} /> :
        nav === 'inventory' ? <InventoryPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'assets' ? <AssetsPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'school' ? <SchoolSettingsPanel schoolId={schoolId} school={school} settings={settings} onChange={loadSchoolMeta} /> :
        nav === 'subjects' ? <SubjectsPanel schoolId={schoolId} subjects={subjects} onChange={loadSubjects} /> :
        nav === 'marks' ? <MarksPanel schoolId={schoolId} classes={available} subjects={subjects} teacherId={session.user.id} level={(settings && settings.level) || 'secondary'} /> :
        nav === 'reportcards' ? <ReportCardsPanel schoolId={schoolId} classes={available} subjects={subjects} school={school} settings={settings} level={(settings && settings.level) || 'secondary'} /> :
        nav === 'classes' ? <ClassesPanel schoolId={schoolId} classes={allClasses} onChange={loadClasses} /> :
        nav === 'teachers' ? <TeachersPanel schoolId={schoolId} classes={allClasses} /> :
        nav === 'reports' ? <ReportsPanel schoolId={schoolId} classes={available} school={school} settings={settings} /> :
        nav === 'students' ? <StudentsPanel schoolId={schoolId} classes={available} isTeacher={isTeacher} /> :
        <AttendancePanel schoolId={schoolId} classes={available} isTeacher={isTeacher} />}
    </main>
  </div>);
}

function ClassesPanel({ schoolId, classes, onChange }) {
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function add() { if (!name.trim()) return; setBusy(true); setErr('');
    const { error } = await supabase.from('classes').insert({ school_id: schoolId, name: name.trim() });
    if (error) setErr(error.message); else { setName(''); onChange(); } setBusy(false); }
  async function remove(id) { await supabase.from('classes').delete().eq('id', id); onChange(); }
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Set up your classes once. Teachers then pick the classes they teach, and students are added under each class.</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a class</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>Class name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Form 3A" /></div>
        <button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add class'}</button>
      </div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Class</th><th></th></tr></thead><tbody>
      {classes.map(c => (<tr key={c.id}><td className="strong">{c.name}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(c.id)}>Remove</button></td></tr>))}
      {classes.length === 0 && <tr><td colSpan="2" className="muted">No classes yet — add one above.</td></tr>}
    </tbody></table>
  </div>);
}

function chip(on) { return { padding: '6px 12px', borderRadius: 20, border: '1px solid ' + (on ? '#2f7a52' : '#dde1e6'), background: on ? '#2f7a52' : '#fff', color: on ? '#fff' : '#5b6570', cursor: 'pointer', fontWeight: 600, fontSize: 13 }; }

function TeachersPanel({ schoolId, classes }) {
  const [list, setList] = useState([]);
  const [links, setLinks] = useState([]);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [editId, setEditId] = useState(null); const [editPicked, setEditPicked] = useState([]);
  async function load() {
    const { data: t } = await supabase.from('profiles').select('id,full_name').eq('role', 'teacher').eq('school_id', schoolId);
    setList(t || []);
    const { data: l } = await supabase.from('teacher_classes').select('teacher_id,class_id').eq('school_id', schoolId);
    setLinks(l || []);
  }
  useEffect(() => { load(); }, [schoolId]);
  const clsName = id => { const c = classes.find(x => x.id === id); return c ? c.name : '?'; };
  const teacherClassIds = tid => links.filter(l => l.teacher_id === tid).map(l => l.class_id);
  function toggleNew(id) { setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleEdit(id) { setEditPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  async function create() {
    if (!email.trim()) { setErr('Enter an email.'); return; }
    setBusy(true); setErr(''); setResult(null);
    try {
      const res = await fetch('/api/teacher', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, email: email.trim(), fullName: name.trim(), classIds: picked }) });
      const data = await res.json();
      if (!res.ok) setErr(data.error || 'Could not create teacher.'); else { setResult(data); setName(''); setEmail(''); setPicked([]); await load(); }
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  }
  function startEdit(t) { setEditId(t.id); setEditPicked(teacherClassIds(t.id)); }
  async function saveEdit() {
    const current = teacherClassIds(editId);
    const toAdd = editPicked.filter(id => !current.includes(id));
    const toRemove = current.filter(id => !editPicked.includes(id));
    for (const cid of toRemove) { await supabase.from('teacher_classes').delete().eq('teacher_id', editId).eq('class_id', cid); }
    if (toAdd.length) { await supabase.from('teacher_classes').insert(toAdd.map(cid => ({ school_id: schoolId, teacher_id: editId, class_id: cid }))); }
    setEditId(null); await load();
  }
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Create a login for each teacher and tick the classes they teach. You can change a teacher's classes anytime.</p>
    {result && (<div className="card" style={{ marginBottom: 18, borderColor: '#1a7f5a' }}>
      <div style={{ fontWeight: 700, color: '#1a7f5a' }}>Teacher login created</div>
      <p className="muted" style={{ marginTop: 4, marginBottom: 10 }}>Send these to the teacher. The password is shown once.</p>
      <div><b>Email:</b> {result.email}</div>
      <div style={{ marginTop: 4 }}><b>Password:</b> <span style={{ fontFamily: 'monospace', background: '#f3f5f7', padding: '2px 8px', borderRadius: 6 }}>{result.password}</span></div>
    </div>)}
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a teacher</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <div><label style={labelStyle}>Full name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mr. Ncube" /></div>
        <div><label style={labelStyle}>Email</label><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@school.co.zw" /></div>
      </div>
      <label style={{ ...labelStyle, marginTop: 12 }}>Classes they teach</label>
      {classes.length === 0 ? <p className="muted">Add classes first in the Classes tab.</p> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {classes.map(c => { const on = picked.includes(c.id); return (<button key={c.id} type="button" onClick={() => toggleNew(c.id)} style={chip(on)}>{c.name}</button>); })}
        </div>)}
      <div style={{ marginTop: 14 }}><button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create teacher login'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Teacher</th><th>Classes</th><th></th></tr></thead><tbody>
      {list.map(t => (<tr key={t.id}><td className="strong">{t.full_name || '(no name)'}</td>
        <td>{editId === t.id ? (<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{classes.map(c => { const on = editPicked.includes(c.id); return (<button key={c.id} type="button" onClick={() => toggleEdit(c.id)} style={chip(on)}>{c.name}</button>); })}</div>) : (teacherClassIds(t.id).map(clsName).join(', ') || <span className="muted">none</span>)}</td>
        <td className="r">{editId === t.id ? (<><button onClick={saveEdit} style={{ padding: '4px 10px', fontSize: 13 }}>Save</button> <button className="ghost" onClick={() => setEditId(null)} style={{ padding: '4px 10px', fontSize: 13, marginLeft: 6 }}>Cancel</button></>) : <button className="ghost" onClick={() => startEdit(t)} style={{ padding: '4px 10px', fontSize: 13 }}>Edit classes</button>}</td>
      </tr>))}
      {list.length === 0 && <tr><td colSpan="3" className="muted">No teachers yet.</td></tr>}
    </tbody></table>
  </div>);
}

function StudentsPanel({ schoolId, classes, isTeacher }) {
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState([]);
  const [name, setName] = useState(''); const [bulk, setBulk] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  const clsName = id => { const c = classes.find(x => x.id === id); return c ? c.name : null; };
  async function load() { if (!classId) { setRows([]); return; } const { data } = await supabase.from('students').select('*').eq('school_id', schoolId).eq('class_id', classId).order('full_name'); setRows(data || []); }
  useEffect(() => { load(); }, [classId, schoolId]);
  async function add() { if (!name.trim()) return; if (!classId) { setErr('Pick a class.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('students').insert({ school_id: schoolId, full_name: name.trim(), class_id: classId, klass: clsName(classId) });
    if (error) setErr(error.message); else { setName(''); await load(); } setBusy(false); }
  async function addBulk() {
    const names = bulk.split('\n').map(x => x.trim()).filter(Boolean);
    if (!names.length) return;
    if (!classId) { setErr('Pick a class.'); return; }
    setBusy(true); setErr('');
    const list = names.map(n => ({ school_id: schoolId, full_name: n, class_id: classId, klass: clsName(classId) }));
    const { error } = await supabase.from('students').insert(list);
    if (error) setErr(error.message); else { setBulk(''); await load(); }
    setBusy(false);
  }
  if (classes.length === 0) return <p className="muted">{isTeacher ? 'You have no classes yet.' : 'No classes yet — add them in the Classes tab first.'}</p>;
  if (editing) return <StudentRecord student={editing} classes={classes} clsName={clsName} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
  return (<div>
    <div style={{ marginBottom: 14, maxWidth: 300 }}>
      <label style={labelStyle}>Class</label>
      <select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a student to {clsName(classId)}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>Full name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tadiwa Moyo" /></div>
        <button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
      </div>
      {err && <p className="error">{err}</p>}
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Add the name here, then Open the student to fill in their full record.</p>
    </div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Bulk add to {clsName(classId)}</div>
      <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>Paste one name per line, then Add all.</p>
      <textarea style={{ ...inputStyle, minHeight: 120, fontFamily: 'inherit' }} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'Tadiwa Moyo\nRutendo Sibanda\nTanaka Ncube'} />
      <div style={{ marginTop: 10 }}><button onClick={addBulk} disabled={busy}>{busy ? 'Adding…' : 'Add all (' + bulk.split('\n').map(x => x.trim()).filter(Boolean).length + ')'}</button></div>
    </div>
    <table><thead><tr><th>Name</th><th>Guardian</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td className="strong">{r.full_name}</td><td className="muted">{r.guardian_name || '—'}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setEditing(r)}>Open</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="3" className="muted">No students in this class yet.</td></tr>}
    </tbody></table>
  </div>);
}

function StudentRecord({ student, classes, clsName, onBack, onSaved }) {
  const [f, setF] = useState({ full_name: student.full_name || '', class_id: student.class_id || '', gender: student.gender || '', dob: student.dob || '', guardian_name: student.guardian_name || '', guardian_phone: student.guardian_phone || '', address: student.address || '', notes: student.notes || '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [saved, setSaved] = useState(false);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function save() {
    if (!f.full_name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr(''); setSaved(false);
    const patch = { full_name: f.full_name.trim(), class_id: f.class_id || null, klass: clsName(f.class_id) || null, gender: f.gender || null, dob: f.dob || null, guardian_name: f.guardian_name || null, guardian_phone: f.guardian_phone || null, address: f.address || null, notes: f.notes || null };
    const { error } = await supabase.from('students').update(patch).eq('id', student.id);
    if (error) setErr(error.message); else { setSaved(true); setTimeout(onSaved, 600); }
    setBusy(false);
  }
  async function remove() { if (!confirm('Remove this student?')) return; await supabase.from('students').delete().eq('id', student.id); onSaved(); }
  return (<div>
    <button className="ghost" onClick={onBack} style={{ marginBottom: 14, padding: '5px 12px', fontSize: 13 }}>← Back to list</button>
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 18 }}>{student.full_name}</div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div><label style={labelStyle}>Full name</label><input style={inputStyle} value={f.full_name} onChange={e => set('full_name', e.target.value)} /></div>
        <div><label style={labelStyle}>Class</label><select style={inputStyle} value={f.class_id} onChange={e => set('class_id', e.target.value)}><option value="">— none —</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={f.gender} onChange={e => set('gender', e.target.value)}><option value="">—</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
        <div><label style={labelStyle}>Date of birth</label><input type="date" style={inputStyle} value={f.dob} onChange={e => set('dob', e.target.value)} /></div>
        <div><label style={labelStyle}>Guardian name</label><input style={inputStyle} value={f.guardian_name} onChange={e => set('guardian_name', e.target.value)} placeholder="e.g. Mrs. Moyo" /></div>
        <div><label style={labelStyle}>Guardian phone</label><input style={inputStyle} value={f.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} placeholder="0771234567" /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={labelStyle}>Address</label><input style={inputStyle} value={f.address} onChange={e => set('address', e.target.value)} /></div>
      <div style={{ marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={f.notes} onChange={e => set('notes', e.target.value)} /></div>
      {err && <p className="error">{err}</p>}
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={busy}>{busy ? 'Saving…' : (saved ? 'Saved ✓' : 'Save record')}</button>
        <button className="ghost" onClick={remove} style={{ color: '#c0392b' }}>Remove student</button>
      </div>
    </div>
  </div>);
}

function AttendancePanel({ schoolId, classes, isTeacher }) {
  const today = new Date().toISOString().slice(0, 10);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function load() {
    if (!classId) { setStudents([]); setMarks({}); return; }
    const { data: st } = await supabase.from('students').select('*').eq('school_id', schoolId).eq('class_id', classId).order('full_name');
    setStudents(st || []);
    const ids = (st || []).map(s => s.id);
    let at = [];
    if (ids.length) { const r = await supabase.from('attendance').select('student_id,status').eq('date', date).in('student_id', ids); at = r.data || []; }
    const m = {}; (st || []).forEach(s => { m[s.id] = 'present'; }); at.forEach(a => { m[a.student_id] = a.status; });
    setMarks(m);
  }
  useEffect(() => { load(); }, [classId, date, schoolId]);
  function setMark(id, status) { setMarks(m => ({ ...m, [id]: status })); }
  async function save() {
    setBusy(true); setErr(''); setSaved(false);
    const rows = students.map(s => ({ school_id: schoolId, student_id: s.id, date, status: marks[s.id] || 'present' }));
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' });
    if (error) setErr(error.message); else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setBusy(false);
  }
  const counts = students.reduce((a, s) => { const st = marks[s.id] || 'present'; a[st] = (a[st] || 0) + 1; return a; }, {});
  const colors = { present: '#1a7f5a', absent: '#c0392b', late: '#b8860b' };
  if (classes.length === 0) return <p className="muted">{isTeacher ? 'You have no classes yet — add them in My classes first.' : 'No classes yet — add them in the Classes tab first.'}</p>;
  return (<div>
    <div style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 220 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label style={labelStyle}>Date</label><input type="date" style={{ ...inputStyle, width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} /></div>
      <div className="muted" style={{ fontSize: 14, paddingBottom: 8 }}>Present {counts.present || 0} · Absent {counts.absent || 0} · Late {counts.late || 0}</div>
    </div>
    {students.length === 0 ? <p className="muted">No students in this class yet. Add students in the Students tab.</p> : (<>
      <table><thead><tr><th>Student</th><th className="r">Mark</th></tr></thead><tbody>
        {students.map(s => (<tr key={s.id}><td className="strong">{s.full_name}</td><td className="r">
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {['present', 'absent', 'late'].map(st => { const on = (marks[s.id] || 'present') === st; return (<button key={st} onClick={() => setMark(s.id, st)} style={{ padding: '5px 12px', fontSize: 13, borderRadius: 6, border: '1px solid ' + (on ? colors[st] : '#dde1e6'), background: on ? colors[st] : '#fff', color: on ? '#fff' : '#5b6570', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>{st}</button>); })}
          </div>
        </td></tr>))}
      </tbody></table>
      <div style={{ marginTop: 18 }}><button onClick={save} disabled={busy}>{busy ? 'Saving…' : (saved ? 'Saved ✓' : 'Save attendance')}</button>{err && <p className="error">{err}</p>}</div>
    </>)}
  </div>);
}

function esc(v) { return String(v == null ? '' : v).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }); }

function letterheadHtml(school, settings) {
  const color = (settings && settings.color) || '#2f7a52';
  const logo = settings && settings.logo ? '<img src="' + settings.logo + '" style="height:54px;width:auto;margin-right:14px">' : '';
  const name = esc(school ? school.name : '');
  const lines = [];
  if (settings && settings.address) lines.push(esc(settings.address));
  const contact = [settings && settings.phone, settings && settings.email].filter(Boolean).map(esc).join(' · ');
  if (contact) lines.push(contact);
  return '<div style="border-bottom:4px solid ' + color + ';padding-bottom:12px;margin-bottom:14px;display:flex;align-items:center">' + logo + '<div><div style="font-size:22px;font-weight:800;color:' + color + '">' + name + '</div><div style="font-size:12px;color:#555">' + lines.join('<br>') + '</div></div></div>';
}

function ReportsPanel({ schoolId, classes, school, settings }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const [classId, setClassId] = useState('');
  const [from, setFrom] = useState(monthAgo); const [to, setTo] = useState(today);
  const [students, setStudents] = useState([]); const [att, setAtt] = useState([]); const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function load() {
    if (!classId) { setStudents([]); setAtt([]); return; }
    setLoading(true);
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name');
    setStudents(st || []);
    const ids = (st || []).map(s => s.id);
    let a = [];
    if (ids.length) { const r = await supabase.from('attendance').select('student_id,status,date').in('student_id', ids).gte('date', from).lte('date', to); a = r.data || []; }
    setAtt(a); setLoading(false);
  }
  useEffect(() => { load(); }, [classId, from, to, schoolId]);
  const per = {}; students.forEach(s => { per[s.id] = { present: 0, absent: 0, late: 0 }; });
  att.forEach(r => { if (per[r.student_id] && per[r.student_id][r.status] !== undefined) per[r.student_id][r.status]++; });
  const dates = [...new Set(att.map(r => r.date))];
  const totals = students.reduce((a, s) => { const c = per[s.id]; a.present += c.present; a.absent += c.absent; a.late += c.late; return a; }, { present: 0, absent: 0, late: 0 });
  const pct = c => { const t = c.present + c.absent + c.late; return t ? Math.round(c.present / t * 100) : 0; };
  const colors = { present: '#1a7f5a', absent: '#c0392b', late: '#b8860b' };
  const cname = (classes.find(c => c.id === classId) || {}).name || '';
  function printReport() {
    const rows = students.map(s => { const c = per[s.id]; return '<tr><td>' + esc(s.full_name) + '</td><td class=r>' + c.present + '</td><td class=r>' + c.absent + '</td><td class=r>' + c.late + '</td><td class=r>' + pct(c) + '%</td></tr>'; }).join('');
    const html = '<html><head><title>Attendance report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}th,td{border-bottom:1px solid #ccc;padding:8px;text-align:left}.r{text-align:right}.m{color:#666;font-size:13px}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 4px">Attendance report — ' + esc(cname) + '</h3><div class=m>' + from + ' to ' + to + ' · ' + dates.length + ' day(s)</div><table><thead><tr><th>Student</th><th class=r>Present</th><th class=r>Absent</th><th class=r>Late</th><th class=r>% present</th></tr></thead><tbody>' + rows + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the report.'); return; }
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  if (classes.length === 0) return <p className="muted">No classes available yet.</p>;
  const openStudent = students.find(x => x.id === openId);
  return (<div>
    <div style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 14, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 200 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => { setClassId(e.target.value); setOpenId(null); }}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label style={labelStyle}>From</label><input type="date" style={{ ...inputStyle, width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} /></div>
      <div><label style={labelStyle}>To</label><input type="date" style={{ ...inputStyle, width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} /></div>
      <button className="ghost" onClick={printReport} style={{ marginBottom: 6 }}>Print</button>
    </div>
    <div className="muted" style={{ marginBottom: 12, fontSize: 14 }}>{dates.length} day(s) recorded · Class totals: Present {totals.present} · Absent {totals.absent} · Late {totals.late}</div>
    {loading ? <p className="muted">Loading…</p> : (
      <table><thead><tr><th>Student</th><th className="r">Present</th><th className="r">Absent</th><th className="r">Late</th><th className="r">% present</th></tr></thead><tbody>
        {students.map(s => { const c = per[s.id]; const pp = pct(c); return (<tr key={s.id} onClick={() => setOpenId(openId === s.id ? null : s.id)} style={{ cursor: 'pointer', background: openId === s.id ? '#eafaf3' : 'transparent' }}><td className="strong">{s.full_name}</td><td className="r">{c.present}</td><td className="r">{c.absent}</td><td className="r">{c.late}</td><td className="r" style={{ color: pp >= 90 ? '#1a7f5a' : pp >= 75 ? '#b8860b' : '#c0392b', fontWeight: 600 }}>{pp}%</td></tr>); })}
        {students.length === 0 && <tr><td colSpan="5" className="muted">No students in this class.</td></tr>}
      </tbody></table>)}
    {openStudent && (<div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{openStudent.full_name} — daily record</div>
      {(() => { const recs = att.filter(r => r.student_id === openId).sort((a, b) => a.date < b.date ? -1 : 1); return recs.length === 0 ? <p className="muted">No marks in this range.</p> : (<table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>{recs.map((r, i) => (<tr key={i}><td>{r.date}</td><td style={{ textTransform: 'capitalize', color: colors[r.status], fontWeight: 600 }}>{r.status}</td></tr>))}</tbody></table>); })()}
    </div>)}
  </div>);
}

const termOptions = (() => { const y = new Date().getFullYear(); const o = []; [y, y - 1].forEach(yy => [1, 2, 3].forEach(t => o.push('Term ' + t + ' ' + yy))); return o; })();
function gradeFor(score, level) { if (score === '' || score == null) return ''; const n = Number(score); if (isNaN(n)) return ''; if (level === 'primary') { if (n >= 90) return '1'; if (n >= 80) return '2'; if (n >= 70) return '3'; if (n >= 60) return '4'; if (n >= 50) return '5'; if (n >= 40) return '6'; if (n >= 30) return '7'; if (n >= 20) return '8'; return '9'; } if (n >= 75) return 'A'; if (n >= 65) return 'B'; if (n >= 50) return 'C'; if (n >= 40) return 'D'; if (n >= 30) return 'E'; return 'F'; }

function SubjectsPanel({ schoolId, subjects, onChange }) {
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function add() { if (!name.trim()) return; setBusy(true); setErr('');
    const { error } = await supabase.from('subjects').insert({ school_id: schoolId, name: name.trim() });
    if (error) setErr(error.message); else { setName(''); onChange(); } setBusy(false); }
  async function remove(id) { await supabase.from('subjects').delete().eq('id', id); onChange(); }
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Set up the subjects taught at your school. Teachers enter marks against these.</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a subject</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}><div style={{ flex: 1 }}><label style={labelStyle}>Subject name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" /></div><button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add subject'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Subject</th><th></th></tr></thead><tbody>
      {subjects.map(s => (<tr key={s.id}><td className="strong">{s.name}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(s.id)}>Remove</button></td></tr>))}
      {subjects.length === 0 && <tr><td colSpan="2" className="muted">No subjects yet — add one above.</td></tr>}
    </tbody></table>
  </div>);
}

function MarksPanel({ schoolId, classes, subjects, teacherId, level }) {
  const [classId, setClassId] = useState(''); const [subjectId, setSubjectId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  const [students, setStudents] = useState([]); const [rowData, setRowData] = useState({});
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  useEffect(() => { if (!subjectId && subjects.length) setSubjectId(subjects[0].id); }, [subjects]);
  async function load() {
    if (!classId) { setStudents([]); return; }
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name');
    setStudents(st || []);
    const ids = (st || []).map(s => s.id); let existing = [];
    if (ids.length && subjectId) { const r = await supabase.from('marks').select('student_id,score,comment').eq('subject_id', subjectId).eq('term', term).in('student_id', ids); existing = r.data || []; }
    const d = {}; (st || []).forEach(s => { d[s.id] = { score: '', comment: '' }; }); existing.forEach(m => { d[m.student_id] = { score: m.score == null ? '' : m.score, comment: m.comment || '' }; }); setRowData(d);
  }
  useEffect(() => { load(); }, [classId, subjectId, term, schoolId]);
  function setField(id, k, v) { setRowData(d => ({ ...d, [id]: { ...d[id], [k]: v } })); }
  async function save() {
    if (!subjectId) { setErr('Pick a subject.'); return; }
    setBusy(true); setErr(''); setSaved(false);
    const rows = students.filter(s => rowData[s.id] && rowData[s.id].score !== '').map(s => ({ school_id: schoolId, student_id: s.id, subject_id: subjectId, term, score: Number(rowData[s.id].score), grade: gradeFor(rowData[s.id].score, level), comment: rowData[s.id].comment || null, teacher_id: teacherId || null }));
    if (rows.length === 0) { setErr('Enter at least one mark.'); setBusy(false); return; }
    const { error } = await supabase.from('marks').upsert(rows, { onConflict: 'student_id,subject_id,term' });
    if (error) setErr(error.message); else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setBusy(false);
  }
  if (classes.length === 0) return <p className="muted">No classes available yet.</p>;
  if (subjects.length === 0) return <p className="muted">No subjects yet — an admin adds them in the Subjects tab.</p>;
  return (<div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div style={{ minWidth: 170 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ minWidth: 170 }}><label style={labelStyle}>Subject</label><select style={inputStyle} value={subjectId} onChange={e => setSubjectId(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
    </div>
    {students.length === 0 ? <p className="muted">No students in this class.</p> : (<>
      <table><thead><tr><th>Student</th><th style={{ width: 90 }}>Mark</th><th style={{ width: 60 }}>{level === 'primary' ? 'Units' : 'Grade'}</th><th>Comment</th></tr></thead><tbody>
        {students.map(s => { const row = rowData[s.id] || { score: '', comment: '' }; const g = gradeFor(row.score, level); return (<tr key={s.id}><td className="strong">{s.full_name}</td>
          <td><input style={{ ...inputStyle, width: 70, margin: 0 }} value={row.score} onChange={e => setField(s.id, 'score', e.target.value)} placeholder="0-100" /></td>
          <td style={{ fontWeight: 700, color: g === 'A' ? '#1a7f5a' : g === 'E' ? '#c0392b' : '#1f2328' }}>{g || '—'}</td>
          <td><input style={{ ...inputStyle, margin: 0 }} value={row.comment} onChange={e => setField(s.id, 'comment', e.target.value)} placeholder="optional" /></td>
        </tr>); })}
      </tbody></table>
      <div style={{ marginTop: 16 }}><button onClick={save} disabled={busy}>{busy ? 'Saving…' : (saved ? 'Saved ✓' : 'Save marks')}</button>{err && <p className="error">{err}</p>}</div>
    </>)}
  </div>);
}

function ReportCardsPanel({ schoolId, classes, subjects, school, settings, level }) {
  const [classId, setClassId] = useState(''); const [studentId, setStudentId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  const [rtype, setRtype] = useState('full');
  const [students, setStudents] = useState([]); const [allMarks, setAllMarks] = useState([]); const [studentMarksAll, setStudentMarksAll] = useState([]);
  const [att, setAtt] = useState({ attended: 0, total: 0 });
  const [meta, setMeta] = useState({ general_comment: '', head_comment: '', next_term: '', handwriting: '', homework: '', conduct: '' });
  const [savedMeta, setSavedMeta] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function loadStudents() { if (!classId) { setStudents([]); return; } const { data } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name'); setStudents(data || []); setStudentId((data && data.length) ? data[0].id : ''); }
  useEffect(() => { loadStudents(); }, [classId]);
  async function loadMarks() { const ids = students.map(s => s.id); if (!ids.length) { setAllMarks([]); return; } const { data } = await supabase.from('marks').select('student_id,subject_id,score,grade,comment').eq('term', term).in('student_id', ids); setAllMarks(data || []); }
  useEffect(() => { loadMarks(); }, [students, term]);
  async function loadStudentAll() { if (!studentId) { setStudentMarksAll([]); return; } const { data } = await supabase.from('marks').select('subject_id,score,term').eq('student_id', studentId); setStudentMarksAll(data || []); }
  useEffect(() => { loadStudentAll(); }, [studentId]);
  async function loadAttendance() { if (!studentId) { setAtt({ attended: 0, total: 0 }); return; } const { data } = await supabase.from('attendance').select('status').eq('student_id', studentId); const total = (data || []).length; const attended = (data || []).filter(r => r.status === 'present' || r.status === 'late').length; setAtt({ attended, total }); }
  useEffect(() => { loadAttendance(); }, [studentId]);
  async function loadMeta() { if (!studentId) { setMeta({ general_comment: '', head_comment: '', next_term: '', handwriting: '', homework: '', conduct: '' }); return; } const { data } = await supabase.from('report_meta').select('*').eq('student_id', studentId).eq('term', term).maybeSingle(); setMeta({ general_comment: (data && data.general_comment) || '', head_comment: (data && data.head_comment) || '', next_term: (data && data.next_term) || '', handwriting: (data && data.handwriting) || '', homework: (data && data.homework) || '', conduct: (data && data.conduct) || '' }); }
  useEffect(() => { loadMeta(); }, [studentId, term]);
  async function saveMeta() { setBusy(true); setSavedMeta(false); await supabase.from('report_meta').upsert({ school_id: schoolId, student_id: studentId, term, general_comment: meta.general_comment || null, head_comment: meta.head_comment || null, next_term: meta.next_term || null, handwriting: meta.handwriting || null, homework: meta.homework || null, conduct: meta.conduct || null }, { onConflict: 'student_id,term' }); setSavedMeta(true); setTimeout(() => setSavedMeta(false), 2000); setBusy(false); }
  const subjName = id => { const s = subjects.find(x => x.id === id); return s ? s.name : '?'; };
  const byStudent = {}; allMarks.forEach(m => { (byStudent[m.student_id] = byStudent[m.student_id] || []).push(m); });
  const avgOf = sid => { const ms = byStudent[sid] || []; if (!ms.length) return null; return ms.reduce((a, m) => a + Number(m.score || 0), 0) / ms.length; };
  const ranked = students.map(s => ({ id: s.id, avg: avgOf(s.id) })).filter(x => x.avg != null).sort((a, b) => b.avg - a.avg);
  const outOf = ranked.length;
  const position = (() => { const i = ranked.findIndex(x => x.id === studentId); return i >= 0 ? i + 1 : null; })();
  const student = students.find(s => s.id === studentId);
  const rows = (byStudent[studentId] || []).map(m => ({ name: subjName(m.subject_id), score: m.score, grade: gradeFor(m.score, level), comment: m.comment }));
  const avg = position != null ? Math.round(avgOf(studentId)) : (rows.length ? Math.round(rows.reduce((a, r) => a + Number(r.score || 0), 0) / rows.length) : 0);
  const cname = (classes.find(c => c.id === classId) || {}).name || '';
  const yr = (term.match(/\d{4}/) || [''])[0];
  function sigBlock() { return '<table style="margin-top:22px;width:100%"><tr>' + '<td style="border:0;padding-top:30px">Teacher’s signature: ______________</td>' + '<td style="border:0;padding-top:30px">Head’s signature: ______________</td>' + '<td style="border:0;padding-top:30px">Parent’s signature: ______________</td></tr></table>'; }
  function stampBox() { return '<div style="margin-top:18px"><div style="font-size:11px;color:#666">School stamp</div><div style="width:150px;height:90px;border:1px solid #999;border-radius:6px;margin-top:4px"></div></div>'; }
  function footerHtml(note) { return '<div style="margin-top:22px;font-size:10px;color:#555;text-align:center">' + esc(note) + '</div><div style="text-align:center;font-weight:700;margin-top:4px">' + esc(school ? school.name : '') + '</div>'; }
  function openPrint(html) { const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350); }
  const NOTE = 'NB: This report is issued without erasure/alteration and it should be returned with parent/guardian’s signature.';
  function printFull() {
    const totMark = rows.reduce((a, r) => a + Number(r.score || 0), 0); const totOut = rows.length * 100; const totUnits = rows.reduce((a, r) => a + (Number(r.grade) || 0), 0); const gradeLabel = level === 'primary' ? 'Units' : 'Grade';
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td class=r>' + (r.score == null ? '' : r.score) + '</td><td class=r>100</td><td class=c>' + esc(r.grade || '') + '</td><td>' + esc(r.comment || '') + '</td></tr>').join('');
    const conductTable = '<table style="margin-top:10px"><tbody>' + '<tr><td style="width:150px"><b>Handwriting</b></td><td>' + esc(meta.handwriting || '') + '</td></tr>' + '<tr><td><b>Homework</b></td><td>' + esc(meta.homework || '') + '</td></tr>' + '<tr><td><b>Conduct</b></td><td>' + esc(meta.conduct || '') + '</td></tr>' + '</tbody></table>';
    const html = '<html><head><title>Report card</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}.c{text-align:center}.hd td{border:0;padding:2px 0}.gc{margin-top:12px}.lbl{font-size:12px;color:#555}</style></head><body>' + letterheadHtml(school, settings) + '<table class=hd><tr><td>Name: <b>' + esc(student ? student.full_name : '') + '</b></td><td>Grade: <b>' + esc(cname) + '</b></td><td>Term: <b>' + esc(term) + '</b></td></tr><tr><td>Class average: <b>' + avg + '%</b></td><td>Position in class: <b>' + (position != null ? position + ' out of ' + outOf : '—') + '</b></td><td>Attendance: <b>' + att.attended + ' out of ' + att.total + '</b></td></tr></table>' + '<table style="margin-top:10px"><thead><tr><th>Learning Area</th><th class=r>Pupil’s Mark</th><th class=r>Out of</th><th class=c>' + gradeLabel + '</th><th>Comment</th></tr></thead><tbody>' + body + '<tr><td><b>TOTAL</b></td><td class=r><b>' + totMark + '</b></td><td class=r><b>' + totOut + '</b></td><td class=c><b>' + (level === 'primary' ? totUnits : '') + '</b></td><td></td></tr></tbody></table>' + conductTable + '<div class=gc><span class=lbl>General comments:</span><br>' + esc(meta.general_comment || '') + '</div>' + '<div class=gc><span class=lbl>Head’s comments:</span><br>' + esc(meta.head_comment || '') + '</div>' + '<div class=gc><span class=lbl>Next term begins:</span> ' + esc(meta.next_term || '______________') + '</div>' + sigBlock() + stampBox() + footerHtml(NOTE) + '</body></html>';
    openPrint(html);
  }
  function printMid() {
    const terms = [...new Set(studentMarksAll.map(m => m.term))]; terms.sort((a, b) => termOptions.indexOf(a) - termOptions.indexOf(b));
    const scoreFor = (sid, t) => { const m = studentMarksAll.find(x => x.subject_id === sid && x.term === t); return m ? (m.score == null ? '' : m.score) : ''; };
    const head = '<tr><th>Subject</th>' + terms.map(t => '<th class=c>' + esc(t) + '</th>').join('') + '</tr>';
    const rowsHtml = subjects.map(su => '<tr><td>' + esc(su.name) + '</td>' + terms.map(t => '<td class=c>' + scoreFor(su.id, t) + '</td>').join('') + '</tr>').join('');
    const html = '<html><head><title>Mid-term report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.c{text-align:center}.hd td{border:0;padding:2px 0}.lbl{font-size:12px;color:#555}</style></head><body>' + letterheadHtml(school, settings) + '<table class=hd><tr><td>Name: <b>' + esc(student ? student.full_name : '') + '</b></td><td>Grade: <b>' + esc(cname) + '</b></td><td>Year: <b>' + esc(yr) + '</b></td></tr></table>' + '<table style="margin-top:10px"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table>' + '<div style="margin-top:12px" class=lbl>General comments:</div><div>' + esc(meta.general_comment || '') + '</div>' + sigBlock() + stampBox() + footerHtml(NOTE) + '</body></html>';
    openPrint(html);
  }
  if (classes.length === 0) return <p className="muted">No classes available yet.</p>;
  return (<div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14, alignItems: 'end' }}>
      <div style={{ minWidth: 160 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ minWidth: 190 }}><label style={labelStyle}>Student</label><select style={inputStyle} value={studentId} onChange={e => setStudentId(e.target.value)}>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></div>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div style={{ minWidth: 160 }}><label style={labelStyle}>Report type</label><select style={inputStyle} value={rtype} onChange={e => setRtype(e.target.value)}><option value="full">Full term report</option><option value="mid">Mid-term report</option></select></div>
    </div>
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Comments (printed on the report)</div>
      <label style={labelStyle}>General comment (teacher)</label>
      <textarea style={{ ...inputStyle, minHeight: 52, fontFamily: 'inherit' }} value={meta.general_comment} onChange={e => setMeta(m => ({ ...m, general_comment: e.target.value }))} placeholder="e.g. Continue working hard." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
        <div><label style={labelStyle}>Handwriting</label><input style={inputStyle} value={meta.handwriting} onChange={e => setMeta(m => ({ ...m, handwriting: e.target.value }))} placeholder="e.g. Improving" /></div>
        <div><label style={labelStyle}>Homework</label><input style={inputStyle} value={meta.homework} onChange={e => setMeta(m => ({ ...m, homework: e.target.value }))} placeholder="e.g. Completes accurately" /></div>
        <div><label style={labelStyle}>Conduct</label><input style={inputStyle} value={meta.conduct} onChange={e => setMeta(m => ({ ...m, conduct: e.target.value }))} placeholder="e.g. Good" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
        <div><label style={labelStyle}>Head’s comment</label><input style={inputStyle} value={meta.head_comment} onChange={e => setMeta(m => ({ ...m, head_comment: e.target.value }))} placeholder="e.g. Pull up for better grades" /></div>
        <div><label style={labelStyle}>Next term begins</label><input style={inputStyle} value={meta.next_term} onChange={e => setMeta(m => ({ ...m, next_term: e.target.value }))} placeholder="e.g. 12 May 2026" /></div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={saveMeta} disabled={busy || !studentId}>{busy ? 'Saving…' : (savedMeta ? 'Saved ✓' : 'Save comments')}</button><button className="ghost" onClick={rtype === 'full' ? printFull : printMid} disabled={!student}>Print {rtype === 'full' ? 'full term' : 'mid-term'} report</button></div>
    </div>
    {!student ? <p className="muted">No student selected.</p> : (
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{student.full_name}</div>
        <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>{cname} · {term} · Attendance {att.attended} of {att.total}</div>
        {rows.length === 0 ? <p className="muted">No marks for this term yet.</p> : (<>
          <table><thead><tr><th>Subject</th><th className="r">Mark</th><th className="r">{level === 'primary' ? 'Units' : 'Grade'}</th><th>Comment</th></tr></thead><tbody>
            {rows.map((r, i) => (<tr key={i}><td className="strong">{r.name}</td><td className="r">{r.score}</td><td className="r" style={{ fontWeight: 700 }}>{r.grade}</td><td className="muted">{r.comment || '—'}</td></tr>))}
          </tbody></table>
          <div style={{ marginTop: 14, fontWeight: 700 }}>Average: {avg}%{position != null ? '  ·  Position: ' + position + ' of ' + outOf : ''}</div>
        </>)}
      </div>)}
  </div>);
}

function SchoolSettingsPanel({ schoolId, school, settings, onChange }) {
  const [f, setF] = useState({ address: '', phone: '', email: '', color: '#2f7a52', logo: '', level: 'secondary' });
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (settings) setF({ address: settings.address || '', phone: settings.phone || '', email: settings.email || '', color: settings.color || '#2f7a52', logo: settings.logo || '', level: settings.level || 'secondary' }); }, [settings]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  function onLogo(e) { const file = e.target.files[0]; if (!file) return; if (file.size > 300000) { setErr('Logo too large — use an image under ~300KB.'); return; } setErr(''); const r = new FileReader(); r.onload = () => set('logo', r.result); r.readAsDataURL(file); }
  async function save() {
    setBusy(true); setErr(''); setSaved(false);
    const { error } = await supabase.from('school_settings').upsert({ school_id: schoolId, address: f.address || null, phone: f.phone || null, email: f.email || null, color: f.color || null, logo: f.logo || null, level: f.level || 'secondary', updated_at: new Date().toISOString() }, { onConflict: 'school_id' });
    if (error) setErr(error.message); else { setSaved(true); setTimeout(() => setSaved(false), 2000); onChange(); }
    setBusy(false);
  }
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Set your school's letterhead once. It prints at the top of every report and card.</p>
    <div className="card" style={{ maxWidth: 640 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>School name</label><input style={{ ...inputStyle, background: '#f3f5f7' }} value={school ? school.name : ''} disabled /></div>
        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input style={inputStyle} value={f.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 123 Main Rd, Chivhu" /></div>
        <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+263 ..." /></div>
        <div><label style={labelStyle}>Email</label><input style={inputStyle} value={f.email} onChange={e => set('email', e.target.value)} placeholder="info@school.co.zw" /></div>
        <div><label style={labelStyle}>School level</label><select style={inputStyle} value={f.level} onChange={e => set('level', e.target.value)}><option value="secondary">Secondary (A–F grades)</option><option value="primary">Primary (units)</option></select></div>
        <div><label style={labelStyle}>School colour</label><input type="color" style={{ ...inputStyle, height: 44, padding: 4 }} value={f.color} onChange={e => set('color', e.target.value)} /></div>
        <div><label style={labelStyle}>Logo (small image)</label><input type="file" accept="image/*" onChange={onLogo} style={{ fontSize: 13 }} /></div>
      </div>
      {f.logo && <div style={{ marginTop: 12 }}><img src={f.logo} alt="logo" style={{ height: 56, border: '1px solid #dde1e6', borderRadius: 8, padding: 4, background: '#fff' }} /></div>}
      {err && <p className="error">{err}</p>}
      <div style={{ marginTop: 16 }}><button onClick={save} disabled={busy}>{busy ? 'Saving…' : (saved ? 'Saved ✓' : 'Save letterhead')}</button></div>
    </div>
  </div>);
}

function statCard(value, label, color) { return { value, label, color }; }
function StatRow({ items }) { return (<div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>{items.map((it, i) => (<div key={i} style={{ background: '#fff', border: '1px solid #dde1e6', borderRadius: 10, padding: '14px 18px', minWidth: 150 }}><div style={{ fontSize: 22, fontWeight: 700, color: it.color || '#1f2328' }}>{it.value}</div><div style={{ fontSize: 12.5, color: '#5b6570' }}>{it.label}</div></div>))}</div>); }

function FinancePanel({ schoolId }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), kind: 'income', category: '', description: '', amount: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('finance_entries').select('*').eq('school_id', schoolId).order('date', { ascending: false }); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function add() { if (!f.amount) { setErr('Enter an amount.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('finance_entries').insert({ school_id: schoolId, date: f.date, kind: f.kind, category: f.category || null, description: f.description || null, amount: Number(f.amount) });
    if (error) setErr(error.message); else { setF(o => ({ ...o, category: '', description: '', amount: '' })); await load(); } setBusy(false); }
  async function remove(id) { await supabase.from('finance_entries').delete().eq('id', id); await load(); }
  const money = n => '$' + Number(n || 0).toLocaleString();
  const income = rows.filter(r => r.kind === 'income').reduce((a, r) => a + Number(r.amount || 0), 0);
  const expense = rows.filter(r => r.kind === 'expense').reduce((a, r) => a + Number(r.amount || 0), 0);
  return (<div>
    <StatRow items={[{ value: money(income), label: 'Income', color: '#1a7f5a' }, { value: money(expense), label: 'Expenses', color: '#c0392b' }, { value: money(income - expense), label: 'Balance' }]} />
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Record an entry</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={f.date} onChange={e => set('date', e.target.value)} /></div>
        <div><label style={labelStyle}>Type</label><select style={inputStyle} value={f.kind} onChange={e => set('kind', e.target.value)}><option value="income">Income</option><option value="expense">Expense</option></select></div>
        <div><label style={labelStyle}>Category</label><input style={inputStyle} value={f.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Fees" /></div>
        <div><label style={labelStyle}>Description</label><input style={inputStyle} value={f.description} onChange={e => set('description', e.target.value)} /></div>
        <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add entry'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th className="r">Amount</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td>{r.date}</td><td style={{ color: r.kind === 'income' ? '#1a7f5a' : '#c0392b', fontWeight: 600, textTransform: 'capitalize' }}>{r.kind}</td><td>{r.category || '—'}</td><td className="muted">{r.description || '—'}</td><td className="r">{money(r.amount)}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="6" className="muted">No entries yet.</td></tr>}
    </tbody></table>
  </div>);
}

function InventoryPanel({ schoolId, school, settings }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ name: '', category: '', quantity: '', unit: '', reorder_level: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('inventory').select('*').eq('school_id', schoolId).order('name'); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function add() { if (!f.name.trim()) { setErr('Enter a name.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('inventory').insert({ school_id: schoolId, name: f.name.trim(), category: f.category || null, quantity: Number(f.quantity || 0), unit: f.unit || null, reorder_level: f.reorder_level ? Number(f.reorder_level) : null, status: 'active' });
    if (error) setErr(error.message); else { setF({ name: '', category: '', quantity: '', unit: '', reorder_level: '' }); await load(); } setBusy(false); }
  async function adjust(r, delta) { const q = Math.max(0, Number(r.quantity || 0) + delta); await supabase.from('inventory').update({ quantity: q }).eq('id', r.id); await load(); }
  async function setStatus(r, status) { await supabase.from('inventory').update({ status }).eq('id', r.id); await load(); }
  async function remove(id) { await supabase.from('inventory').delete().eq('id', id); await load(); }
  const label = st => ({ active: 'Active', discontinued: 'Discontinued', written_off: 'Written off' }[st] || 'Active');
  function printList() {
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.category || '') + '</td><td class=r>' + (r.quantity == null ? '' : r.quantity) + '</td><td>' + esc(r.unit || '') + '</td><td>' + esc(label(r.status)) + '</td></tr>').join('');
    const html = '<html><head><title>Inventory</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 8px">Inventory</h3><table><thead><tr><th>Item</th><th>Category</th><th class=r>Quantity</th><th>Unit</th><th>Status</th></tr></thead><tbody>' + body + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}><button className="ghost" onClick={printList}>Print</button></div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add an item</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div><label style={labelStyle}>Item</label><input style={inputStyle} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Exercise books" /></div>
        <div><label style={labelStyle}>Category</label><input style={inputStyle} value={f.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Stationery" /></div>
        <div><label style={labelStyle}>Quantity</label><input style={inputStyle} value={f.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" /></div>
        <div><label style={labelStyle}>Unit</label><input style={inputStyle} value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g. boxes" /></div>
        <div><label style={labelStyle}>Reorder at</label><input style={inputStyle} value={f.reorder_level} onChange={e => set('reorder_level', e.target.value)} placeholder="optional" /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add item'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Item</th><th>Category</th><th className="r">Quantity</th><th>Unit</th><th className="r">Adjust</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map(r => { const low = r.reorder_level != null && Number(r.quantity) <= Number(r.reorder_level); const inactive = r.status && r.status !== 'active'; return (<tr key={r.id} style={{ opacity: inactive ? 0.55 : 1 }}><td className="strong">{r.name}{low && !inactive && <span style={{ color: '#c0392b', fontSize: 12, marginLeft: 8 }}>low</span>}</td><td>{r.category || '—'}</td><td className="r" style={{ color: low && !inactive ? '#c0392b' : '#1f2328', fontWeight: 600 }}>{r.quantity}</td><td>{r.unit || '—'}</td><td className="r"><button className="ghost" style={{ padding: '2px 10px', fontSize: 15 }} onClick={() => adjust(r, -1)}>-</button> <button className="ghost" style={{ padding: '2px 10px', fontSize: 15 }} onClick={() => adjust(r, 1)}>+</button></td><td><select style={{ ...inputStyle, margin: 0 }} value={r.status || 'active'} onChange={e => setStatus(r, e.target.value)}><option value="active">Active</option><option value="discontinued">Discontinued</option><option value="written_off">Written off</option></select></td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>); })}
      {rows.length === 0 && <tr><td colSpan="7" className="muted">No items yet.</td></tr>}
    </tbody></table>
  </div>);
}

function AssetsPanel({ schoolId, school, settings }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ name: '', category: '', serial: '', value: '', acquired: '', location: '', condition: 'good' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('assets').select('*').eq('school_id', schoolId).order('name'); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function add() { if (!f.name.trim()) { setErr('Enter a name.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('assets').insert({ school_id: schoolId, name: f.name.trim(), category: f.category || null, serial: f.serial || null, value: f.value ? Number(f.value) : null, acquired: f.acquired || null, location: f.location || null, condition: f.condition || null, status: 'in_use' });
    if (error) setErr(error.message); else { setF({ name: '', category: '', serial: '', value: '', acquired: '', location: '', condition: 'good' }); await load(); } setBusy(false); }
  async function setStatus(r, status) { await supabase.from('assets').update({ status }).eq('id', r.id); await load(); }
  async function remove(id) { await supabase.from('assets').delete().eq('id', id); await load(); }
  const money = n => '$' + Number(n || 0).toLocaleString();
  const label = st => ({ in_use: 'In use', sold: 'Sold', defunct: 'Defunct', disposed: 'Disposed' }[st] || 'In use');
  const activeTotal = rows.filter(r => (r.status || 'in_use') === 'in_use').reduce((a, r) => a + Number(r.value || 0), 0);
  function printList() {
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.category || '') + '</td><td>' + esc(r.serial || '') + '</td><td class=r>' + (r.value != null ? money(r.value) : '') + '</td><td>' + esc(r.acquired || '') + '</td><td>' + esc(r.location || '') + '</td><td>' + esc(r.condition || '') + '</td><td>' + esc(label(r.status)) + '</td></tr>').join('');
    const html = '<html><head><title>Asset register</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #999;padding:5px 7px;text-align:left}.r{text-align:right}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 8px">Asset register</h3><table><thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th class=r>Value</th><th>Acquired</th><th>Location</th><th>Condition</th><th>Status</th></tr></thead><tbody>' + body + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
      <StatRow items={[{ value: rows.length, label: 'Assets' }, { value: money(activeTotal), label: 'Value in use' }]} />
      <button className="ghost" onClick={printList}>Print</button>
    </div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add an asset</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div><label style={labelStyle}>Name</label><input style={inputStyle} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Desktop PC" /></div>
        <div><label style={labelStyle}>Category</label><input style={inputStyle} value={f.category} onChange={e => set('category', e.target.value)} placeholder="e.g. ICT" /></div>
        <div><label style={labelStyle}>Serial no.</label><input style={inputStyle} value={f.serial} onChange={e => set('serial', e.target.value)} /></div>
        <div><label style={labelStyle}>Value ($)</label><input style={inputStyle} value={f.value} onChange={e => set('value', e.target.value)} placeholder="0" /></div>
        <div><label style={labelStyle}>Acquired</label><input type="date" style={inputStyle} value={f.acquired} onChange={e => set('acquired', e.target.value)} /></div>
        <div><label style={labelStyle}>Location</label><input style={inputStyle} value={f.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Lab" /></div>
        <div><label style={labelStyle}>Condition</label><select style={inputStyle} value={f.condition} onChange={e => set('condition', e.target.value)}><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="broken">Broken</option></select></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add asset'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th className="r">Value</th><th>Location</th><th>Condition</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map(r => { const inactive = (r.status || 'in_use') !== 'in_use'; return (<tr key={r.id} style={{ opacity: inactive ? 0.55 : 1 }}><td className="strong">{r.name}</td><td>{r.category || '—'}</td><td className="muted">{r.serial || '—'}</td><td className="r">{r.value != null ? money(r.value) : '—'}</td><td>{r.location || '—'}</td><td style={{ textTransform: 'capitalize' }}>{r.condition || '—'}</td><td><select style={{ ...inputStyle, margin: 0 }} value={r.status || 'in_use'} onChange={e => setStatus(r, e.target.value)}><option value="in_use">In use</option><option value="sold">Sold</option><option value="defunct">Defunct</option><option value="disposed">Disposed</option></select></td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>); })}
      {rows.length === 0 && <tr><td colSpan="8" className="muted">No assets yet.</td></tr>}
    </tbody></table>
  </div>);
}

function DashboardPanel({ schoolId, school }) {
  const [d, setD] = useState(null);
  useEffect(() => { (async () => {
    if (!schoolId) return;
    const today = new Date().toISOString().slice(0, 10);
    const [stu, cls, tea, att, fin, inv, ast, ann] = await Promise.all([
      supabase.from('students').select('id').eq('school_id', schoolId),
      supabase.from('classes').select('id').eq('school_id', schoolId),
      supabase.from('profiles').select('id').eq('role', 'teacher').eq('school_id', schoolId),
      supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', today),
      supabase.from('finance_entries').select('kind,amount').eq('school_id', schoolId),
      supabase.from('inventory').select('quantity,reorder_level').eq('school_id', schoolId),
      supabase.from('assets').select('value').eq('school_id', schoolId),
      supabase.from('announcements').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(3),
    ]);
    const attRows = att.data || []; const attTotal = attRows.length; const attPresent = attRows.filter(r => r.status === 'present' || r.status === 'late').length;
    const finRows = fin.data || []; const income = finRows.filter(r => r.kind === 'income').reduce((a, r) => a + Number(r.amount || 0), 0); const expense = finRows.filter(r => r.kind === 'expense').reduce((a, r) => a + Number(r.amount || 0), 0);
    const low = (inv.data || []).filter(r => r.reorder_level != null && Number(r.quantity) <= Number(r.reorder_level)).length;
    const astTotal = (ast.data || []).reduce((a, r) => a + Number(r.value || 0), 0);
    setD({ students: (stu.data || []).length, classes: (cls.data || []).length, teachers: (tea.data || []).length, attPresent, attTotal, income, expense, low, astTotal, ann: ann.data || [] });
  })(); }, [schoolId]);
  const money = n => '$' + Number(n || 0).toLocaleString();
  if (!d) return <p className="muted">Loading…</p>;
  const attPct = d.attTotal ? Math.round(d.attPresent / d.attTotal * 100) : null;
  return (<div>
    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>{school ? school.name : 'Overview'}</div>
    <StatRow items={[{ value: d.students, label: 'Students' }, { value: d.classes, label: 'Classes' }, { value: d.teachers, label: 'Teachers' }, { value: attPct != null ? attPct + '%' : '—', label: 'Attendance today' }]} />
    <StatRow items={[{ value: money(d.income), label: 'Income', color: '#1a7f5a' }, { value: money(d.expense), label: 'Expenses', color: '#c0392b' }, { value: money(d.income - d.expense), label: 'Balance' }, { value: money(d.astTotal), label: 'Asset value' }]} />
    {d.low > 0 && <div style={{ background: '#fff8e1', border: '1px solid #f4d58a', color: '#8a6d1a', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{d.low} inventory item(s) low on stock — check the Inventory tab.</div>}
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Latest announcements</div>
      {d.ann.length === 0 ? <p className="muted">No announcements yet.</p> : d.ann.map(a => (<div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><div style={{ fontWeight: 600 }}>{a.title}</div><div className="muted" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{a.body}</div></div>))}
    </div>
  </div>);
}

function AnnouncementsPanel({ schoolId, canPost }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ title: '', body: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('announcements').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  async function post() { if (!f.title.trim()) { setErr('Enter a title.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('announcements').insert({ school_id: schoolId, title: f.title.trim(), body: f.body || null });
    if (error) setErr(error.message); else { setF({ title: '', body: '' }); await load(); } setBusy(false); }
  async function remove(id) { await supabase.from('announcements').delete().eq('id', id); await load(); }
  return (<div>
    {canPost && (<div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Post an announcement</div>
      <label style={labelStyle}>Title</label><input style={inputStyle} value={f.title} onChange={e => setF(o => ({ ...o, title: e.target.value }))} placeholder="e.g. Sports day this Friday" />
      <label style={{ ...labelStyle, marginTop: 10 }}>Message</label><textarea style={{ ...inputStyle, minHeight: 70, fontFamily: 'inherit' }} value={f.body} onChange={e => setF(o => ({ ...o, body: e.target.value }))} />
      <div style={{ marginTop: 12 }}><button onClick={post} disabled={busy}>{busy ? 'Posting…' : 'Post'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>)}
    {rows.length === 0 ? <p className="muted">No announcements yet.</p> : rows.map(a => (<div key={a.id} className="card" style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>{canPost && <button className="ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => remove(a.id)}>Delete</button>}</div><div className="muted" style={{ fontSize: 12, margin: '2px 0 8px' }}>{(a.created_at || '').slice(0, 10)}</div><div style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div></div>))}
  </div>);
}

function StaffPanel({ schoolId }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ full_name: '', role: '', phone: '', email: '', department: '', employed_on: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('staff').select('*').eq('school_id', schoolId).order('full_name'); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function add() { if (!f.full_name.trim()) { setErr('Enter a name.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('staff').insert({ school_id: schoolId, full_name: f.full_name.trim(), role: f.role || null, phone: f.phone || null, email: f.email || null, department: f.department || null, employed_on: f.employed_on || null });
    if (error) setErr(error.message); else { setF({ full_name: '', role: '', phone: '', email: '', department: '', employed_on: '' }); await load(); } setBusy(false); }
  async function remove(id) { await supabase.from('staff').delete().eq('id', id); await load(); }
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>A directory of all staff (separate from the login accounts you create in Teachers).</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a staff member</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div><label style={labelStyle}>Full name</label><input style={inputStyle} value={f.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Mrs. Chikafu" /></div>
        <div><label style={labelStyle}>Role</label><input style={inputStyle} value={f.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Bursar" /></div>
        <div><label style={labelStyle}>Department</label><input style={inputStyle} value={f.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Admin" /></div>
        <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={f.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><label style={labelStyle}>Email</label><input style={inputStyle} value={f.email} onChange={e => set('email', e.target.value)} /></div>
        <div><label style={labelStyle}>Employed on</label><input type="date" style={inputStyle} value={f.employed_on} onChange={e => set('employed_on', e.target.value)} /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add staff'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Email</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td className="strong">{r.full_name}</td><td>{r.role || '—'}</td><td>{r.department || '—'}</td><td>{r.phone || '—'}</td><td className="muted">{r.email || '—'}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="6" className="muted">No staff yet.</td></tr>}
    </tbody></table>
  </div>);
}

function AdmissionsPanel({ schoolId, classes }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ full_name: '', guardian_name: '', guardian_phone: '', class_id: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('applicants').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }); setRows(data || []); }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  const clsName = id => { const c = classes.find(x => x.id === id); return c ? c.name : '—'; };
  async function add() { if (!f.full_name.trim()) { setErr('Enter a name.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('applicants').insert({ school_id: schoolId, full_name: f.full_name.trim(), guardian_name: f.guardian_name || null, guardian_phone: f.guardian_phone || null, class_id: f.class_id || null, status: 'pending' });
    if (error) setErr(error.message); else { setF({ full_name: '', guardian_name: '', guardian_phone: '', class_id: '' }); await load(); } setBusy(false); }
  async function setStatus(r, status) { await supabase.from('applicants').update({ status }).eq('id', r.id); await load(); }
  async function enroll(r) { if (!r.class_id) { alert('Set a class for this applicant first.'); return; } await supabase.from('students').insert({ school_id: schoolId, full_name: r.full_name, class_id: r.class_id, klass: clsName(r.class_id) }); await supabase.from('applicants').update({ status: 'enrolled' }).eq('id', r.id); await load(); }
  async function remove(id) { await supabase.from('applicants').delete().eq('id', id); await load(); }
  const col = { pending: '#b8860b', accepted: '#1a7f5a', enrolled: '#3157a8', rejected: '#c0392b' };
  return (<div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>New application</div>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div><label style={labelStyle}>Applicant</label><input style={inputStyle} value={f.full_name} onChange={e => set('full_name', e.target.value)} /></div>
        <div><label style={labelStyle}>Guardian</label><input style={inputStyle} value={f.guardian_name} onChange={e => set('guardian_name', e.target.value)} /></div>
        <div><label style={labelStyle}>Guardian phone</label><input style={inputStyle} value={f.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} /></div>
        <div><label style={labelStyle}>Class applying for</label><select style={inputStyle} value={f.class_id} onChange={e => set('class_id', e.target.value)}><option value="">—</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Add application'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Applicant</th><th>Guardian</th><th>Class</th><th>Status</th><th></th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td className="strong">{r.full_name}</td><td>{r.guardian_name || '—'}{r.guardian_phone ? ' · ' + r.guardian_phone : ''}</td><td>{clsName(r.class_id)}</td>
        <td><select style={{ ...inputStyle, margin: 0, color: col[r.status], fontWeight: 600 }} value={r.status} onChange={e => setStatus(r, e.target.value)}><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="enrolled">Enrolled</option><option value="rejected">Rejected</option></select></td>
        <td className="r">{r.status !== 'enrolled' && <button style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => enroll(r)}>Enroll</button>}</td>
        <td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="6" className="muted">No applications yet.</td></tr>}
    </tbody></table>
  </div>);
}

function TimetablePanel({ schoolId, classes, subjects, school, settings }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];
  const [classId, setClassId] = useState(''); const [day, setDay] = useState('Monday');
  const [view, setView] = useState('week');
  const [grid, setGrid] = useState({}); const [others, setOthers] = useState([]); const [week, setWeek] = useState([]);
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function load() {
    if (!classId) { setGrid({}); return; }
    const { data } = await supabase.from('timetable').select('*').eq('class_id', classId).eq('day', day);
    const g = {}; periods.forEach(pd => { g[pd] = { subject: '', teacher: '' }; }); (data || []).forEach(r => { g[r.period] = { subject: r.subject || '', teacher: r.teacher || '' }; }); setGrid(g);
    const od = await supabase.from('timetable').select('class_id,period,teacher').eq('school_id', schoolId).eq('day', day); setOthers(od.data || []);
  }
  useEffect(() => { load(); }, [classId, day]);
  async function loadWeek() { if (!classId) { setWeek([]); return; } const { data } = await supabase.from('timetable').select('*').eq('class_id', classId); setWeek(data || []); }
  useEffect(() => { loadWeek(); }, [classId, saved]);
  function set(pd, k, v) { setGrid(g => ({ ...g, [pd]: { ...(g[pd] || {}), [k]: v } })); }
  async function save() {
    setBusy(true); setSaved(false);
    const list = periods.map(pd => ({ school_id: schoolId, class_id: classId, day, period: pd, subject: (grid[pd] && grid[pd].subject) || null, teacher: (grid[pd] && grid[pd].teacher) || null }));
    await supabase.from('timetable').upsert(list, { onConflict: 'class_id,day,period' });
    setSaved(true); setTimeout(() => setSaved(false), 2000); setBusy(false);
  }
  function clashFor(pd) { const t = ((grid[pd] && grid[pd].teacher) || '').trim().toLowerCase(); if (!t) return null; const hit = others.find(o => o.period === pd && o.class_id !== classId && (o.teacher || '').trim().toLowerCase() === t); if (!hit) return null; const c = classes.find(x => x.id === hit.class_id); return c ? c.name : 'another class'; }
  const clashes = periods.map(pd => ({ pd, other: clashFor(pd) })).filter(x => x.other);
  const cname = (classes.find(c => c.id === classId) || {}).name || '';
  const cell = (d, pd) => week.find(r => r.day === d && r.period === pd);
  function printWeek() {
    const head = '<tr><th>Period</th>' + days.map(d => '<th>' + d + '</th>').join('') + '</tr>';
    const body = periods.map(pd => '<tr><td><b>' + pd + '</b></td>' + days.map(d => { const c = cell(d, pd); const sub = c && c.subject ? esc(c.subject) : ''; const te = c && c.teacher ? '<div style="font-size:11px;color:#666">' + esc(c.teacher) + '</div>' : ''; return '<td>' + sub + te + '</td>'; }).join('') + '</tr>').join('');
    const html = '<html><head><title>Timetable</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 8px">Timetable — ' + esc(cname) + '</h3><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  if (classes.length === 0) return <p className="muted">No classes yet — add them in the Classes tab first.</p>;
  return (<div>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'end' }}>
      <div style={{ minWidth: 180 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className={view === 'week' ? '' : 'ghost'} onClick={() => setView('week')}>Weekly view</button>
        <button className={view === 'edit' ? '' : 'ghost'} onClick={() => setView('edit')}>Edit</button>
      </div>
      {view === 'week' && <button className="ghost" onClick={printWeek}>Print</button>}
    </div>
    {view === 'week' ? (
      <table><thead><tr><th style={{ width: 70 }}>Period</th>{days.map(d => <th key={d}>{d}</th>)}</tr></thead><tbody>
        {periods.map(pd => (<tr key={pd}><td className="strong">{pd}</td>{days.map(d => { const c = cell(d, pd); return (<td key={d}>{c && c.subject ? <div>{c.subject}</div> : <span className="muted">—</span>}{c && c.teacher ? <div className="muted" style={{ fontSize: 12 }}>{c.teacher}</div> : null}</td>); })}</tr>))}
      </tbody></table>
    ) : (<>
      <div style={{ marginBottom: 12, maxWidth: 200 }}><label style={labelStyle}>Day</label><select style={inputStyle} value={day} onChange={e => setDay(e.target.value)}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
      {clashes.length > 0 && <div style={{ background: '#fdeaea', border: '1px solid #f3c2c2', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 }}>{clashes.length} clash(es): a teacher is double-booked in another class at the same period — fix before this timetable is final.</div>}
      <table><thead><tr><th style={{ width: 70 }}>Period</th><th>Subject</th><th>Teacher</th></tr></thead><tbody>
        {periods.map(pd => { const cl = clashFor(pd); return (<tr key={pd}><td className="strong">{pd}</td>
          <td><input list="subj-list" style={{ ...inputStyle, margin: 0 }} value={(grid[pd] && grid[pd].subject) || ''} onChange={e => set(pd, 'subject', e.target.value)} placeholder="subject" /></td>
          <td><input style={{ ...inputStyle, margin: 0, borderColor: cl ? '#c0392b' : '#dde1e6' }} value={(grid[pd] && grid[pd].teacher) || ''} onChange={e => set(pd, 'teacher', e.target.value)} placeholder="teacher" />{cl && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 2 }}>Clash: also in {cl} this period</div>}</td></tr>); })}
      </tbody></table>
      <datalist id="subj-list">{subjects.map(su => <option key={su.id} value={su.name} />)}</datalist>
      <div style={{ marginTop: 16 }}><button onClick={save} disabled={busy}>{busy ? 'Saving…' : (saved ? 'Saved ✓' : 'Save ' + day + ' timetable')}</button></div>
    </>)}
  </div>);
}

function TeacherDashboardPanel({ schoolId, classes, session }) {
  const [d, setD] = useState(null);
  const classIds = classes.map(c => c.id);
  useEffect(() => { (async () => {
    if (!schoolId) return;
    const today = new Date().toISOString().slice(0, 10);
    let students = 0, attPresent = 0, attTotal = 0;
    if (classIds.length) {
      const { data: st } = await supabase.from('students').select('id').eq('school_id', schoolId).in('class_id', classIds);
      students = (st || []).length;
      const ids = (st || []).map(x => x.id);
      if (ids.length) { const { data: at } = await supabase.from('attendance').select('status').eq('date', today).in('student_id', ids); attTotal = (at || []).length; attPresent = (at || []).filter(r => r.status === 'present' || r.status === 'late').length; }
    }
    const { data: ann } = await supabase.from('announcements').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(3);
    setD({ students, attPresent, attTotal, ann: ann || [] });
  })(); }, [schoolId, classes.length]);
  if (!d) return <p className="muted">Loading…</p>;
  const attPct = d.attTotal ? Math.round(d.attPresent / d.attTotal * 100) : null;
  return (<div>
    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2 }}>Welcome back</div>
    <p className="muted" style={{ marginTop: 0 }}>{session.user.email}</p>
    <StatRow items={[{ value: classes.length, label: 'My classes' }, { value: d.students, label: 'My students' }, { value: attPct != null ? attPct + '%' : '—', label: 'Today’s attendance' }]} />
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>My classes</div>
      {classes.length === 0 ? <p className="muted">No classes assigned yet — ask your admin.</p> : classes.map(c => <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>{c.name}</div>)}
    </div>
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Latest announcements</div>
      {d.ann.length === 0 ? <p className="muted">No announcements yet.</p> : d.ann.map(a => (<div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><div style={{ fontWeight: 600 }}>{a.title}</div><div className="muted" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{a.body}</div></div>))}
    </div>
  </div>);
}

function AcademicsPanel({ schoolId, classes, subjects }) {
  const [term, setTerm] = useState(termOptions[0]);
  const [students, setStudents] = useState([]); const [marks, setMarks] = useState([]); const [att, setAtt] = useState([]);
  const [loading, setLoading] = useState(false); const [openClass, setOpenClass] = useState(null);
  useEffect(() => { (async () => {
    if (!schoolId) return; setLoading(true);
    const { data: st } = await supabase.from('students').select('id,full_name,class_id').eq('school_id', schoolId);
    const list = st || []; setStudents(list);
    const ids = list.map(s => s.id);
    const { data: mk } = await supabase.from('marks').select('student_id,subject_id,score').eq('term', term).in('student_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    setMarks(mk || []);
    const { data: at } = await supabase.from('attendance').select('student_id,status').eq('school_id', schoolId);
    setAtt(at || []); setLoading(false);
  })(); }, [schoolId, term]);
  const marksByStudent = {}; marks.forEach(m => { (marksByStudent[m.student_id] = marksByStudent[m.student_id] || []).push(m); });
  const attByStudent = {}; att.forEach(a => { const o = attByStudent[a.student_id] || { att: 0, tot: 0 }; o.tot++; if (a.status === 'present' || a.status === 'late') o.att++; attByStudent[a.student_id] = o; });
  const studAvg = sid => { const ms = marksByStudent[sid] || []; return ms.length ? ms.reduce((a, m) => a + Number(m.score || 0), 0) / ms.length : null; };
  const studAtt = sid => { const o = attByStudent[sid]; return o && o.tot ? Math.round(o.att / o.tot * 100) : null; };
  const classRows = classes.map(c => {
    const inClass = students.filter(s => s.class_id === c.id);
    const avgs = inClass.map(s => studAvg(s.id)).filter(v => v != null);
    const avg = avgs.length ? Math.round(avgs.reduce((a, v) => a + v, 0) / avgs.length) : null;
    let attNum = 0, attDen = 0; inClass.forEach(s => { const o = attByStudent[s.id]; if (o) { attNum += o.att; attDen += o.tot; } });
    return { c, students: inClass.length, avg, attPct: attDen ? Math.round(attNum / attDen * 100) : null };
  });
  const detail = (() => {
    if (!openClass) return null;
    const inClass = students.filter(s => s.class_id === openClass);
    const bySubj = {}; subjects.forEach(su => { bySubj[su.id] = []; });
    marks.forEach(m => { const s = students.find(x => x.id === m.student_id); if (s && s.class_id === openClass && bySubj[m.subject_id]) bySubj[m.subject_id].push(Number(m.score || 0)); });
    const subjRows = subjects.map(su => { const arr = bySubj[su.id] || []; return { name: su.name, avg: arr.length ? Math.round(arr.reduce((a, v) => a + v, 0) / arr.length) : null, n: arr.length }; }).filter(r => r.n > 0);
    const rows = inClass.map(s => ({ name: s.full_name, avg: studAvg(s.id), att: studAtt(s.id) })).sort((a, b) => (b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg));
    return { subjRows, rows };
  })();
  const clr = p => p == null ? '#5b6570' : p >= 75 ? '#1a7f5a' : p >= 50 ? '#b8860b' : '#c0392b';
  return (<div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 160 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => { setTerm(e.target.value); setOpenClass(null); }}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
    </div>
    {loading ? <p className="muted">Loading…</p> : (<>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>All classes · {term}</div>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Click a class to see subject averages and every pupil ranked.</p>
      <table><thead><tr><th>Class</th><th className="r">Students</th><th className="r">Avg exam mark</th><th className="r">Attendance</th><th></th></tr></thead><tbody>
        {classRows.map(r => (<tr key={r.c.id} onClick={() => setOpenClass(openClass === r.c.id ? null : r.c.id)} style={{ cursor: 'pointer', background: openClass === r.c.id ? '#eafaf3' : 'transparent' }}>
          <td className="strong">{r.c.name}</td><td className="r">{r.students}</td>
          <td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg != null ? r.avg + '%' : '—'}</td>
          <td className="r" style={{ fontWeight: 600, color: clr(r.attPct) }}>{r.attPct != null ? r.attPct + '%' : '—'}</td>
          <td className="r muted" style={{ fontSize: 13 }}>{openClass === r.c.id ? 'Hide' : 'View'}</td></tr>))}
        {classRows.length === 0 && <tr><td colSpan="5" className="muted">No classes yet.</td></tr>}
      </tbody></table>
      {detail && (<div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{(classes.find(c => c.id === openClass) || {}).name} — subject averages</div>
        <table><thead><tr><th>Subject</th><th className="r">Class average</th><th className="r">Marks entered</th></tr></thead><tbody>
          {detail.subjRows.length === 0 ? <tr><td colSpan="3" className="muted">No marks entered for this class this term.</td></tr> : detail.subjRows.map((r, i) => (<tr key={i}><td className="strong">{r.name}</td><td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg}%</td><td className="r">{r.n}</td></tr>))}
        </tbody></table>
        <div style={{ fontWeight: 700, margin: '18px 0 8px' }}>Pupils · ranked by average</div>
        <table><thead><tr><th>#</th><th>Student</th><th className="r">Average</th><th className="r">Attendance</th></tr></thead><tbody>
          {detail.rows.map((r, i) => (<tr key={i}><td className="muted">{i + 1}</td><td className="strong">{r.name}</td><td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg != null ? Math.round(r.avg) + '%' : '—'}</td><td className="r" style={{ color: clr(r.att) }}>{r.att != null ? r.att + '%' : '—'}</td></tr>))}
        </tbody></table>
      </div>)}
    </>)}
  </div>);
}

function FeesPanel({ schoolId, classes, school, settings }) {
  const [mode, setMode] = useState('collect');
  const [classId, setClassId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  if (classes.length === 0) return <p className="muted">No classes yet — add them in the Classes tab first.</p>;
  const className = (classes.find(c => c.id === classId) || {}).name || '';
  return (<div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 180 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className={mode === 'collect' ? '' : 'ghost'} onClick={() => setMode('collect')}>Collect & receipts</button>
        <button className={mode === 'setup' ? '' : 'ghost'} onClick={() => setMode('setup')}>Set fees</button>
      </div>
    </div>
    {mode === 'setup' ? <FeeSetup schoolId={schoolId} classId={classId} term={term} /> : <FeeCollect schoolId={schoolId} classId={classId} term={term} className={className} school={school} settings={settings} />}
  </div>);
}

function FeeSetup({ schoolId, classId, term }) {
  const [rows, setRows] = useState([]); const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() { const { data } = await supabase.from('fee_items').select('*').eq('school_id', schoolId).eq('class_id', classId).eq('term', term).order('created_at'); setRows(data || []); }
  useEffect(() => { load(); }, [classId, term, schoolId]);
  async function add() { if (!name.trim()) { setErr('Enter a name.'); return; } if (!amount) { setErr('Enter an amount.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('fee_items').insert({ school_id: schoolId, class_id: classId, term, name: name.trim(), amount: Number(amount) });
    if (error) setErr(error.message); else { setName(''); setAmount(''); await load(); } setBusy(false); }
  async function remove(id) { await supabase.from('fee_items').delete().eq('id', id); await load(); }
  const money = n => '$' + Number(n || 0).toLocaleString();
  const total = rows.reduce((a, r) => a + Number(r.amount || 0), 0);
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Set the fee items for this class and term (e.g. Tuition, Sports levy). Each class/form/grade can have different fees.</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a fee item</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}><label style={labelStyle}>Item</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tuition" /></div>
        <div style={{ width: 150 }}><label style={labelStyle}>Amount ($)</label><input style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
        <button onClick={add} disabled={busy}>{busy ? 'Adding…' : 'Add'}</button>
      </div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Item</th><th className="r">Amount</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td className="strong">{r.name}</td><td className="r">{money(r.amount)}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="3" className="muted">No fee items yet.</td></tr>}
      {rows.length > 0 && <tr><td className="strong">Total per pupil</td><td className="r strong">{money(total)}</td><td></td></tr>}
    </tbody></table>
  </div>);
}

function FeeCollect({ schoolId, classId, term, className, school, settings }) {
  const [students, setStudents] = useState([]); const [items, setItems] = useState([]); const [payments, setPayments] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [pay, setPay] = useState({ amount: '', method: 'cash', reference: '', paid_on: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() {
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name'); setStudents(st || []);
    const { data: fi } = await supabase.from('fee_items').select('*').eq('school_id', schoolId).eq('class_id', classId).eq('term', term); setItems(fi || []);
    const ids = (st || []).map(s => s.id);
    if (ids.length) { const { data: fp } = await supabase.from('fee_payments').select('*').eq('term', term).in('student_id', ids); setPayments(fp || []); } else setPayments([]);
  }
  useEffect(() => { load(); }, [classId, term, schoolId]);
  const money = n => '$' + Number(n || 0).toLocaleString();
  const due = items.reduce((a, r) => a + Number(r.amount || 0), 0);
  const paidOf = sid => payments.filter(p => p.student_id === sid).reduce((a, p) => a + Number(p.amount || 0), 0);
  async function recordPay() {
    if (!pay.amount) { setErr('Enter an amount.'); return; } setBusy(true); setErr('');
    const { data: ins, error } = await supabase.from('fee_payments').insert({ school_id: schoolId, student_id: openId, term, amount: Number(pay.amount), method: pay.method, reference: pay.reference || null, paid_on: pay.paid_on }).select('id').single();
    if (error) { setErr(error.message); setBusy(false); return; }
    const st = students.find(s => s.id === openId);
    await supabase.from('finance_entries').insert({ school_id: schoolId, date: pay.paid_on, kind: 'income', category: 'Fees', description: (st ? st.full_name : '') + ' · ' + term, amount: Number(pay.amount), fee_payment_id: ins ? ins.id : null });
    setPay({ amount: '', method: 'cash', reference: '', paid_on: new Date().toISOString().slice(0, 10) }); await load(); setBusy(false);
  }
  async function delPay(id) { await supabase.from('finance_entries').delete().eq('fee_payment_id', id); await supabase.from('fee_payments').delete().eq('id', id); await load(); }
  function printDoc(kind, student, lastPayment) {
    const paid = paidOf(student.id); const bal = due - paid;
    const itemRows = items.map(i => '<tr><td>' + esc(i.name) + '</td><td class=r>' + money(i.amount) + '</td></tr>').join('');
    const payRows = payments.filter(p => p.student_id === student.id).sort((a, b) => a.paid_on < b.paid_on ? -1 : 1).map(p => '<tr><td>' + esc(p.paid_on || '') + '</td><td>' + esc(p.method || '') + '</td><td>' + esc(p.reference || '') + '</td><td class=r>' + money(p.amount) + '</td></tr>').join('');
    let inner;
    if (kind === 'receipt' && lastPayment) {
      inner = '<h3 style="margin:0 0 8px">Receipt</h3><div class=m>' + esc(student.full_name) + ' · ' + esc(className) + ' · ' + esc(term) + '</div><table style="margin-top:12px;max-width:380px"><tbody><tr><td>Date</td><td class=r>' + esc(lastPayment.paid_on || '') + '</td></tr><tr><td>Method</td><td class=r>' + esc(lastPayment.method || '') + '</td></tr>' + (lastPayment.reference ? '<tr><td>Reference</td><td class=r>' + esc(lastPayment.reference) + '</td></tr>' : '') + '<tr><td><b>Amount paid</b></td><td class=r><b>' + money(lastPayment.amount) + '</b></td></tr><tr><td>Balance after</td><td class=r>' + money(bal) + '</td></tr></tbody></table>';
    } else {
      inner = '<h3 style="margin:0 0 8px">Fee statement</h3><div class=m>' + esc(student.full_name) + ' · ' + esc(className) + ' · ' + esc(term) + '</div><table style="margin-top:12px"><thead><tr><th>Fee item</th><th class=r>Amount</th></tr></thead><tbody>' + itemRows + '<tr><td><b>Total due</b></td><td class=r><b>' + money(due) + '</b></td></tr></tbody></table><table style="margin-top:14px"><thead><tr><th>Payment date</th><th>Method</th><th>Reference</th><th class=r>Amount</th></tr></thead><tbody>' + (payRows || '<tr><td colspan=4>No payments yet</td></tr>') + '<tr><td colspan=3><b>Total paid</b></td><td class=r><b>' + money(paid) + '</b></td></tr></tbody></table><div style="margin-top:14px;font-weight:700">Balance: ' + money(bal) + '</div>';
    }
    const html = '<html><head><title>' + (kind === 'receipt' ? 'Receipt' : 'Statement') + '</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}.m{color:#666;font-size:13px}</style></head><body>' + letterheadHtml(school, settings) + inner + '</body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  const openStudent = students.find(s => s.id === openId);
  const myPayments = openStudent ? payments.filter(p => p.student_id === openId).sort((a, b) => a.paid_on < b.paid_on ? 1 : -1) : [];
  return (<div>
    {due === 0 && <div style={{ background: '#fff8e1', border: '1px solid #f4d58a', color: '#8a6d1a', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14 }}>No fees set for this class/term yet — use "Set fees" to add them.</div>}
    <div className="muted" style={{ marginBottom: 10, fontSize: 14 }}>Fee due per pupil: <b>{money(due)}</b></div>
    <table><thead><tr><th>Student</th><th className="r">Due</th><th className="r">Paid</th><th className="r">Balance</th><th></th></tr></thead><tbody>
      {students.map(s => { const paid = paidOf(s.id); const bal = due - paid; return (<tr key={s.id} onClick={() => { setOpenId(openId === s.id ? null : s.id); setErr(''); }} style={{ cursor: 'pointer', background: openId === s.id ? '#eafaf3' : 'transparent' }}><td className="strong">{s.full_name}</td><td className="r">{money(due)}</td><td className="r" style={{ color: '#1a7f5a' }}>{money(paid)}</td><td className="r" style={{ fontWeight: 600, color: bal <= 0 ? '#1a7f5a' : '#c0392b' }}>{money(bal)}</td><td className="r muted" style={{ fontSize: 13 }}>{openId === s.id ? 'Hide' : 'Open'}</td></tr>); })}
      {students.length === 0 && <tr><td colSpan="5" className="muted">No students in this class.</td></tr>}
    </tbody></table>
    {openStudent && (<div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{openStudent.full_name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" onClick={() => printDoc('statement', openStudent)}>Print statement</button>
          {myPayments.length > 0 && <button className="ghost" onClick={() => printDoc('receipt', openStudent, myPayments[0])}>Receipt (last)</button>}
        </div>
      </div>
      <div className="muted" style={{ fontSize: 13, margin: '2px 0 12px' }}>Due {money(due)} · Paid {money(paidOf(openStudent.id))} · Balance {money(due - paidOf(openStudent.id))}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} value={pay.amount} onChange={e => setPay(o => ({ ...o, amount: e.target.value }))} placeholder="0" /></div>
        <div><label style={labelStyle}>Method</label><select style={inputStyle} value={pay.method} onChange={e => setPay(o => ({ ...o, method: e.target.value }))}><option value="cash">Cash</option><option value="bank">Bank</option><option value="paynow">Paynow</option></select></div>
        <div><label style={labelStyle}>Reference</label><input style={inputStyle} value={pay.reference} onChange={e => setPay(o => ({ ...o, reference: e.target.value }))} placeholder="optional" /></div>
        <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={pay.paid_on} onChange={e => setPay(o => ({ ...o, paid_on: e.target.value }))} /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={recordPay} disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button></div>
      {err && <p className="error">{err}</p>}
      {myPayments.length > 0 && (<table style={{ marginTop: 16 }}><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th className="r">Amount</th><th></th></tr></thead><tbody>
        {myPayments.map(p => (<tr key={p.id}><td>{p.paid_on}</td><td style={{ textTransform: 'capitalize' }}>{p.method}</td><td className="muted">{p.reference || '—'}</td><td className="r">{money(p.amount)}</td><td className="r"><button className="ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => delPay(p.id)}>Delete</button></td></tr>))}
      </tbody></table>)}
    </div>)}
  </div>);
}

function BankingPanel({ schoolId }) {
  const [txns, setTxns] = useState([]); const [feePays, setFeePays] = useState([]);
  const [f, setF] = useState({ type: 'banked', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() {
    const { data: t } = await supabase.from('bank_transactions').select('*').eq('school_id', schoolId).order('date', { ascending: false }); setTxns(t || []);
    const { data: fp } = await supabase.from('fee_payments').select('method,amount').eq('school_id', schoolId); setFeePays(fp || []);
  }
  useEffect(() => { load(); }, [schoolId]);
  function set(k, v) { setF(o => ({ ...o, [k]: v })); }
  async function add() { if (!f.amount) { setErr('Enter an amount.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.from('bank_transactions').insert({ school_id: schoolId, type: f.type, amount: Number(f.amount), date: f.date, note: f.note || null });
    if (error) setErr(error.message); else { setF({ type: 'banked', amount: '', date: new Date().toISOString().slice(0, 10), note: '' }); await load(); } setBusy(false); }
  async function remove(id) { await supabase.from('bank_transactions').delete().eq('id', id); await load(); }
  const money = n => '$' + Number(n || 0).toLocaleString();
  const sum = (arr, fn) => arr.filter(fn).reduce((a, x) => a + Number(x.amount || 0), 0);
  const cashFees = sum(feePays, p => p.method === 'cash');
  const bankFees = sum(feePays, p => p.method === 'bank' || p.method === 'paynow');
  const banked = sum(txns, t => t.type === 'banked');
  const withdrawn = sum(txns, t => t.type === 'withdrawn');
  const transferred = sum(txns, t => t.type === 'transferred');
  const cashInHand = cashFees - banked + withdrawn;
  const atBank = bankFees + banked - withdrawn - transferred;
  const label = t => ({ banked: 'Banked', withdrawn: 'Withdrawn', transferred: 'Transferred' }[t] || t);
  return (<div>
    <StatRow items={[{ value: money(cashInHand), label: 'Cash in hand' }, { value: money(atBank), label: 'At bank' }]} />
    <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Balances come from fee collections (cash vs bank/Paynow) and the movements below. General income/expenses aren't split by cash vs bank yet.</p>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Record a bank movement</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div><label style={labelStyle}>Type</label><select style={inputStyle} value={f.type} onChange={e => set('type', e.target.value)}><option value="banked">Banked (cash in)</option><option value="withdrawn">Withdrawn (cash out)</option><option value="transferred">Transferred</option></select></div>
        <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></div>
        <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={f.date} onChange={e => set('date', e.target.value)} /></div>
        <div><label style={labelStyle}>Note</label><input style={inputStyle} value={f.note} onChange={e => set('note', e.target.value)} placeholder="optional" /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving…' : 'Record'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Note</th><th className="r">Amount</th><th></th></tr></thead><tbody>
      {txns.map(t => (<tr key={t.id}><td>{t.date}</td><td className="strong">{label(t.type)}</td><td className="muted">{t.note || '—'}</td><td className="r">{money(t.amount)}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(t.id)}>Remove</button></td></tr>))}
      {txns.length === 0 && <tr><td colSpan="5" className="muted">No bank movements yet.</td></tr>}
    </tbody></table>
  </div>);
}

const labelStyle = { fontSize: 12, color: '#5b6570', marginBottom: 4, display: 'block' };
const inputStyle = { padding: '10px 11px', borderRadius: 8, border: '1px solid #dde1e6', background: '#fff', color: '#1f2328', fontSize: 14, width: '100%' };
