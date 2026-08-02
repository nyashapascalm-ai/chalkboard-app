'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ExportToolbar from '../../../components/ExportToolbar';
import PersonnelPanel from '../../../components/admin/people/PersonnelPanel';
import GovernanceBoardPanel from '../../../components/GovernanceBoardPanel';
import CommunicationCentre from '../../../components/CommunicationCentre';
import AdminDashboard from '../../../components/admin/dashboard/AdminDashboard';
import AdminSidebar from '../../../components/portal/AdminSidebar';
import PageHeader from '../../../components/ui/PageHeader';
import ClassesPanel from '../../../components/admin/school-setup/ClassesPanel';
import SubjectsPanel from '../../../components/admin/school-setup/SubjectsPanel';
import SchoolProfilePanel from '../../../components/admin/school-setup/SchoolProfilePanel';
import TeachersPanel from '../../../components/admin/people/TeachersPanel';
import AdmissionsPanel from '../../../components/admin/people/AdmissionsPanel';

function installApp() {
  const p = typeof window !== 'undefined' ? window.__cbPrompt : null;
  if (p) { p.prompt(); if (p.userChoice) p.userChoice.finally(() => { window.__cbPrompt = null; }); }
  else { alert('To install Chalkboard as an app: on desktop Chrome or Edge, click the install icon in the address bar. On iPhone (Safari): Share then Add to Home Screen. On Android: menu then Install app.'); }
}

function ChalkMark(size) {
  return (
    <img
      src="/icon-192.png"
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: Math.max(8, Math.round(size * 0.22)),
      }}
    />
  );
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
    if (!document.querySelector('meta[name="theme-color"]')) { const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#1E5EF7'; document.head.appendChild(m); }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) { const a = document.createElement('link'); a.rel = 'apple-touch-icon'; a.href = '/apple-touch-icon.png'; document.head.appendChild(a); }
    window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); window.__cbPrompt = ev; });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  if (checking) return <div className="center muted">Loading</div>;
  if (recovery) return <SetNewPassword onDone={() => setRecovery(false)} />;
  return session ? <App session={session} /> : <RedirectToPortalLogin />;
}

function RedirectToPortalLogin() {
  useEffect(() => {
    window.location.replace('/app');
  }, []);

  return <div className="center muted">Opening Chalkboard sign in...</div>;
}

function SetNewPassword({ onDone }) {
  const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(false);
  async function save(e) { e.preventDefault(); if (pw.length < 6) { setErr('Use at least 6 characters.'); return; } setBusy(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password: pw }); if (error) setErr(error.message); else setOk(true); setBusy(false); }
  return (<div className="center"><div className="card" style={{ maxWidth: 400 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>{ChalkMark(42)}<div style={{ fontWeight: 800, fontSize: 21 }}>Set a new password</div></div>
    {ok ? (<><p className="muted">Password updated.</p><button style={{ width: '100%' }} onClick={onDone}>Continue</button></>) : (<form onSubmit={save}>
      <input type="password" placeholder="New password" value={pw} onChange={e => setPw(e.target.value)} />
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Saving' : 'Update password'}</button>
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/app' }); if (error) setErr(error.message); else setSent(true); setBusy(false); }
  return (<div className="center"><div className="card" style={{ maxWidth: 400 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>{ChalkMark(42)}<div style={{ fontWeight: 800, fontSize: 24 }}>Chalkboard</div></div>
    <p className="muted" style={{ marginTop: 0 }}>Run your school  attendance, records and reports.</p>
    {mode === 'reset' ? (sent ? (<><p>Check your email for a reset link, then open it on this device to set a new password.</p><button className="ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setMode('signin'); setSent(false); }}>Back to sign in</button></>) : (<form onSubmit={sendReset}>
      <input placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Sending' : 'Send reset link'}</button>
      <p className="muted" style={{ fontSize: 13, marginTop: 12, cursor: 'pointer' }} onClick={() => { setMode('signin'); setErr(''); }}>Back to sign in</p>
    </form>)) : (<><form onSubmit={signIn}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <div style={{ position: 'relative' }}>
        <input placeholder="Password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
        <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 4, top: 12, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 16, padding: 6 }}>{showPw ? '' : ''}</button>
      </div>
      <button disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in' : 'Sign in'}</button>
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
  if (role === undefined) return <div className="center muted">Loading</div>;
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
  const [sub, setSub] = useState(undefined);
  const [subModalOff, setSubModalOff] = useState(false);
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
  async function loadSub() { if (!schoolId) { setSub(null); return; } const { data } = await supabase.from('subscriptions').select('*').eq('school_id', schoolId).maybeSingle(); setSub(data || null); }
  useEffect(() => { loadClasses(); loadMine(); loadSubjects(); loadSchoolMeta(); loadSub(); }, [schoolId]);
  useEffect(() => { (async () => {
    if (typeof window === 'undefined' || !schoolId || O) return;
    const u = new URL(window.location.href);
    if (u.searchParams.get('subpay') === '1') {
      try { const res = await fetch('/api/subscription-pay/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId }) }); const d = await res.json(); if (d.status === 'paid') { await loadSub(); alert('Payment received  your subscription is updated. Thank you!'); } } catch (e) {}
      u.searchParams.delete('subpay'); window.history.replaceState({}, '', u.toString());
    }
  })(); }, [schoolId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [nav]);
  const available = isTeacher ? allClasses.filter(c => myIds.includes(c.id)) : allClasses;

  const A = !isTeacher;
  const O = role === 'operator';
  const SA = role === 'school_admin';
  const groups = [
    {
      key: 'setup',
      label: 'School setup',
      icon: '',
      items: [
        ['school', 'School profile', ''],
        ['classes', 'Classes and forms', ''],
        ['subjects', 'Subjects', ''],
      ],
    },
    {
      key: 'people',
      label: 'People',
      icon: '',
      items: [
        ['students', 'Learners', ''],
        ['teachers', 'Teachers and allocations', ''],
        ['staff', 'Human Resources', ''],
        ['personnel', 'Personnel records', ''],
        ['admissions', 'Admissions', ''],
      ],
    },
    {
      key: 'reporting',
      label: 'Reporting',
      icon: '',
      items: [
        ['reports', 'Attendance reports', ''],
      ],
    },
    {
      key: 'money',
      label: 'Finance',
      icon: '',
      items: [
        ['fees', 'Fees', ''],
        ['documents', 'Invoices and receipts', ''],
        ['arrears', 'Arrears', ''],
        ['finance', 'Income and expenses', ''],
        ['budget', 'Annual budget', ''],
        ['pettycash', 'Petty cash', ''],
        ['banking', 'Banking', ''],
      ],
    },
    {
      key: 'governance',
      label: 'Governance',
      icon: '',
      items: [
        ['board', 'Governing board', ''],
        ['meetings', 'Meetings and resolutions', ''],
        ['events', 'Events calendar', ''],
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: '',
      items: [
        ['contractors', 'Contractors and payments', ''],
        ['inventory', 'Inventory', ''],
        ['assets', 'Assets', ''],
      ],
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: '',
      items: [
        ['communications', 'Communications', ''],
      ],
    },
    {
      key: 'account',
      label: 'Account',
      icon: '',
      items: [
        ['mybilling', 'Subscription', ''],
      ],
    },
  ].filter(g => g.items.length > 0);

const groupOf = k => { const g = groups.find(gr => gr.items.some(it => it[0] === k)); return g ? g.key : null; };
  const [openGroup, setOpenGroup] = useState(groupOf(nav));
  const goto = k => { setNav(k); const g = groupOf(k); if (g) setOpenGroup(g); };
  const title = {
    dashboard: 'Dashboard',
    mybilling: 'Subscription',
    fees: 'Fees',
    arrears: 'Arrears',
    announcements: 'Announcements',
    communications: 'Communications',
    staff: 'Human Resources',
    personnel: 'Personnel records',
    admissions: 'Admissions',
    students: 'Learners',
    classes: 'Classes and forms',
    teachers: 'Teachers and allocations',
    reports: 'Attendance reports',
    subjects: 'Subjects',
    school: 'School profile',
    finance: 'Income and expenses',
    banking: 'Banking',
    documents: 'Invoices and receipts',
    pettycash: 'Petty cash',
    budget: 'Annual budget',
    inventory: 'Inventory',
    assets: 'Assets',
    meetings: 'Meetings and resolutions',
    board: 'Governing board',
    events: 'Events calendar',
    contractors: 'Contractors and payments',
  }[nav];

const subToday = new Date().toISOString().slice(0, 10);
  const subStatus = (() => {
    if (!sub || !sub.next_due) return { code: 'none' };
    const soon = new Date(sub.next_due); soon.setDate(soon.getDate() - 7);
    const grace = new Date(sub.next_due); grace.setDate(grace.getDate() + 7);
    if (subToday <= sub.next_due) return { code: subToday >= soon.toISOString().slice(0, 10) ? 'due_soon' : 'current', due: sub.next_due };
    if (subToday <= grace.toISOString().slice(0, 10)) return { code: 'overdue', due: sub.next_due };
    return { code: 'locked', due: sub.next_due };
  })();
  if (!O && subStatus.code === 'locked') return <SubscriptionLock due={subStatus.due} />;
  return (<div className="shell">
    {!O && (subStatus.code === 'due_soon' || subStatus.code === 'overdue') && !subModalOff && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}><div className="card" style={{ maxWidth: 400, textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 19, marginBottom: 6, color: subStatus.code === 'overdue' ? '#c0392b' : '#8a6d1a' }}>{subStatus.code === 'overdue' ? 'Subscription overdue' : 'Subscription due soon'}</div><p className="muted">{subStatus.code === 'overdue' ? ('Your subscription was due on ' + subStatus.due + '. Please pay to keep access.') : ('Your subscription is due on ' + subStatus.due + '.')}</p><div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}><button onClick={() => { setNav('mybilling'); setOpenGroup('setup'); setSubModalOff(true); }}>Pay now</button><button className="ghost" onClick={() => setSubModalOff(true)}>Later</button></div></div></div>)}
    <AdminSidebar
      nav={nav}
      groups={groups}
      openGroup={openGroup}
      onToggleGroup={setOpenGroup}
      onNavigate={goto}
      email={session.user.email}
      isTeacher={isTeacher}
      onInstall={installApp}
      onSignOut={() => supabase.auth.signOut()}
    />
    <main className="main">
      <PageHeader
        title={title}
        actions={
          <ExportToolbar
            title={title || 'Chalkboard'}
            scopeSelector=".main"
          />
        }
        selector={
          canPick ? (
            <select
              value={schoolId || ''}
              onChange={event =>
                setSchoolId(event.target.value)
              }
              style={{
                width: 'auto',
                minWidth: 200,
              }}
            >
              {schools.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null
        }
      />
      {!O && (subStatus.code === 'due_soon' || subStatus.code === 'overdue') && (<div style={{ background: subStatus.code === 'overdue' ? '#fdeaea' : '#fff8e1', border: '1px solid ' + (subStatus.code === 'overdue' ? '#f3c2c2' : '#f4d58a'), color: subStatus.code === 'overdue' ? '#c0392b' : '#8a6d1a', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{subStatus.code === 'overdue' ? 'Subscription overdue (due ' + subStatus.due + '). Please pay to avoid losing access.' : 'Subscription due on ' + subStatus.due + '.'}</div>)}
      {!schoolId ? <p className="muted">No school selected.</p> :
        nav === 'billing' ? <BillingPanel /> :
        nav === 'mybilling' ? <SchoolBillingPanel schoolId={schoolId} /> :
        nav === 'arrears' ? <ArrearsPanel schoolId={schoolId} classes={allClasses} school={school} settings={settings} /> :
        nav === 'documents' ? <FinanceDocumentsPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'budget' ? <BudgetPanel schoolId={schoolId} settings={settings} /> :
        nav === 'pettycash' ? <PettyCashPanel schoolId={schoolId} /> :
        nav === 'fees' ? <FeesPanel schoolId={schoolId} classes={allClasses} school={school} settings={settings} /> :
        nav === 'academics' ? <AcademicsPanel schoolId={schoolId} classes={allClasses} subjects={subjects} /> :
        nav === 'dashboard' ? (isTeacher ? <TeacherDashboardPanel schoolId={schoolId} classes={available} session={session} /> : <DashboardPanel schoolId={schoolId} school={school} />) :
        nav === 'board' ? <GovernanceBoardPanel schoolId={schoolId} /> :
        nav === 'meetings' ? <MeetingsPanel schoolId={schoolId} /> :
        nav === 'events' ? <EventsPanel schoolId={schoolId} /> :
        nav === 'contractors' ? <ContractorsPanel schoolId={schoolId} /> :
        nav === 'communications' ? <CommunicationCentre schoolId={schoolId} /> :
        nav === 'announcements' ? <AnnouncementsPanel schoolId={schoolId} canPost={!isTeacher} /> :
        nav === 'personnel' ? <PersonnelPanel schoolId={schoolId} /> :
        nav === 'staff' ? <StaffPanel schoolId={schoolId} /> :
        nav === 'admissions' ? <AdmissionsPanel schoolId={schoolId} classes={allClasses} /> :
        nav === 'banking' ? <BankingPanel schoolId={schoolId} /> :
        nav === 'finance' ? <FinancePanel schoolId={schoolId} /> :
        nav === 'inventory' ? <InventoryPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'assets' ? <AssetsPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'school' ? <SchoolProfilePanel schoolId={schoolId} school={school} settings={settings} onChange={loadSchoolMeta} /> :
        nav === 'subjects' ? <SubjectsPanel schoolId={schoolId} subjects={subjects} onChange={loadSubjects} /> :
        nav === 'marks' ? <MarksPanel schoolId={schoolId} classes={available} subjects={subjects} teacherId={session.user.id} level={(settings && settings.level) || 'secondary'} /> :
        nav === 'reportcards' ? <ReportCardsPanel schoolId={schoolId} classes={available} subjects={subjects} school={school} settings={settings} level={(settings && settings.level) || 'secondary'} /> :
        nav === 'classes' ? <ClassesPanel schoolId={schoolId} classes={allClasses} onChange={loadClasses} /> :
        nav === 'teachers' ? <TeachersPanel schoolId={schoolId} classes={allClasses} subjects={subjects} /> :
        nav === 'reports' ? <ReportsPanel schoolId={schoolId} classes={available} school={school} settings={settings} /> :
        nav === 'students' ? <LearnersPanel schoolId={schoolId} classes={available} isTeacher={isTeacher} /> :
        <AttendancePanel schoolId={schoolId} classes={available} />}
    </main>
  </div>);
}

function LearnersPanel({ schoolId, classes, isTeacher }) {
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
  if (classes.length === 0) return <p className="muted">{isTeacher ? 'You have no classes yet.' : 'No classes yet  add them in the Classes tab first.'}</p>;
  if (editing) return <LearnerRecord student={editing} classes={classes} clsName={clsName} onBack={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
  return (<div>
    <div style={{ marginBottom: 14, maxWidth: 300 }}>
      <label style={labelStyle}>Class</label>
      <select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a student to {clsName(classId)}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>Full name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tadiwa Moyo" /></div>
        <button onClick={add} disabled={busy}>{busy ? 'Adding' : 'Add'}</button>
      </div>
      {err && <p className="error">{err}</p>}
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Add the name here, then Open the student to fill in their full record.</p>
    </div>
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Bulk add to {clsName(classId)}</div>
      <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>Paste one name per line, then Add all.</p>
      <textarea style={{ ...inputStyle, minHeight: 120, fontFamily: 'inherit' }} value={bulk} onChange={e => setBulk(e.target.value)} placeholder={'Tadiwa Moyo\nRutendo Sibanda\nTanaka Ncube'} />
      <div style={{ marginTop: 10 }}><button onClick={addBulk} disabled={busy}>{busy ? 'Adding' : 'Add all (' + bulk.split('\n').map(x => x.trim()).filter(Boolean).length + ')'}</button></div>
    </div>
    <table><thead><tr><th>Name</th><th>Guardian</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td className="strong">{r.full_name}</td><td className="muted">{r.guardian_name || ''}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => setEditing(r)}>Open</button></td></tr>))}
      {rows.length === 0 && <tr><td colSpan="3" className="muted">No students in this class yet.</td></tr>}
    </tbody></table>
  </div>);
}

function LearnerRecord({ student, classes, clsName, onBack, onSaved }) {
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
    <button className="ghost" onClick={onBack} style={{ marginBottom: 14, padding: '5px 12px', fontSize: 13 }}> Back to list</button>
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 18 }}>{student.full_name}</div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div><label style={labelStyle}>Full name</label><input style={inputStyle} value={f.full_name} onChange={e => set('full_name', e.target.value)} /></div>
        <div><label style={labelStyle}>Class</label><select style={inputStyle} value={f.class_id} onChange={e => set('class_id', e.target.value)}><option value=""> none </option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label style={labelStyle}>Gender</label><select style={inputStyle} value={f.gender} onChange={e => set('gender', e.target.value)}><option value=""></option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
        <div><label style={labelStyle}>Date of birth</label><input type="date" style={inputStyle} value={f.dob} onChange={e => set('dob', e.target.value)} /></div>
        <div><label style={labelStyle}>Guardian name</label><input style={inputStyle} value={f.guardian_name} onChange={e => set('guardian_name', e.target.value)} placeholder="e.g. Mrs. Moyo" /></div>
        <div><label style={labelStyle}>Guardian phone</label><input style={inputStyle} value={f.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} placeholder="0771234567" /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={labelStyle}>Address</label><input style={inputStyle} value={f.address} onChange={e => set('address', e.target.value)} /></div>
      <div style={{ marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={f.notes} onChange={e => set('notes', e.target.value)} /></div>
      {err && <p className="error">{err}</p>}
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={busy}>{busy ? 'Saving' : (saved ? 'Saved ' : 'Save record')}</button>
        <button className="ghost" onClick={remove} style={{ color: '#c0392b' }}>Remove student</button>
      </div>
    </div>
  </div>);
}

function AttendancePanel({ schoolId, classes }) {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setLearners] = useState([]);
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!classId && classes.length) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  useEffect(() => {
    async function load() {
      if (!schoolId || !classId || !date) {
        setLearners([]);
        setRecords([]);
        return;
      }

      setBusy(true);
      setErr('');

      const [studentsResult, attendanceResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, full_name, class_id, klass')
          .eq('school_id', schoolId)
          .eq('class_id', classId)
          .order('full_name'),

        supabase
          .from('attendance')
          .select('*')
          .eq('school_id', schoolId)
          .eq('class_id', classId)
          .eq('date', date),
      ]);

      if (studentsResult.error || attendanceResult.error) {
        setErr(
          studentsResult.error?.message ||
          attendanceResult.error?.message ||
          'Unable to load attendance.'
        );
        setLearners([]);
        setRecords([]);
      } else {
        setLearners(studentsResult.data || []);
        setRecords(attendanceResult.data || []);
      }

      setBusy(false);
    }

    load();
  }, [schoolId, classId, date]);

  const recordByLearner = new Map(
    records.map(record => [record.student_id, record])
  );

  const statusFor = studentId => {
    const record = recordByLearner.get(studentId);
    return record?.status || 'not marked';
  };

  const counts = records.reduce(
    (summary, record) => {
      const status = String(record.status || '').toLowerCase();

      if (status === 'present') summary.present += 1;
      else if (status === 'absent') summary.absent += 1;
      else if (status === 'late') summary.late += 1;

      return summary;
    },
    { present: 0, absent: 0, late: 0 }
  );

  const notMarked = Math.max(students.length - records.length, 0);

  if (classes.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 680 }}>
        <h3 style={{ marginTop: 0 }}>No classes configured</h3>
        <p className="muted">
          Add classes under School setup before reviewing attendance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'flex-end',
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 220 }}>
          <label style={labelStyle}>Class</label>
          <select
            style={inputStyle}
            value={classId}
            onChange={event => setClassId(event.target.value)}
          >
            {classes.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            style={{ ...inputStyle, width: 'auto' }}
            value={date}
            onChange={event => setDate(event.target.value)}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          ['Present', counts.present, '#1a7f5a'],
          ['Absent', counts.absent, '#c0392b'],
          ['Late', counts.late, '#a66b00'],
          ['Not marked', notMarked, '#687386'],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="card"
            style={{ padding: 16 }}
          >
            <div
              style={{
                color,
                fontSize: 27,
                fontWeight: 800,
              }}
            >
              {value}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: '#eef5ff',
          color: '#244d78',
          fontSize: 13,
          marginBottom: 18,
        }}
      >
        Attendance is read-only in Chalkboard. Teachers record daily
        attendance in Dari, and the submitted records appear here
        automatically.
      </div>

      {err ? <p className="error">{err}</p> : null}

      {busy ? (
        <p className="muted">Loading attendance...</p>
      ) : students.length === 0 ? (
        <p className="muted">
          No learners are assigned to this class.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Learner</th>
              <th>Status</th>
              <th>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const record = recordByLearner.get(student.id);
              const status = statusFor(student.id);

              return (
                <tr key={student.id}>
                  <td className="strong">{student.full_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {status}
                  </td>
                  <td className="muted">
                    {record
                      ? record.created_at
                        ? new Date(record.created_at).toLocaleString('en-GB')
                        : 'Submitted'
                      : 'No record'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function esc(v) { return String(v == null ? '' : v).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }); }

function letterheadHtml(school, settings) {
  const color = (settings && settings.color) || '#2f7a52';
  const logo = settings && settings.logo ? '<img src="' + settings.logo + '" style="height:54px;width:auto;margin-right:14px">' : '';
  const name = esc(school ? school.name : '');
  const lines = [];
  if (settings && settings.address) lines.push(esc(settings.address));
  const contact = [settings && settings.phone, settings && settings.email].filter(Boolean).map(esc).join('  ');
  if (contact) lines.push(contact);
  return '<div style="border-bottom:4px solid ' + color + ';padding-bottom:12px;margin-bottom:14px;display:flex;align-items:center">' + logo + '<div><div style="font-size:22px;font-weight:800;color:' + color + '">' + name + '</div><div style="font-size:12px;color:#555">' + lines.join('<br>') + '</div></div></div>';
}

function ReportsPanel({ schoolId, classes, school, settings }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
  const [classId, setClassId] = useState('');
  const [from, setFrom] = useState(monthAgo); const [to, setTo] = useState(today);
  const [students, setLearners] = useState([]); const [att, setAtt] = useState([]); const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function load() {
    if (!classId) { setLearners([]); setAtt([]); return; }
    setLoading(true);
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name');
    setLearners(st || []);
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
    const html = '<html><head><title>Attendance report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}th,td{border-bottom:1px solid #ccc;padding:8px;text-align:left}.r{text-align:right}.m{color:#666;font-size:13px}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 4px">Attendance report  ' + esc(cname) + '</h3><div class=m>' + from + ' to ' + to + '  ' + dates.length + ' day(s)</div><table><thead><tr><th>Learner</th><th class=r>Present</th><th class=r>Absent</th><th class=r>Late</th><th class=r>% present</th></tr></thead><tbody>' + rows + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the report.'); return; }
    w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  if (classes.length === 0) return <p className="muted">No classes available yet.</p>;
  const openLearner = students.find(x => x.id === openId);
  return (<div>
    <div style={{ display: 'flex', gap: 16, alignItems: 'end', marginBottom: 14, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 200 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => { setClassId(e.target.value); setOpenId(null); }}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label style={labelStyle}>From</label><input type="date" style={{ ...inputStyle, width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} /></div>
      <div><label style={labelStyle}>To</label><input type="date" style={{ ...inputStyle, width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} /></div>
      <button className="ghost" onClick={printReport} style={{ marginBottom: 6 }}>Print</button>
    </div>
    <div className="muted" style={{ marginBottom: 12, fontSize: 14 }}>{dates.length} day(s) recorded  Class totals: Present {totals.present}  Absent {totals.absent}  Late {totals.late}</div>
    {loading ? <p className="muted">Loading</p> : (
      <table><thead><tr><th>Learner</th><th className="r">Present</th><th className="r">Absent</th><th className="r">Late</th><th className="r">% present</th></tr></thead><tbody>
        {students.map(s => { const c = per[s.id]; const pp = pct(c); return (<tr key={s.id} onClick={() => setOpenId(openId === s.id ? null : s.id)} style={{ cursor: 'pointer', background: openId === s.id ? '#eafaf3' : 'transparent' }}><td className="strong">{s.full_name}</td><td className="r">{c.present}</td><td className="r">{c.absent}</td><td className="r">{c.late}</td><td className="r" style={{ color: pp >= 90 ? '#1a7f5a' : pp >= 75 ? '#b8860b' : '#c0392b', fontWeight: 600 }}>{pp}%</td></tr>); })}
        {students.length === 0 && <tr><td colSpan="5" className="muted">No students in this class.</td></tr>}
      </tbody></table>)}
    {openLearner && (<div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{openLearner.full_name}  daily record</div>
      {(() => { const recs = att.filter(r => r.student_id === openId).sort((a, b) => a.date < b.date ? -1 : 1); return recs.length === 0 ? <p className="muted">No marks in this range.</p> : (<table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>{recs.map((r, i) => (<tr key={i}><td>{r.date}</td><td style={{ textTransform: 'capitalize', color: colors[r.status], fontWeight: 600 }}>{r.status}</td></tr>))}</tbody></table>); })()}
    </div>)}
  </div>);
}

const termOptions = (() => { const y = new Date().getFullYear(); const o = []; [y, y - 1].forEach(yy => [1, 2, 3].forEach(t => o.push('Term ' + t + ' ' + yy))); return o; })();
function gradeFor(score, level) { if (score === '' || score == null) return ''; const n = Number(score); if (isNaN(n)) return ''; if (level === 'primary') { if (n >= 90) return '1'; if (n >= 80) return '2'; if (n >= 70) return '3'; if (n >= 60) return '4'; if (n >= 50) return '5'; if (n >= 40) return '6'; if (n >= 30) return '7'; if (n >= 20) return '8'; return '9'; } if (n >= 75) return 'A'; if (n >= 65) return 'B'; if (n >= 50) return 'C'; if (n >= 40) return 'D'; if (n >= 30) return 'E'; return 'F'; }

function MarksPanel({ schoolId, classes, subjects, teacherId, level }) {
  const [classId, setClassId] = useState(''); const [subjectId, setSubjectId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  const [students, setLearners] = useState([]); const [rowData, setRowData] = useState({});
  const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  useEffect(() => { if (!subjectId && subjects.length) setSubjectId(subjects[0].id); }, [subjects]);
  async function load() {
    if (!classId) { setLearners([]); return; }
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name');
    setLearners(st || []);
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
  if (subjects.length === 0) return <p className="muted">No subjects yet  an admin adds them in the Subjects tab.</p>;
  return (<div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div style={{ minWidth: 170 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ minWidth: 170 }}><label style={labelStyle}>Subject</label><select style={inputStyle} value={subjectId} onChange={e => setSubjectId(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
    </div>
    {students.length === 0 ? <p className="muted">No students in this class.</p> : (<>
      <table><thead><tr><th>Learner</th><th style={{ width: 90 }}>Mark</th><th style={{ width: 60 }}>{level === 'primary' ? 'Units' : 'Grade'}</th><th>Comment</th></tr></thead><tbody>
        {students.map(s => { const row = rowData[s.id] || { score: '', comment: '' }; const g = gradeFor(row.score, level); return (<tr key={s.id}><td className="strong">{s.full_name}</td>
          <td><input style={{ ...inputStyle, width: 70, margin: 0 }} value={row.score} onChange={e => setField(s.id, 'score', e.target.value)} placeholder="0-100" /></td>
          <td style={{ fontWeight: 700, color: g === 'A' ? '#1a7f5a' : g === 'E' ? '#c0392b' : '#1f2328' }}>{g || ''}</td>
          <td><input style={{ ...inputStyle, margin: 0 }} value={row.comment} onChange={e => setField(s.id, 'comment', e.target.value)} placeholder="optional" /></td>
        </tr>); })}
      </tbody></table>
      <div style={{ marginTop: 16 }}><button onClick={save} disabled={busy}>{busy ? 'Saving' : (saved ? 'Saved ' : 'Save marks')}</button>{err && <p className="error">{err}</p>}</div>
    </>)}
  </div>);
}

function ReportCardsPanel({ schoolId, classes, subjects, school, settings, level }) {
  const [classId, setClassId] = useState(''); const [studentId, setLearnerId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  const [rtype, setRtype] = useState('full');
  const [students, setLearners] = useState([]); const [allMarks, setAllMarks] = useState([]); const [studentMarksAll, setLearnerMarksAll] = useState([]);
  const [att, setAtt] = useState({ attended: 0, total: 0 });
  const [meta, setMeta] = useState({ general_comment: '', head_comment: '', next_term: '', handwriting: '', homework: '', conduct: '' });
  const [savedMeta, setSavedMeta] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  async function loadLearners() { if (!classId) { setLearners([]); return; } const { data } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name'); setLearners(data || []); setLearnerId((data && data.length) ? data[0].id : ''); }
  useEffect(() => { loadLearners(); }, [classId]);
  async function loadMarks() { const ids = students.map(s => s.id); if (!ids.length) { setAllMarks([]); return; } const { data } = await supabase.from('marks').select('student_id,subject_id,score,grade,comment').eq('term', term).in('student_id', ids); setAllMarks(data || []); }
  useEffect(() => { loadMarks(); }, [students, term]);
  async function loadLearnerAll() { if (!studentId) { setLearnerMarksAll([]); return; } const { data } = await supabase.from('marks').select('subject_id,score,term').eq('student_id', studentId); setLearnerMarksAll(data || []); }
  useEffect(() => { loadLearnerAll(); }, [studentId]);
  async function loadAttendance() { if (!studentId) { setAtt({ attended: 0, total: 0 }); return; } const { data } = await supabase.from('attendance').select('status').eq('student_id', studentId); const total = (data || []).length; const attended = (data || []).filter(r => r.status === 'present' || r.status === 'late').length; setAtt({ attended, total }); }
  useEffect(() => { loadAttendance(); }, [studentId]);
  async function loadMeta() { if (!studentId) { setMeta({ general_comment: '', head_comment: '', next_term: '', handwriting: '', homework: '', conduct: '' }); return; } const { data } = await supabase.from('report_meta').select('*').eq('student_id', studentId).eq('term', term).maybeSingle(); setMeta({ general_comment: (data && data.general_comment) || '', head_comment: (data && data.head_comment) || '', next_term: (data && data.next_term) || '', handwriting: (data && data.handwriting) || '', homework: (data && data.homework) || '', conduct: (data && data.conduct) || '' }); }
  useEffect(() => { loadMeta(); }, [studentId, term]);
  async function saveMeta() { setBusy(true); setSavedMeta(false); await supabase.from('report_meta').upsert({ school_id: schoolId, student_id: studentId, term, general_comment: meta.general_comment || null, head_comment: meta.head_comment || null, next_term: meta.next_term || null, handwriting: meta.handwriting || null, homework: meta.homework || null, conduct: meta.conduct || null }, { onConflict: 'student_id,term' }); setSavedMeta(true); setTimeout(() => setSavedMeta(false), 2000); setBusy(false); }
  const subjName = id => { const s = subjects.find(x => x.id === id); return s ? s.name : '?'; };
  const byLearner = {}; allMarks.forEach(m => { (byLearner[m.student_id] = byLearner[m.student_id] || []).push(m); });
  const avgOf = sid => { const ms = byLearner[sid] || []; if (!ms.length) return null; return ms.reduce((a, m) => a + Number(m.score || 0), 0) / ms.length; };
  const ranked = students.map(s => ({ id: s.id, avg: avgOf(s.id) })).filter(x => x.avg != null).sort((a, b) => b.avg - a.avg);
  const outOf = ranked.length;
  const position = (() => { const i = ranked.findIndex(x => x.id === studentId); return i >= 0 ? i + 1 : null; })();
  const student = students.find(s => s.id === studentId);
  const rows = (byLearner[studentId] || []).map(m => ({ name: subjName(m.subject_id), score: m.score, grade: gradeFor(m.score, level), comment: m.comment }));
  const avg = position != null ? Math.round(avgOf(studentId)) : (rows.length ? Math.round(rows.reduce((a, r) => a + Number(r.score || 0), 0) / rows.length) : 0);
  const cname = (classes.find(c => c.id === classId) || {}).name || '';
  const yr = (term.match(/\d{4}/) || [''])[0];
  function sigBlock() { return '<table style="margin-top:22px;width:100%"><tr>' + '<td style="border:0;padding-top:30px">Teachers signature: ______________</td>' + '<td style="border:0;padding-top:30px">Heads signature: ______________</td>' + '<td style="border:0;padding-top:30px">Parents signature: ______________</td></tr></table>'; }
  function stampBox() { return '<div style="margin-top:18px"><div style="font-size:11px;color:#666">School stamp</div><div style="width:150px;height:90px;border:1px solid #999;border-radius:6px;margin-top:4px"></div></div>'; }
  function footerHtml(note) { return '<div style="margin-top:22px;font-size:10px;color:#555;text-align:center">' + esc(note) + '</div><div style="text-align:center;font-weight:700;margin-top:4px">' + esc(school ? school.name : '') + '</div>'; }
  function openPrint(html) { const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350); }
  const NOTE = 'NB: This report is issued without erasure/alteration and it should be returned with parent/guardians signature.';
  function printFull() {
    const totMark = rows.reduce((a, r) => a + Number(r.score || 0), 0); const totOut = rows.length * 100; const totUnits = rows.reduce((a, r) => a + (Number(r.grade) || 0), 0); const gradeLabel = level === 'primary' ? 'Units' : 'Grade';
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td class=r>' + (r.score == null ? '' : r.score) + '</td><td class=r>100</td><td class=c>' + esc(r.grade || '') + '</td><td>' + esc(r.comment || '') + '</td></tr>').join('');
    const conductTable = '<table style="margin-top:10px"><tbody>' + '<tr><td style="width:150px"><b>Handwriting</b></td><td>' + esc(meta.handwriting || '') + '</td></tr>' + '<tr><td><b>Homework</b></td><td>' + esc(meta.homework || '') + '</td></tr>' + '<tr><td><b>Conduct</b></td><td>' + esc(meta.conduct || '') + '</td></tr>' + '</tbody></table>';
    const html = '<html><head><title>Report card</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}.c{text-align:center}.hd td{border:0;padding:2px 0}.gc{margin-top:12px}.lbl{font-size:12px;color:#555}</style></head><body>' + letterheadHtml(school, settings) + '<table class=hd><tr><td>Name: <b>' + esc(student ? student.full_name : '') + '</b></td><td>Grade: <b>' + esc(cname) + '</b></td><td>Term: <b>' + esc(term) + '</b></td></tr><tr><td>Class average: <b>' + avg + '%</b></td><td>Position in class: <b>' + (position != null ? position + ' out of ' + outOf : '') + '</b></td><td>Attendance: <b>' + att.attended + ' out of ' + att.total + '</b></td></tr></table>' + '<table style="margin-top:10px"><thead><tr><th>Learning Area</th><th class=r>Pupils Mark</th><th class=r>Out of</th><th class=c>' + gradeLabel + '</th><th>Comment</th></tr></thead><tbody>' + body + '<tr><td><b>TOTAL</b></td><td class=r><b>' + totMark + '</b></td><td class=r><b>' + totOut + '</b></td><td class=c><b>' + (level === 'primary' ? totUnits : '') + '</b></td><td></td></tr></tbody></table>' + conductTable + '<div class=gc><span class=lbl>General comments:</span><br>' + esc(meta.general_comment || '') + '</div>' + '<div class=gc><span class=lbl>Heads comments:</span><br>' + esc(meta.head_comment || '') + '</div>' + '<div class=gc><span class=lbl>Next term begins:</span> ' + esc(meta.next_term || '______________') + '</div>' + sigBlock() + stampBox() + footerHtml(NOTE) + '</body></html>';
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
      <div style={{ minWidth: 190 }}><label style={labelStyle}>Learner</label><select style={inputStyle} value={studentId} onChange={e => setLearnerId(e.target.value)}>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></div>
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
        <div><label style={labelStyle}>Heads comment</label><input style={inputStyle} value={meta.head_comment} onChange={e => setMeta(m => ({ ...m, head_comment: e.target.value }))} placeholder="e.g. Pull up for better grades" /></div>
        <div><label style={labelStyle}>Next term begins</label><input style={inputStyle} value={meta.next_term} onChange={e => setMeta(m => ({ ...m, next_term: e.target.value }))} placeholder="e.g. 12 May 2026" /></div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={saveMeta} disabled={busy || !studentId}>{busy ? 'Saving' : (savedMeta ? 'Saved ' : 'Save comments')}</button><button className="ghost" onClick={rtype === 'full' ? printFull : printMid} disabled={!student}>Print {rtype === 'full' ? 'full term' : 'mid-term'} report</button></div>
    </div>
    {!student ? <p className="muted">No student selected.</p> : (
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2 }}>{student.full_name}</div>
        <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>{cname}  {term}  Attendance {att.attended} of {att.total}</div>
        {rows.length === 0 ? <p className="muted">No marks for this term yet.</p> : (<>
          <table><thead><tr><th>Subject</th><th className="r">Mark</th><th className="r">{level === 'primary' ? 'Units' : 'Grade'}</th><th>Comment</th></tr></thead><tbody>
            {rows.map((r, i) => (<tr key={i}><td className="strong">{r.name}</td><td className="r">{r.score}</td><td className="r" style={{ fontWeight: 700 }}>{r.grade}</td><td className="muted">{r.comment || ''}</td></tr>))}
          </tbody></table>
          <div style={{ marginTop: 14, fontWeight: 700 }}>Average: {avg}%{position != null ? '    Position: ' + position + ' of ' + outOf : ''}</div>
        </>)}
      </div>)}
  </div>);
}

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
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving' : 'Add entry'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th className="r">Amount</th><th></th></tr></thead><tbody>
      {rows.map(r => (<tr key={r.id}><td>{r.date}</td><td style={{ color: r.kind === 'income' ? '#1a7f5a' : '#c0392b', fontWeight: 600, textTransform: 'capitalize' }}>{r.kind}</td><td>{r.category || ''}</td><td className="muted">{r.description || ''}</td><td className="r">{money(r.amount)}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>))}
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
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving' : 'Add item'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Item</th><th>Category</th><th className="r">Quantity</th><th>Unit</th><th className="r">Adjust</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map(r => { const low = r.reorder_level != null && Number(r.quantity) <= Number(r.reorder_level); const inactive = r.status && r.status !== 'active'; return (<tr key={r.id} style={{ opacity: inactive ? 0.55 : 1 }}><td className="strong">{r.name}{low && !inactive && <span style={{ color: '#c0392b', fontSize: 12, marginLeft: 8 }}>low</span>}</td><td>{r.category || ''}</td><td className="r" style={{ color: low && !inactive ? '#c0392b' : '#1f2328', fontWeight: 600 }}>{r.quantity}</td><td>{r.unit || ''}</td><td className="r"><button className="ghost" style={{ padding: '2px 10px', fontSize: 15 }} onClick={() => adjust(r, -1)}>-</button> <button className="ghost" style={{ padding: '2px 10px', fontSize: 15 }} onClick={() => adjust(r, 1)}>+</button></td><td><select style={{ ...inputStyle, margin: 0 }} value={r.status || 'active'} onChange={e => setStatus(r, e.target.value)}><option value="active">Active</option><option value="discontinued">Discontinued</option><option value="written_off">Written off</option></select></td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>); })}
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
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving' : 'Add asset'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Asset</th><th>Category</th><th>Serial</th><th className="r">Value</th><th>Location</th><th>Condition</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map(r => { const inactive = (r.status || 'in_use') !== 'in_use'; return (<tr key={r.id} style={{ opacity: inactive ? 0.55 : 1 }}><td className="strong">{r.name}</td><td>{r.category || ''}</td><td className="muted">{r.serial || ''}</td><td className="r">{r.value != null ? money(r.value) : ''}</td><td>{r.location || ''}</td><td style={{ textTransform: 'capitalize' }}>{r.condition || ''}</td><td><select style={{ ...inputStyle, margin: 0 }} value={r.status || 'in_use'} onChange={e => setStatus(r, e.target.value)}><option value="in_use">In use</option><option value="sold">Sold</option><option value="defunct">Defunct</option><option value="disposed">Disposed</option></select></td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(r.id)}>Remove</button></td></tr>); })}
      {rows.length === 0 && <tr><td colSpan="8" className="muted">No assets yet.</td></tr>}
    </tbody></table>
  </div>);
}

function DashboardPanel({ schoolId, school }) {
  return (
    <AdminDashboard
      schoolId={schoolId}
      school={school}
    />
  );
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
      <div style={{ marginTop: 12 }}><button onClick={post} disabled={busy}>{busy ? 'Posting' : 'Post'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>)}
    {rows.length === 0 ? <p className="muted">No announcements yet.</p> : rows.map(a => (<div key={a.id} className="card" style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>{canPost && <button className="ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => remove(a.id)}>Delete</button>}</div><div className="muted" style={{ fontSize: 12, margin: '2px 0 8px' }}>{(a.created_at || '').slice(0, 10)}</div><div style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div></div>))}
  </div>);
}

function StaffPanel({ schoolId }) {
  const [tab, setTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [leave, setLeave] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const [staffForm, setStaffForm] = useState({
    full_name: '',
    employee_number: '',
    position: '',
    department: '',
    employment_type: 'permanent',
    phone: '',
    email: '',
    start_date: '',
  });

  const [leaveForm, setLeaveForm] = useState({
    staff_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [absenceForm, setAbsenceForm] = useState({
    staff_id: '',
    absence_date: new Date().toISOString().slice(0, 10),
    status: 'present',
    notes: '',
  });

  async function load() {
    const [staffResult, leaveResult, absenceResult] = await Promise.all([
      supabase
        .from('staff')
        .select('*')
        .eq('school_id', schoolId)
        .order('full_name'),
      supabase
        .from('hr_leave_requests')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false }),
      supabase
        .from('hr_staff_absences')
        .select('*')
        .eq('school_id', schoolId)
        .order('absence_date', { ascending: false })
        .limit(100),
    ]);

    setStaff(staffResult.data || []);
    setLeave(leaveResult.data || []);
    setAbsences(absenceResult.data || []);

    const loadError =
      staffResult.error ||
      leaveResult.error ||
      absenceResult.error;

    if (loadError) setErr(loadError.message);
  }

  useEffect(() => {
    load();
  }, [schoolId]);

  async function addStaff() {
    if (!staffForm.full_name.trim()) {
      setErr('Enter the staff member name.');
      return;
    }

    setBusy(true);
    setErr('');

    const { error } = await supabase
      .from('staff')
      .insert({
        school_id: schoolId,
        full_name: staffForm.full_name.trim(),
        employee_number: staffForm.employee_number || null,
        position: staffForm.position || null,
        role: staffForm.position || null,
        department: staffForm.department || null,
        employment_type: staffForm.employment_type || null,
        phone: staffForm.phone || null,
        email: staffForm.email || null,
        start_date: staffForm.start_date || null,
        employed_on: staffForm.start_date || null,
        status: 'active',
      });

    if (error) setErr(error.message);
    else {
      setStaffForm({
        full_name: '',
        employee_number: '',
        position: '',
        department: '',
        employment_type: 'permanent',
        phone: '',
        email: '',
        start_date: '',
      });
      await load();
    }

    setBusy(false);
  }

  async function addLeave() {
    if (
      !leaveForm.staff_id ||
      !leaveForm.start_date ||
      !leaveForm.end_date
    ) {
      setErr('Select a staff member and leave dates.');
      return;
    }

    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    const days =
      Math.floor((end - start) / 86400000) + 1;

    setBusy(true);
    setErr('');

    const { error } = await supabase
      .from('hr_leave_requests')
      .insert({
        school_id: schoolId,
        staff_id: leaveForm.staff_id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        days,
        reason: leaveForm.reason || null,
        status: 'pending',
      });

    if (error) setErr(error.message);
    else {
      setLeaveForm({
        staff_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
      });
      await load();
    }

    setBusy(false);
  }

  async function setLeaveStatus(id, status) {
    const { error } = await supabase
      .from('hr_leave_requests')
      .update({
        status,
        approved_at:
          status === 'approved'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', id);

    if (error) setErr(error.message);
    else await load();
  }

  async function recordAbsence() {
    if (!absenceForm.staff_id || !absenceForm.absence_date) {
      setErr('Select a staff member and date.');
      return;
    }

    setBusy(true);
    setErr('');

    const { error } = await supabase
      .from('hr_staff_absences')
      .upsert(
        {
          school_id: schoolId,
          staff_id: absenceForm.staff_id,
          absence_date: absenceForm.absence_date,
          status: absenceForm.status,
          notes: absenceForm.notes || null,
        },
        { onConflict: 'staff_id,absence_date' }
      );

    if (error) setErr(error.message);
    else {
      setAbsenceForm({
        staff_id: '',
        absence_date: new Date().toISOString().slice(0, 10),
        status: 'present',
        notes: '',
      });
      await load();
    }

    setBusy(false);
  }

  async function removeStaff(id) {
    if (!confirm('Remove this staff member?')) return;

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) setErr(error.message);
    else await load();
  }

  function staffName(id) {
    return (
      staff.find(item => item.id === id)?.full_name ||
      'Unknown staff member'
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentlyAway = leave.filter(
    item =>
      item.status === 'approved' &&
      item.start_date <= today &&
      item.end_date >= today
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        {[
          ['directory', 'Staff directory'],
          ['leave', 'Leave management'],
          ['absence', 'Staff attendance'],
          ['reports', 'HR overview'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tab === value ? '' : 'ghost'}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {err ? <p className="error">{err}</p> : null}

      {tab === 'directory' ? (
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Add staff member</h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {[
                ['full_name', 'Full name'],
                ['employee_number', 'Employee number'],
                ['position', 'Position'],
                ['department', 'Department'],
                ['phone', 'Phone'],
                ['email', 'Email'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    style={inputStyle}
                    value={staffForm[key]}
                    onChange={event =>
                      setStaffForm(current => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>Employment type</label>
                <select
                  style={inputStyle}
                  value={staffForm.employment_type}
                  onChange={event =>
                    setStaffForm(current => ({
                      ...current,
                      employment_type: event.target.value,
                    }))
                  }
                >
                  <option value="permanent">Permanent</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="part_time">Part time</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Start date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={staffForm.start_date}
                  onChange={event =>
                    setStaffForm(current => ({
                      ...current,
                      start_date: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={addStaff}
              disabled={busy}
              style={{ marginTop: 14 }}
            >
              Add staff member
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Position</th>
                <th>Department</th>
                <th>Employment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(item => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.full_name}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {item.employee_number || item.email || ''}
                    </div>
                  </td>
                  <td>{item.position || item.role || '-'}</td>
                  <td>{item.department || '-'}</td>
                  <td>{item.employment_type || '-'}</td>
                  <td>{item.status || 'active'}</td>
                  <td className="r">
                    <button
                      className="ghost"
                      onClick={() => removeStaff(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'leave' ? (
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Create leave request</h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>Staff member</label>
                <select
                  style={inputStyle}
                  value={leaveForm.staff_id}
                  onChange={event =>
                    setLeaveForm(current => ({
                      ...current,
                      staff_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select staff member</option>
                  {staff.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Leave type</label>
                <select
                  style={inputStyle}
                  value={leaveForm.leave_type}
                  onChange={event =>
                    setLeaveForm(current => ({
                      ...current,
                      leave_type: event.target.value,
                    }))
                  }
                >
                  {[
                    'annual',
                    'sick',
                    'maternity',
                    'paternity',
                    'compassionate',
                    'study',
                    'unpaid',
                    'other',
                  ].map(item => (
                    <option key={item} value={item}>
                      {item.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Start date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={leaveForm.start_date}
                  onChange={event =>
                    setLeaveForm(current => ({
                      ...current,
                      start_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>End date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={leaveForm.end_date}
                  onChange={event =>
                    setLeaveForm(current => ({
                      ...current,
                      end_date: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <label style={{ ...labelStyle, marginTop: 10 }}>
              Reason
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80 }}
              value={leaveForm.reason}
              onChange={event =>
                setLeaveForm(current => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />

            <button
              onClick={addLeave}
              disabled={busy}
              style={{ marginTop: 12 }}
            >
              Submit leave request
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Leave</th>
                <th>Dates</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leave.map(item => (
                <tr key={item.id}>
                  <td>{staffName(item.staff_id)}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {item.leave_type}
                  </td>
                  <td>
                    {item.start_date} to {item.end_date}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {item.status}
                  </td>
                  <td className="r">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          onClick={() =>
                            setLeaveStatus(item.id, 'approved')
                          }
                        >
                          Approve
                        </button>{' '}
                        <button
                          className="ghost"
                          onClick={() =>
                            setLeaveStatus(item.id, 'rejected')
                          }
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'absence' ? (
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>
              Record staff attendance or absence
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <label style={labelStyle}>Staff member</label>
                <select
                  style={inputStyle}
                  value={absenceForm.staff_id}
                  onChange={event =>
                    setAbsenceForm(current => ({
                      ...current,
                      staff_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select staff member</option>
                  {staff.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={absenceForm.absence_date}
                  onChange={event =>
                    setAbsenceForm(current => ({
                      ...current,
                      absence_date: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  style={inputStyle}
                  value={absenceForm.status}
                  onChange={event =>
                    setAbsenceForm(current => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  {[
                    'present',
                    'absent',
                    'on_leave',
                    'off_duty',
                    'training',
                    'official_business',
                    'suspended',
                  ].map(item => (
                    <option key={item} value={item}>
                      {item.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ ...labelStyle, marginTop: 10 }}>
              Notes
            </label>
            <input
              style={inputStyle}
              value={absenceForm.notes}
              onChange={event =>
                setAbsenceForm(current => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />

            <button
              onClick={recordAbsence}
              disabled={busy}
              style={{ marginTop: 12 }}
            >
              Save staff status
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff member</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(item => (
                <tr key={item.id}>
                  <td>{item.absence_date}</td>
                  <td>{staffName(item.staff_id)}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {item.status.replaceAll('_', ' ')}
                  </td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'reports' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          {[
            ['Total staff', staff.length],
            [
              'Active staff',
              staff.filter(item => (item.status || 'active') === 'active').length,
            ],
            ['Currently on leave', currentlyAway.length],
            [
              'Pending leave',
              leave.filter(item => item.status === 'pending').length,
            ],
          ].map(([label, value]) => (
            <div key={label} className="card">
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {value}
              </div>
              <div className="muted">{label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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
    const html = '<html><head><title>Timetable</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 8px">Timetable  ' + esc(cname) + '</h3><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  if (classes.length === 0) return <p className="muted">No classes yet  add them in the Classes tab first.</p>;
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
        {periods.map(pd => (<tr key={pd}><td className="strong">{pd}</td>{days.map(d => { const c = cell(d, pd); return (<td key={d}>{c && c.subject ? <div>{c.subject}</div> : <span className="muted"></span>}{c && c.teacher ? <div className="muted" style={{ fontSize: 12 }}>{c.teacher}</div> : null}</td>); })}</tr>))}
      </tbody></table>
    ) : (<>
      <div style={{ marginBottom: 12, maxWidth: 200 }}><label style={labelStyle}>Day</label><select style={inputStyle} value={day} onChange={e => setDay(e.target.value)}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
      {clashes.length > 0 && <div style={{ background: '#fdeaea', border: '1px solid #f3c2c2', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 }}>{clashes.length} clash(es): a teacher is double-booked in another class at the same period  fix before this timetable is final.</div>}
      <table><thead><tr><th style={{ width: 70 }}>Period</th><th>Subject</th><th>Teacher</th></tr></thead><tbody>
        {periods.map(pd => { const cl = clashFor(pd); return (<tr key={pd}><td className="strong">{pd}</td>
          <td><input list="subj-list" style={{ ...inputStyle, margin: 0 }} value={(grid[pd] && grid[pd].subject) || ''} onChange={e => set(pd, 'subject', e.target.value)} placeholder="subject" /></td>
          <td><input style={{ ...inputStyle, margin: 0, borderColor: cl ? '#c0392b' : '#dde1e6' }} value={(grid[pd] && grid[pd].teacher) || ''} onChange={e => set(pd, 'teacher', e.target.value)} placeholder="teacher" />{cl && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 2 }}>Clash: also in {cl} this period</div>}</td></tr>); })}
      </tbody></table>
      <datalist id="subj-list">{subjects.map(su => <option key={su.id} value={su.name} />)}</datalist>
      <div style={{ marginTop: 16 }}><button onClick={save} disabled={busy}>{busy ? 'Saving' : (saved ? 'Saved ' : 'Save ' + day + ' timetable')}</button></div>
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
  if (!d) return <p className="muted">Loading</p>;
  const attPct = d.attTotal ? Math.round(d.attPresent / d.attTotal * 100) : null;
  return (<div>
    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2 }}>Welcome back</div>
    <p className="muted" style={{ marginTop: 0 }}>{session.user.email}</p>
    <StatRow items={[{ value: classes.length, label: 'My classes' }, { value: d.students, label: 'My students' }, { value: attPct != null ? attPct + '%' : '', label: 'Todays attendance' }]} />
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>My classes</div>
      {classes.length === 0 ? <p className="muted">No classes assigned yet  ask your admin.</p> : classes.map(c => <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>{c.name}</div>)}
    </div>
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Latest announcements</div>
      {d.ann.length === 0 ? <p className="muted">No announcements yet.</p> : d.ann.map(a => (<div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><div style={{ fontWeight: 600 }}>{a.title}</div><div className="muted" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{a.body}</div></div>))}
    </div>
  </div>);
}

function AcademicsPanel({ schoolId, classes, subjects }) {
  const [term, setTerm] = useState(termOptions[0]);
  const [students, setLearners] = useState([]); const [marks, setMarks] = useState([]); const [att, setAtt] = useState([]);
  const [loading, setLoading] = useState(false); const [openClass, setOpenClass] = useState(null);
  useEffect(() => { (async () => {
    if (!schoolId) return; setLoading(true);
    const { data: st } = await supabase.from('students').select('id,full_name,class_id').eq('school_id', schoolId);
    const list = st || []; setLearners(list);
    const ids = list.map(s => s.id);
    const { data: mk } = await supabase.from('marks').select('student_id,subject_id,score').eq('term', term).in('student_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    setMarks(mk || []);
    const { data: at } = await supabase.from('attendance').select('student_id,status').eq('school_id', schoolId);
    setAtt(at || []); setLoading(false);
  })(); }, [schoolId, term]);
  const marksByLearner = {}; marks.forEach(m => { (marksByLearner[m.student_id] = marksByLearner[m.student_id] || []).push(m); });
  const attByLearner = {}; att.forEach(a => { const o = attByLearner[a.student_id] || { att: 0, tot: 0 }; o.tot++; if (a.status === 'present' || a.status === 'late') o.att++; attByLearner[a.student_id] = o; });
  const studAvg = sid => { const ms = marksByLearner[sid] || []; return ms.length ? ms.reduce((a, m) => a + Number(m.score || 0), 0) / ms.length : null; };
  const studAtt = sid => { const o = attByLearner[sid]; return o && o.tot ? Math.round(o.att / o.tot * 100) : null; };
  const classRows = classes.map(c => {
    const inClass = students.filter(s => s.class_id === c.id);
    const avgs = inClass.map(s => studAvg(s.id)).filter(v => v != null);
    const avg = avgs.length ? Math.round(avgs.reduce((a, v) => a + v, 0) / avgs.length) : null;
    let attNum = 0, attDen = 0; inClass.forEach(s => { const o = attByLearner[s.id]; if (o) { attNum += o.att; attDen += o.tot; } });
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
    {loading ? <p className="muted">Loading</p> : (<>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>All classes  {term}</div>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Click a class to see subject averages and every pupil ranked.</p>
      <table><thead><tr><th>Class</th><th className="r">Learners</th><th className="r">Avg exam mark</th><th className="r">Attendance</th><th></th></tr></thead><tbody>
        {classRows.map(r => (<tr key={r.c.id} onClick={() => setOpenClass(openClass === r.c.id ? null : r.c.id)} style={{ cursor: 'pointer', background: openClass === r.c.id ? '#eafaf3' : 'transparent' }}>
          <td className="strong">{r.c.name}</td><td className="r">{r.students}</td>
          <td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg != null ? r.avg + '%' : ''}</td>
          <td className="r" style={{ fontWeight: 600, color: clr(r.attPct) }}>{r.attPct != null ? r.attPct + '%' : ''}</td>
          <td className="r muted" style={{ fontSize: 13 }}>{openClass === r.c.id ? 'Hide' : 'View'}</td></tr>))}
        {classRows.length === 0 && <tr><td colSpan="5" className="muted">No classes yet.</td></tr>}
      </tbody></table>
      {detail && (<div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{(classes.find(c => c.id === openClass) || {}).name}  subject averages</div>
        <table><thead><tr><th>Subject</th><th className="r">Class average</th><th className="r">Marks entered</th></tr></thead><tbody>
          {detail.subjRows.length === 0 ? <tr><td colSpan="3" className="muted">No marks entered for this class this term.</td></tr> : detail.subjRows.map((r, i) => (<tr key={i}><td className="strong">{r.name}</td><td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg}%</td><td className="r">{r.n}</td></tr>))}
        </tbody></table>
        <div style={{ fontWeight: 700, margin: '18px 0 8px' }}>Pupils  ranked by average</div>
        <table><thead><tr><th>#</th><th>Learner</th><th className="r">Average</th><th className="r">Attendance</th></tr></thead><tbody>
          {detail.rows.map((r, i) => (<tr key={i}><td className="muted">{i + 1}</td><td className="strong">{r.name}</td><td className="r" style={{ fontWeight: 600, color: clr(r.avg) }}>{r.avg != null ? Math.round(r.avg) + '%' : ''}</td><td className="r" style={{ color: clr(r.att) }}>{r.att != null ? r.att + '%' : ''}</td></tr>))}
        </tbody></table>
      </div>)}
    </>)}
  </div>);
}

function FeesPanel({ schoolId, classes, school, settings }) {
  const [mode, setMode] = useState('collect');
  const [classId, setClassId] = useState(''); const [term, setTerm] = useState(termOptions[0]);
  useEffect(() => { if (!classId && classes.length) setClassId(classes[0].id); }, [classes]);
  if (classes.length === 0) return <p className="muted">No classes yet  add them in the Classes tab first.</p>;
  const className = (classes.find(c => c.id === classId) || {}).name || '';
  return (<div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 180 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classId} onChange={e => setClassId(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className={mode === 'collect' ? '' : 'ghost'} onClick={() => setMode('collect')}>Collect & receipts</button>
        <button className={mode === 'arrears' ? '' : 'ghost'} onClick={() => setMode('arrears')}>Arrears</button>
        <button className={mode === 'setup' ? '' : 'ghost'} onClick={() => setMode('setup')}>Set fees</button>
      </div>
    </div>
    {mode === 'setup' ? <FeeSetup schoolId={schoolId} classId={classId} term={term} /> : mode === 'arrears' ? <FeeArrears schoolId={schoolId} term={term} classes={classes} school={school} settings={settings} /> : <FeeCollect schoolId={schoolId} classId={classId} term={term} className={className} school={school} settings={settings} />}
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
        <button onClick={add} disabled={busy}>{busy ? 'Adding' : 'Add'}</button>
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
  const [students, setLearners] = useState([]); const [items, setItems] = useState([]); const [payments, setPayments] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [pay, setPay] = useState({ amount: '', method: 'cash', reference: '', paid_on: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() {
    const { data: st } = await supabase.from('students').select('id,full_name').eq('school_id', schoolId).eq('class_id', classId).order('full_name'); setLearners(st || []);
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
    await supabase.from('finance_entries').insert({ school_id: schoolId, date: pay.paid_on, kind: 'income', category: 'Fees', description: (st ? st.full_name : '') + '  ' + term, amount: Number(pay.amount), fee_payment_id: ins ? ins.id : null });
    setPay({ amount: '', method: 'cash', reference: '', paid_on: new Date().toISOString().slice(0, 10) }); await load(); setBusy(false);
  }
  async function delPay(id) { await supabase.from('finance_entries').delete().eq('fee_payment_id', id); await supabase.from('fee_payments').delete().eq('id', id); await load(); }
  function printDoc(kind, student, lastPayment) {
    const paid = paidOf(student.id); const bal = due - paid;
    const itemRows = items.map(i => '<tr><td>' + esc(i.name) + '</td><td class=r>' + money(i.amount) + '</td></tr>').join('');
    const payRows = payments.filter(p => p.student_id === student.id).sort((a, b) => a.paid_on < b.paid_on ? -1 : 1).map(p => '<tr><td>' + esc(p.paid_on || '') + '</td><td>' + esc(p.method || '') + '</td><td>' + esc(p.reference || '') + '</td><td class=r>' + money(p.amount) + '</td></tr>').join('');
    let inner;
    if (kind === 'receipt' && lastPayment) {
      inner = '<h3 style="margin:0 0 8px">Receipt</h3><div class=m>' + esc(student.full_name) + '  ' + esc(className) + '  ' + esc(term) + '</div><table style="margin-top:12px;max-width:380px"><tbody><tr><td>Date</td><td class=r>' + esc(lastPayment.paid_on || '') + '</td></tr><tr><td>Method</td><td class=r>' + esc(lastPayment.method || '') + '</td></tr>' + (lastPayment.reference ? '<tr><td>Reference</td><td class=r>' + esc(lastPayment.reference) + '</td></tr>' : '') + '<tr><td><b>Amount paid</b></td><td class=r><b>' + money(lastPayment.amount) + '</b></td></tr><tr><td>Balance after</td><td class=r>' + money(bal) + '</td></tr></tbody></table>';
    } else {
      inner = '<h3 style="margin:0 0 8px">Fee statement</h3><div class=m>' + esc(student.full_name) + '  ' + esc(className) + '  ' + esc(term) + '</div><table style="margin-top:12px"><thead><tr><th>Fee item</th><th class=r>Amount</th></tr></thead><tbody>' + itemRows + '<tr><td><b>Total due</b></td><td class=r><b>' + money(due) + '</b></td></tr></tbody></table><table style="margin-top:14px"><thead><tr><th>Payment date</th><th>Method</th><th>Reference</th><th class=r>Amount</th></tr></thead><tbody>' + (payRows || '<tr><td colspan=4>No payments yet</td></tr>') + '<tr><td colspan=3><b>Total paid</b></td><td class=r><b>' + money(paid) + '</b></td></tr></tbody></table><div style="margin-top:14px;font-weight:700">Balance: ' + money(bal) + '</div>';
    }
    const html = '<html><head><title>' + (kind === 'receipt' ? 'Receipt' : 'Statement') + '</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}.m{color:#666;font-size:13px}</style></head><body>' + letterheadHtml(school, settings) + inner + '</body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  const openLearner = students.find(s => s.id === openId);
  const myPayments = openLearner ? payments.filter(p => p.student_id === openId).sort((a, b) => a.paid_on < b.paid_on ? 1 : -1) : [];
  return (<div>
    {due === 0 && <div style={{ background: '#fff8e1', border: '1px solid #f4d58a', color: '#8a6d1a', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14 }}>No fees set for this class/term yet  use "Set fees" to add them.</div>}
    <div className="muted" style={{ marginBottom: 10, fontSize: 14 }}>Fee due per pupil: <b>{money(due)}</b></div>
    <table><thead><tr><th>Learner</th><th className="r">Due</th><th className="r">Paid</th><th className="r">Balance</th><th></th></tr></thead><tbody>
      {students.map(s => { const paid = paidOf(s.id); const bal = due - paid; return (<tr key={s.id} onClick={() => { setOpenId(openId === s.id ? null : s.id); setErr(''); }} style={{ cursor: 'pointer', background: openId === s.id ? '#eafaf3' : 'transparent' }}><td className="strong">{s.full_name}</td><td className="r">{money(due)}</td><td className="r" style={{ color: '#1a7f5a' }}>{money(paid)}</td><td className="r" style={{ fontWeight: 600, color: bal <= 0 ? '#1a7f5a' : '#c0392b' }}>{money(bal)}</td><td className="r muted" style={{ fontSize: 13 }}>{openId === s.id ? 'Hide' : 'Open'}</td></tr>); })}
      {students.length === 0 && <tr><td colSpan="5" className="muted">No students in this class.</td></tr>}
    </tbody></table>
    {openLearner && (<div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{openLearner.full_name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" onClick={() => printDoc('statement', openLearner)}>Print statement</button>
          {myPayments.length > 0 && <button className="ghost" onClick={() => printDoc('receipt', openLearner, myPayments[0])}>Receipt (last)</button>}
        </div>
      </div>
      <div className="muted" style={{ fontSize: 13, margin: '2px 0 12px' }}>Due {money(due)}  Paid {money(paidOf(openLearner.id))}  Balance {money(due - paidOf(openLearner.id))}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div><label style={labelStyle}>Amount ($)</label><input style={inputStyle} value={pay.amount} onChange={e => setPay(o => ({ ...o, amount: e.target.value }))} placeholder="0" /></div>
        <div><label style={labelStyle}>Method</label><select style={inputStyle} value={pay.method} onChange={e => setPay(o => ({ ...o, method: e.target.value }))}><option value="cash">Cash</option><option value="bank">Bank</option><option value="paynow">Paynow</option></select></div>
        <div><label style={labelStyle}>Reference</label><input style={inputStyle} value={pay.reference} onChange={e => setPay(o => ({ ...o, reference: e.target.value }))} placeholder="optional" /></div>
        <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={pay.paid_on} onChange={e => setPay(o => ({ ...o, paid_on: e.target.value }))} /></div>
      </div>
      <div style={{ marginTop: 12 }}><button onClick={recordPay} disabled={busy}>{busy ? 'Saving' : 'Record payment'}</button></div>
      {err && <p className="error">{err}</p>}
      {myPayments.length > 0 && (<table style={{ marginTop: 16 }}><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th className="r">Amount</th><th></th></tr></thead><tbody>
        {myPayments.map(p => (<tr key={p.id}><td>{p.paid_on}</td><td style={{ textTransform: 'capitalize' }}>{p.method}</td><td className="muted">{p.reference || ''}</td><td className="r">{money(p.amount)}</td><td className="r"><button className="ghost" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => delPay(p.id)}>Delete</button></td></tr>))}
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
      <div style={{ marginTop: 12 }}><button onClick={add} disabled={busy}>{busy ? 'Saving' : 'Record'}</button></div>
      {err && <p className="error">{err}</p>}
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Note</th><th className="r">Amount</th><th></th></tr></thead><tbody>
      {txns.map(t => (<tr key={t.id}><td>{t.date}</td><td className="strong">{label(t.type)}</td><td className="muted">{t.note || ''}</td><td className="r">{money(t.amount)}</td><td className="r"><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => remove(t.id)}>Remove</button></td></tr>))}
      {txns.length === 0 && <tr><td colSpan="5" className="muted">No bank movements yet.</td></tr>}
    </tbody></table>
  </div>);
}

function ArrearsPanel({ schoolId, classes, school, settings }) {
  const [term, setTerm] = useState(termOptions[0]);
  const [classFilter, setClassFilter] = useState('all');
  const [students, setLearners] = useState([]); const [items, setItems] = useState([]); const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  async function load() {
    if (!schoolId) return; setLoading(true);
    const { data: st } = await supabase.from('students').select('id,full_name,class_id').eq('school_id', schoolId); setLearners(st || []);
    const { data: fi } = await supabase.from('fee_items').select('class_id,amount').eq('school_id', schoolId).eq('term', term); setItems(fi || []);
    const { data: fp } = await supabase.from('fee_payments').select('student_id,amount').eq('school_id', schoolId).eq('term', term); setPayments(fp || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [schoolId, term]);
  const money = n => '$' + Number(n || 0).toLocaleString();
  const clsName = id => { const c = classes.find(x => x.id === id); return c ? c.name : ''; };
  const dueByClass = {}; items.forEach(i => { dueByClass[i.class_id] = (dueByClass[i.class_id] || 0) + Number(i.amount || 0); });
  const paidByLearner = {}; payments.forEach(pp => { paidByLearner[pp.student_id] = (paidByLearner[pp.student_id] || 0) + Number(pp.amount || 0); });
  let rows = students.map(s => { const due = dueByClass[s.class_id] || 0; const paid = paidByLearner[s.id] || 0; return { id: s.id, name: s.full_name, cls: clsName(s.class_id), class_id: s.class_id, due, paid, bal: due - paid }; }).filter(r => r.bal > 0);
  if (classFilter !== 'all') rows = rows.filter(r => r.class_id === classFilter);
  rows.sort((a, b) => b.bal - a.bal);
  const totalOwed = rows.reduce((a, r) => a + r.bal, 0);
  function printReport() {
    const scope = classFilter === 'all' ? 'All classes' : clsName(classFilter);
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.cls) + '</td><td class=r>' + money(r.due) + '</td><td class=r>' + money(r.paid) + '</td><td class=r>' + money(r.bal) + '</td></tr>').join('');
    const html = '<html><head><title>Arrears</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:26px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}.m{color:#666;font-size:13px}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 4px">Arrears  ' + esc(term) + '</h3><div class=m>' + esc(scope) + '  ' + rows.length + ' pupil(s) owing</div><table style="margin-top:12px"><thead><tr><th>Learner</th><th>Class</th><th class=r>Due</th><th class=r>Paid</th><th class=r>Balance</th></tr></thead><tbody>' + body + '<tr><td colspan=4><b>Total owed</b></td><td class=r><b>' + money(totalOwed) + '</b></td></tr></tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  return (<div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 14, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 150 }}><label style={labelStyle}>Term</label><select style={inputStyle} value={term} onChange={e => setTerm(e.target.value)}>{termOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div style={{ minWidth: 180 }}><label style={labelStyle}>Class</label><select style={inputStyle} value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="all">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <button className="ghost" onClick={printReport} disabled={rows.length === 0}>Print</button>
    </div>
    {loading ? <p className="muted">Loading</p> : (<>
      <div className="muted" style={{ marginBottom: 10, fontSize: 14 }}>{rows.length} pupil(s) owing  Total owed: <b>{money(totalOwed)}</b></div>
      <table><thead><tr><th>Learner</th><th>Class</th><th className="r">Due</th><th className="r">Paid</th><th className="r">Balance</th></tr></thead><tbody>
        {rows.map(r => (<tr key={r.id}><td className="strong">{r.name}</td><td>{r.cls}</td><td className="r">{money(r.due)}</td><td className="r" style={{ color: '#1a7f5a' }}>{money(r.paid)}</td><td className="r" style={{ fontWeight: 600, color: '#c0392b' }}>{money(r.bal)}</td></tr>))}
        {rows.length === 0 && <tr><td colSpan="5" className="muted">No arrears  everyone is paid up for this term (or fees not set yet).</td></tr>}
      </tbody></table>
    </>)}
  </div>);
}

function FeeArrears({ schoolId, term, classes, school, settings }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { (async () => {
    const { data: st } = await supabase.from('students').select('id,full_name,class_id').eq('school_id', schoolId);
    const students = st || [];
    const { data: fi } = await supabase.from('fee_items').select('class_id,amount').eq('school_id', schoolId).eq('term', term);
    const items = fi || [];
    const ids = students.map(s => s.id);
    let pays = [];
    if (ids.length) { const { data: fp } = await supabase.from('fee_payments').select('student_id,amount').eq('term', term).in('student_id', ids); pays = fp || []; }
    const dueByClass = {}; items.forEach(i => { dueByClass[i.class_id] = (dueByClass[i.class_id] || 0) + Number(i.amount || 0); });
    const paidBy = {}; pays.forEach(p => { paidBy[p.student_id] = (paidBy[p.student_id] || 0) + Number(p.amount || 0); });
    const out = students.map(s => { const due = dueByClass[s.class_id] || 0; const paid = paidBy[s.id] || 0; return { name: s.full_name, class_id: s.class_id, due, paid, bal: due - paid }; }).filter(r => r.bal > 0).sort((a, b) => b.bal - a.bal);
    setRows(out);
  })(); }, [schoolId, term]);
  const money = n => '$' + Number(n || 0).toLocaleString();
  const clsName = id => { const c = classes.find(x => x.id === id); return c ? c.name : ''; };
  if (rows === null) return <p className="muted">Loading</p>;
  const total = rows.reduce((a, r) => a + r.bal, 0);
  function printArrears() {
    const body = rows.map(r => '<tr><td>' + esc(r.name) + '</td><td>' + esc(clsName(r.class_id)) + '</td><td class=r>' + money(r.due) + '</td><td class=r>' + money(r.paid) + '</td><td class=r>' + money(r.bal) + '</td></tr>').join('');
    const html = '<html><head><title>Arrears</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#1f2328}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}.r{text-align:right}</style></head><body>' + letterheadHtml(school, settings) + '<h3 style="margin:0 0 4px">Arrears  ' + esc(term) + '</h3><div style="color:#666;font-size:13px">' + rows.length + ' pupils owing  total ' + money(total) + '</div><table style="margin-top:12px"><thead><tr><th>Learner</th><th>Class</th><th class=r>Due</th><th class=r>Paid</th><th class=r>Balance</th></tr></thead><tbody>' + body + '<tr><td colspan=4><b>Total owed</b></td><td class=r><b>' + money(total) + '</b></td></tr></tbody></table></body></html>';
    const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print.'); return; } w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  }
  return (<div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
      <div className="muted" style={{ fontSize: 14 }}>{rows.length} pupil(s) owing  total <b style={{ color: '#c0392b' }}>{money(total)}</b>  {term}, all classes</div>
      <button className="ghost" onClick={printArrears} disabled={rows.length === 0}>Print</button>
    </div>
    <table><thead><tr><th>Learner</th><th>Class</th><th className="r">Due</th><th className="r">Paid</th><th className="r">Balance</th></tr></thead><tbody>
      {rows.map((r, i) => (<tr key={i}><td className="strong">{r.name}</td><td>{clsName(r.class_id)}</td><td className="r">{money(r.due)}</td><td className="r" style={{ color: '#1a7f5a' }}>{money(r.paid)}</td><td className="r" style={{ fontWeight: 600, color: '#c0392b' }}>{money(r.bal)}</td></tr>))}
      {rows.length === 0 && <tr><td colSpan="5" className="muted">No arrears  everyone is paid up for {term}.</td></tr>}
    </tbody></table>
  </div>);
}

function SubscriptionLock({ due }) {
  return (<div className="center"><div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>{ChalkMark(44)}</div>
    <h1 style={{ fontSize: 20 }}>Subscription overdue</h1>
    <p className="muted">Access to Chalkboard is paused because your school's subscription (due {due}) has not been paid. Please settle it to restore access, or contact your administrator.</p>
    <button className="ghost" onClick={() => supabase.auth.signOut()} style={{ marginTop: 12 }}>Sign out</button>
  </div></div>);
}

function BillingPanel() {
  const [rows, setRows] = useState([]); const [edit, setEdit] = useState(null); const [form, setForm] = useState({ amount: '', next_due: '' });
  async function load() {
    const { data: schools } = await supabase.from('schools').select('id,name').order('name');
    const { data: subs } = await supabase.from('subscriptions').select('*');
    const map = {}; (subs || []).forEach(x => { map[x.school_id] = x; });
    setRows((schools || []).map(sc => ({ id: sc.id, name: sc.name, sub: map[sc.id] || null })));
  }
  useEffect(() => { load(); }, []);
  const money = n => '$' + Number(n || 0).toLocaleString();
  const today = new Date().toISOString().slice(0, 10);
  function status(sub) {
    if (!sub || !sub.next_due) return { t: 'Not set', c: '#5b6570' };
    if (today <= sub.next_due) return { t: 'Current', c: '#1a7f5a' };
    const g = new Date(sub.next_due); g.setDate(g.getDate() + 7);
    if (today <= g.toISOString().slice(0, 10)) return { t: 'Overdue', c: '#b8860b' };
    return { t: 'Locked', c: '#c0392b' };
  }
  function startEdit(r) { setEdit(r.id); setForm({ amount: r.sub ? String(r.sub.amount) : '', next_due: (r.sub && r.sub.next_due) || '' }); }
  async function saveEdit() { await supabase.from('subscriptions').upsert({ school_id: edit, amount: Number(form.amount || 0), next_due: form.next_due || null, updated_at: new Date().toISOString() }, { onConflict: 'school_id' }); setEdit(null); await load(); }
  async function markPaid(r) {
    const amt = r.sub ? Number(r.sub.amount || 0) : 0;
    const base = (r.sub && r.sub.next_due) ? new Date(r.sub.next_due) : new Date();
    const nd = new Date(base); nd.setMonth(nd.getMonth() + 1);
    await supabase.from('subscription_payments').insert({ school_id: r.id, amount: amt, paid_on: today, method: 'manual' });
    await supabase.from('subscriptions').upsert({ school_id: r.id, amount: amt, next_due: nd.toISOString().slice(0, 10), last_paid: today, updated_at: new Date().toISOString() }, { onConflict: 'school_id' });
    await load();
  }
  const mrr = rows.reduce((a, r) => a + (r.sub ? Number(r.sub.amount || 0) : 0), 0);
  const overdue = rows.filter(r => { const st = status(r.sub); return st.t === 'Overdue' || st.t === 'Locked'; }).length;
  return (<div>
    <p className="muted" style={{ marginTop: 0 }}>Set each school's monthly subscription and next due date. Schools get reminders as it falls due, and are locked out if it stays unpaid past a 7-day grace period. This is our billing, separate from school fees.</p>
    <StatRow items={[{ value: money(mrr), label: 'Monthly recurring' }, { value: rows.length, label: 'Schools' }, { value: overdue, label: 'Overdue', color: overdue ? '#c0392b' : undefined }]} />
    <table><thead><tr><th>School</th><th className="r">Amount / mo</th><th>Next due</th><th>Status</th><th></th></tr></thead><tbody>
      {rows.map(r => { const st = status(r.sub); const isE = edit === r.id; return (<tr key={r.id}>
        <td className="strong">{r.name}</td>
        <td className="r">{isE ? <input style={{ ...inputStyle, margin: 0, width: 90 }} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /> : (r.sub ? money(r.sub.amount) : '')}</td>
        <td>{isE ? <input type="date" style={{ ...inputStyle, margin: 0 }} value={form.next_due} onChange={e => setForm(f => ({ ...f, next_due: e.target.value }))} /> : ((r.sub && r.sub.next_due) || '')}</td>
        <td style={{ color: st.c, fontWeight: 600 }}>{st.t}</td>
        <td className="r">{isE ? (<><button style={{ padding: '4px 10px', fontSize: 13 }} onClick={saveEdit}>Save</button> <button className="ghost" style={{ padding: '4px 10px', fontSize: 13, marginLeft: 6 }} onClick={() => setEdit(null)}>Cancel</button></>) : (<><button className="ghost" style={{ padding: '4px 10px', fontSize: 13 }} onClick={() => startEdit(r)}>Set</button> <button style={{ padding: '4px 10px', fontSize: 13, marginLeft: 6 }} onClick={() => markPaid(r)}>Mark paid</button></>)}</td>
      </tr>); })}
      {rows.length === 0 && <tr><td colSpan="5" className="muted">No schools yet.</td></tr>}
    </tbody></table>
  </div>);
}

function MeetingsPanel({ schoolId }) {
  const [meetings, setMeetings] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [form, setForm] = useState({
    title: '',
    meeting_type: 'management',
    meeting_date: new Date().toISOString().slice(0, 10),
    start_time: '',
    venue: '',
    chairperson: '',
    secretary: '',
    attendees: '',
    agenda: '',
    minutes: '',
  });
  const [resolution, setResolution] = useState({
    resolution_number: '',
    resolution: '',
    responsible_person: '',
    due_date: '',
  });
  const [err, setErr] = useState('');

  async function load() {
    const [meetingResult, resolutionResult] = await Promise.all([
      supabase.from('school_meetings').select('*').eq('school_id', schoolId).order('meeting_date', { ascending: false }),
      supabase.from('meeting_resolutions').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    ]);
    setMeetings(meetingResult.data || []);
    setResolutions(resolutionResult.data || []);
    if (meetingResult.error || resolutionResult.error) {
      setErr(meetingResult.error?.message || resolutionResult.error?.message);
    }
  }

  useEffect(() => { load(); }, [schoolId]);

  async function addMeeting() {
    if (!form.title.trim() || !form.meeting_date) {
      setErr('Enter a meeting title and date.');
      return;
    }
    const { error } = await supabase.from('school_meetings').insert({
      school_id: schoolId,
      ...form,
      start_time: form.start_time || null,
      venue: form.venue || null,
      chairperson: form.chairperson || null,
      secretary: form.secretary || null,
      attendees: form.attendees || null,
      agenda: form.agenda || null,
      minutes: form.minutes || null,
    });
    if (error) setErr(error.message);
    else {
      setForm({
        title: '',
        meeting_type: 'management',
        meeting_date: new Date().toISOString().slice(0, 10),
        start_time: '',
        venue: '',
        chairperson: '',
        secretary: '',
        attendees: '',
        agenda: '',
        minutes: '',
      });
      await load();
    }
  }

  async function addResolution() {
    if (!selectedMeeting || !resolution.resolution.trim()) {
      setErr('Select a meeting and enter the resolution.');
      return;
    }
    const { error } = await supabase.from('meeting_resolutions').insert({
      school_id: schoolId,
      meeting_id: selectedMeeting,
      ...resolution,
      due_date: resolution.due_date || null,
    });
    if (error) setErr(error.message);
    else {
      setResolution({
        resolution_number: '',
        resolution: '',
        responsible_person: '',
        due_date: '',
      });
      await load();
    }
  }

  async function updateResolution(id, status) {
    const { error } = await supabase
      .from('meeting_resolutions')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id);
    if (error) setErr(error.message);
    else await load();
  }

  return (
    <div>
      {err ? <p className="error">{err}</p> : null}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Record a meeting</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
          {[
            ['title','Meeting title'],
            ['venue','Venue'],
            ['chairperson','Chairperson'],
            ['secretary','Secretary'],
          ].map(([key,label]) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} value={form[key]} onChange={e=>setForm(x=>({...x,[key]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label style={labelStyle}>Meeting type</label>
            <select style={inputStyle} value={form.meeting_type} onChange={e=>setForm(x=>({...x,meeting_type:e.target.value}))}>
              {['management','staff','board','parents','finance','disciplinary','other'].map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={form.meeting_date} onChange={e=>setForm(x=>({...x,meeting_date:e.target.value}))}/>
          </div>
        </div>
        <label style={{...labelStyle,marginTop:10}}>Attendees</label>
        <textarea style={{...inputStyle,minHeight:60}} value={form.attendees} onChange={e=>setForm(x=>({...x,attendees:e.target.value}))}/>
        <label style={{...labelStyle,marginTop:10}}>Agenda</label>
        <textarea style={{...inputStyle,minHeight:80}} value={form.agenda} onChange={e=>setForm(x=>({...x,agenda:e.target.value}))}/>
        <label style={{...labelStyle,marginTop:10}}>Minutes</label>
        <textarea style={{...inputStyle,minHeight:120}} value={form.minutes} onChange={e=>setForm(x=>({...x,minutes:e.target.value}))}/>
        <button onClick={addMeeting} style={{marginTop:12}}>Save meeting</button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Add a resolution</h3>
        <select style={inputStyle} value={selectedMeeting} onChange={e=>setSelectedMeeting(e.target.value)}>
          <option value="">Select meeting</option>
          {meetings.map(m=><option key={m.id} value={m.id}>{m.meeting_date}  -  {m.title}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 10 }}>
          <input style={inputStyle} placeholder="Resolution number" value={resolution.resolution_number} onChange={e=>setResolution(x=>({...x,resolution_number:e.target.value}))}/>
          <input style={inputStyle} placeholder="Responsible person" value={resolution.responsible_person} onChange={e=>setResolution(x=>({...x,responsible_person:e.target.value}))}/>
        </div>
        <textarea style={{...inputStyle,minHeight:80,marginTop:10}} placeholder="Resolution" value={resolution.resolution} onChange={e=>setResolution(x=>({...x,resolution:e.target.value}))}/>
        <input type="date" style={{...inputStyle,width:'auto',marginTop:10}} value={resolution.due_date} onChange={e=>setResolution(x=>({...x,due_date:e.target.value}))}/>
        <br/>
        <button onClick={addResolution} style={{marginTop:10}}>Save resolution</button>
      </div>

      {meetings.map(m=>(
        <div className="card" key={m.id} style={{marginBottom:14}}>
          <strong>{m.title}</strong>
          <div className="muted">{m.meeting_date}  -  {m.meeting_type}  -  {m.venue || 'Venue not set'}</div>
          {m.minutes ? <p style={{whiteSpace:'pre-wrap'}}>{m.minutes}</p> : null}
          <div style={{marginTop:10}}>
            {resolutions.filter(r=>r.meeting_id===m.id).map(r=>(
              <div key={r.id} style={{padding:'10px 0',borderTop:'1px solid #e5e7eb'}}>
                <strong>{r.resolution_number || 'Resolution'}</strong>: {r.resolution}
                <div className="muted">Owner: {r.responsible_person || '-'}  -  Due: {r.due_date || '-'}  -  Status: {r.status}</div>
                {r.status !== 'completed' ? <button onClick={()=>updateResolution(r.id,'completed')} style={{marginTop:6}}>Mark completed</button> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsPanel({ schoolId }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category: 'school',
    start_date: new Date().toISOString().slice(0,10),
    end_date: '',
    venue: '',
    audience: '',
    organiser: '',
    description: '',
  });
  const [err, setErr] = useState('');

  async function load() {
    const { data, error } = await supabase.from('school_events').select('*').eq('school_id',schoolId).order('start_date');
    setEvents(data || []);
    if (error) setErr(error.message);
  }
  useEffect(()=>{load()},[schoolId]);

  async function addEvent() {
    if (!form.title.trim() || !form.start_date) { setErr('Enter an event title and date.'); return; }
    const { error } = await supabase.from('school_events').insert({
      school_id: schoolId,
      ...form,
      end_date: form.end_date || null,
      venue: form.venue || null,
      audience: form.audience || null,
      organiser: form.organiser || null,
      description: form.description || null,
    });
    if (error) setErr(error.message);
    else {
      setForm({title:'',category:'school',start_date:new Date().toISOString().slice(0,10),end_date:'',venue:'',audience:'',organiser:'',description:''});
      await load();
    }
  }

  return <div>
    {err ? <p className="error">{err}</p> : null}
    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Add event</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <input style={inputStyle} placeholder="Event title" value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))}/>
        <select style={inputStyle} value={form.category} onChange={e=>setForm(x=>({...x,category:e.target.value}))}>
          {['sports','academic','staff','community','parents','holiday','school','other'].map(x=><option key={x} value={x}>{x}</option>)}
        </select>
        <input type="date" style={inputStyle} value={form.start_date} onChange={e=>setForm(x=>({...x,start_date:e.target.value}))}/>
        <input type="date" style={inputStyle} value={form.end_date} onChange={e=>setForm(x=>({...x,end_date:e.target.value}))}/>
        <input style={inputStyle} placeholder="Venue" value={form.venue} onChange={e=>setForm(x=>({...x,venue:e.target.value}))}/>
        <input style={inputStyle} placeholder="Audience" value={form.audience} onChange={e=>setForm(x=>({...x,audience:e.target.value}))}/>
        <input style={inputStyle} placeholder="Organiser" value={form.organiser} onChange={e=>setForm(x=>({...x,organiser:e.target.value}))}/>
      </div>
      <textarea style={{...inputStyle,minHeight:80,marginTop:10}} placeholder="Description" value={form.description} onChange={e=>setForm(x=>({...x,description:e.target.value}))}/>
      <button onClick={addEvent} style={{marginTop:10}}>Save event</button>
    </div>
    <div style={{display:'grid',gap:12}}>
      {events.map(e=><article className="card" key={e.id}>
        <strong>{e.title}</strong>
        <div className="muted">{e.start_date}{e.end_date ? ` to ${e.end_date}` : ''}  -  {e.category}  -  {e.venue || 'Venue not set'}</div>
        {e.description ? <p>{e.description}</p> : null}
      </article>)}
    </div>
  </div>
}

function ContractorsPanel({ schoolId }) {
  const [contractors,setContractors]=useState([]);
  const [payments,setPayments]=useState([]);
  const [form,setForm]=useState({contractor_name:'',company_name:'',service_type:'',phone:'',email:'',contract_reference:'',contract_start:'',contract_end:'',contract_value:'',payment_terms:'',notes:''});
  const [payment,setPayment]=useState({contractor_id:'',payment_date:new Date().toISOString().slice(0,10),amount:'',payment_method:'bank',reference:'',description:'',approved_by:''});
  const [err,setErr]=useState('');

  async function load(){
    const [c,p]=await Promise.all([
      supabase.from('school_contractors').select('*').eq('school_id',schoolId).order('contractor_name'),
      supabase.from('contractor_payments').select('*').eq('school_id',schoolId).order('payment_date',{ascending:false}),
    ]);
    setContractors(c.data||[]);setPayments(p.data||[]);
    if(c.error||p.error)setErr(c.error?.message||p.error?.message);
  }
  useEffect(()=>{load()},[schoolId]);

  async function addContractor(){
    if(!form.contractor_name.trim()||!form.service_type.trim()){setErr('Enter contractor name and service type.');return}
    const {error}=await supabase.from('school_contractors').insert({
      school_id:schoolId,
      ...form,
      contract_start:form.contract_start||null,
      contract_end:form.contract_end||null,
      contract_value:form.contract_value?Number(form.contract_value):null,
    });
    if(error)setErr(error.message);else{
      setForm({contractor_name:'',company_name:'',service_type:'',phone:'',email:'',contract_reference:'',contract_start:'',contract_end:'',contract_value:'',payment_terms:'',notes:''});
      await load();
    }
  }

  async function addPayment(){
    if(!payment.contractor_id||!payment.amount){setErr('Select a contractor and enter an amount.');return}
    const {error}=await supabase.from('contractor_payments').insert({
      school_id:schoolId,
      ...payment,
      amount:Number(payment.amount),
      reference:payment.reference||null,
      description:payment.description||null,
      approved_by:payment.approved_by||null,
    });
    if(error)setErr(error.message);else{
      setPayment({contractor_id:'',payment_date:new Date().toISOString().slice(0,10),amount:'',payment_method:'bank',reference:'',description:'',approved_by:''});
      await load();
    }
  }

  function paid(id){return payments.filter(p=>p.contractor_id===id).reduce((s,p)=>s+Number(p.amount||0),0)}

  return <div>
    {err?<p className="error">{err}</p>:null}
    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Add contractor</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        {[
          ['contractor_name','Contractor name'],
          ['company_name','Company'],
          ['service_type','Service type'],
          ['phone','Phone'],
          ['email','Email'],
          ['contract_reference','Contract reference'],
          ['payment_terms','Payment terms'],
        ].map(([k,l])=><input key={k} style={inputStyle} placeholder={l} value={form[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>)}
        <input type="date" style={inputStyle} value={form.contract_start} onChange={e=>setForm(x=>({...x,contract_start:e.target.value}))}/>
        <input type="date" style={inputStyle} value={form.contract_end} onChange={e=>setForm(x=>({...x,contract_end:e.target.value}))}/>
        <input type="number" style={inputStyle} placeholder="Contract value" value={form.contract_value} onChange={e=>setForm(x=>({...x,contract_value:e.target.value}))}/>
      </div>
      <textarea style={{...inputStyle,minHeight:70,marginTop:10}} placeholder="Notes" value={form.notes} onChange={e=>setForm(x=>({...x,notes:e.target.value}))}/>
      <button onClick={addContractor} style={{marginTop:10}}>Save contractor</button>
    </div>

    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Record contractor payment</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <select style={inputStyle} value={payment.contractor_id} onChange={e=>setPayment(x=>({...x,contractor_id:e.target.value}))}>
          <option value="">Select contractor</option>
          {contractors.map(c=><option key={c.id} value={c.id}>{c.contractor_name}</option>)}
        </select>
        <input type="date" style={inputStyle} value={payment.payment_date} onChange={e=>setPayment(x=>({...x,payment_date:e.target.value}))}/>
        <input type="number" style={inputStyle} placeholder="Amount" value={payment.amount} onChange={e=>setPayment(x=>({...x,amount:e.target.value}))}/>
        <select style={inputStyle} value={payment.payment_method} onChange={e=>setPayment(x=>({...x,payment_method:e.target.value}))}>
          {['bank','cash','mobile_money','cheque','other'].map(x=><option key={x} value={x}>{x.replace('_',' ')}</option>)}
        </select>
        <input style={inputStyle} placeholder="Reference" value={payment.reference} onChange={e=>setPayment(x=>({...x,reference:e.target.value}))}/>
        <input style={inputStyle} placeholder="Approved by" value={payment.approved_by} onChange={e=>setPayment(x=>({...x,approved_by:e.target.value}))}/>
      </div>
      <input style={{...inputStyle,marginTop:10}} placeholder="Payment description" value={payment.description} onChange={e=>setPayment(x=>({...x,description:e.target.value}))}/>
      <button onClick={addPayment} style={{marginTop:10}}>Record payment</button>
    </div>

    <div style={{display:'grid',gap:12}}>
      {contractors.map(c=>{
        const total=paid(c.id);
        const balance=c.contract_value!=null?Number(c.contract_value)-total:null;
        return <article className="card" key={c.id}>
          <strong>{c.contractor_name}</strong>
          <div className="muted">{c.company_name||''}  -  {c.service_type}  -  {c.status}</div>
          <div style={{marginTop:8}}>Contract value: {c.contract_value!=null?Number(c.contract_value).toLocaleString():'Not set'}  -  Paid: {total.toLocaleString()}  -  Balance: {balance!=null?balance.toLocaleString():'-'}</div>
        </article>
      })}
    </div>
  </div>
}

function FinanceDocumentsPanel({ schoolId, school, settings }) {
  const [tab, setTab] = useState('invoices');
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [err, setErr] = useState('');
  const [invoice, setInvoice] = useState({
    student_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0,10),
    due_date: '',
    issued_to: '',
    email: '',
    phone: '',
    description: '',
    amount: '',
    currency: settings?.currency || 'USD',
    notes: '',
  });
  const [receipt, setReceipt] = useState({
    student_id: '',
    invoice_id: '',
    receipt_number: '',
    receipt_date: new Date().toISOString().slice(0,10),
    received_from: '',
    email: '',
    phone: '',
    amount: '',
    currency: settings?.currency || 'USD',
    payment_method: 'cash',
    payment_reference: '',
    description: '',
    notes: '',
  });

  async function load() {
    const [studentResult, invoiceResult, receiptResult] = await Promise.all([
      supabase.from('students').select('id,full_name').eq('school_id',schoolId).order('full_name'),
      supabase.from('school_invoices').select('*').eq('school_id',schoolId).order('invoice_date',{ascending:false}),
      supabase.from('school_receipts').select('*').eq('school_id',schoolId).order('receipt_date',{ascending:false}),
    ]);
    setStudents(studentResult.data || []);
    setInvoices(invoiceResult.data || []);
    setReceipts(receiptResult.data || []);
    if (studentResult.error || invoiceResult.error || receiptResult.error) {
      setErr(studentResult.error?.message || invoiceResult.error?.message || receiptResult.error?.message);
    }
  }

  useEffect(()=>{ load(); },[schoolId]);

  function nextNumber(prefix, rows, column) {
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(rows.length + 1).padStart(4,'0')}`;
  }

  function selectStudent(id, kind) {
    const student = students.find(item=>item.id===id);
    if (kind === 'invoice') {
      setInvoice(x=>({
        ...x,
        student_id:id,
        issued_to:student?.full_name || '',
        email:'',
        phone:'',
      }));
    } else {
      setReceipt(x=>({
        ...x,
        student_id:id,
        received_from:student?.full_name || '',
        email:'',
        phone:'',
      }));
    }
  }

  async function createInvoice() {
    if (!invoice.issued_to.trim() || !invoice.amount) {
      setErr('Enter the recipient and invoice amount.');
      return;
    }
    const amount = Number(invoice.amount);
    const number = invoice.invoice_number || nextNumber('INV', invoices, 'invoice_number');
    const { error } = await supabase.from('school_invoices').insert({
      school_id:schoolId,
      student_id:invoice.student_id || null,
      invoice_number:number,
      invoice_date:invoice.invoice_date,
      due_date:invoice.due_date || null,
      issued_to:invoice.issued_to,
      email:invoice.email || null,
      phone:invoice.phone || null,
      description:invoice.description || null,
      line_items:[{description:invoice.description || 'School charges',quantity:1,unit_price:amount,amount}],
      subtotal:amount,
      total:amount,
      currency:invoice.currency,
      status:'issued',
      notes:invoice.notes || null,
    });
    if (error) setErr(error.message);
    else {
      setInvoice({...invoice,student_id:'',invoice_number:'',issued_to:'',email:'',phone:'',description:'',amount:'',due_date:'',notes:''});
      await load();
    }
  }

  async function createReceipt() {
    if (!receipt.received_from.trim() || !receipt.amount) {
      setErr('Enter who paid and the receipt amount.');
      return;
    }
    const number = receipt.receipt_number || nextNumber('RCT', receipts, 'receipt_number');
    const amount = Number(receipt.amount);
    const { data:created, error } = await supabase.from('school_receipts').insert({
      school_id:schoolId,
      student_id:receipt.student_id || null,
      invoice_id:receipt.invoice_id || null,
      receipt_number:number,
      receipt_date:receipt.receipt_date,
      received_from:receipt.received_from,
      email:receipt.email || null,
      phone:receipt.phone || null,
      amount,
      currency:receipt.currency,
      payment_method:receipt.payment_method,
      payment_reference:receipt.payment_reference || null,
      description:receipt.description || null,
      notes:receipt.notes || null,
    }).select().single();

    if (error) setErr(error.message);
    else {
      if (receipt.invoice_id) {
        const linked = invoices.find(item=>item.id===receipt.invoice_id);
        if (linked) {
          const paid = Number(linked.amount_paid || 0) + amount;
          await supabase.from('school_invoices').update({
            amount_paid:paid,
            status:paid >= Number(linked.total || 0) ? 'paid' : 'part_paid',
          }).eq('id',linked.id);
        }
      }
      setReceipt({...receipt,student_id:'',invoice_id:'',receipt_number:'',received_from:'',email:'',phone:'',amount:'',payment_reference:'',description:'',notes:''});
      await load();
    }
  }

  function documentHtml(type, row) {
    const isInvoice = type === 'invoice';
    const number = isInvoice ? row.invoice_number : row.receipt_number;
    const date = isInvoice ? row.invoice_date : row.receipt_date;
    const person = isInvoice ? row.issued_to : row.received_from;
    const amount = isInvoice ? row.total : row.amount;
    return `
      <html><head><title>${number}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1f2937}
        .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #096df3;padding-bottom:20px}
        h1{color:#041a4d;margin:0}.box{margin-top:28px}.total{font-size:24px;font-weight:700;color:#041a4d}
        table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}
      </style></head><body>
      <div class="head"><div><h1>${school?.name || 'School'}</h1><div>${school?.address || ''}</div></div><div><strong>${isInvoice ? 'INVOICE' : 'RECEIPT'}</strong><br>${number}<br>${date}</div></div>
      <div class="box"><strong>${isInvoice ? 'Issued to' : 'Received from'}:</strong> ${person}</div>
      <table><tr><th>Description</th><th>Amount</th></tr><tr><td>${row.description || (isInvoice ? 'School charges' : 'Payment received')}</td><td>${row.currency} ${Number(amount).toFixed(2)}</td></tr></table>
      <p class="total">Total: ${row.currency} ${Number(amount).toFixed(2)}</p>
      ${isInvoice && row.due_date ? `<p>Due date: ${row.due_date}</p>` : ''}
      ${!isInvoice ? `<p>Payment method: ${row.payment_method || '-'}</p><p>Reference: ${row.payment_reference || '-'}</p>` : ''}
      <p>${row.notes || ''}</p>
      </body></html>`;
  }

  async function logDelivery(type,row,method,recipient) {
    await supabase.from('school_document_deliveries').insert({
      school_id:schoolId,
      document_type:type,
      document_id:row.id,
      delivery_method:method,
      recipient:recipient || null,
      status:'prepared',
    });
  }

  function printDoc(type,row) {
    const win = window.open('', '_blank');
    win.document.write(documentHtml(type,row));
    win.document.close();
    win.focus();
    win.print();
    logDelivery(type,row,'print','');
  }

  function emailDoc(type,row) {
    const number = type==='invoice' ? row.invoice_number : row.receipt_number;
    const person = type==='invoice' ? row.issued_to : row.received_from;
    const amount = type==='invoice' ? row.total : row.amount;
    const subject = encodeURIComponent(`${type==='invoice'?'Invoice':'Receipt'} ${number} from ${school?.name || 'School'}`);
    const body = encodeURIComponent(
      `Dear ${person},\n\nPlease find your ${type} details below:\nNumber: ${number}\nAmount: ${row.currency} ${Number(amount).toFixed(2)}\n${type==='invoice'&&row.due_date?`Due date: ${row.due_date}\n`:''}\nRegards,\n${school?.name || 'School'}`
    );
    logDelivery(type,row,'email',row.email);
    window.location.href = `mailto:${row.email || ''}?subject=${subject}&body=${body}`;
  }

  function whatsappDoc(type,row) {
    const number = type==='invoice' ? row.invoice_number : row.receipt_number;
    const amount = type==='invoice' ? row.total : row.amount;
    const text = encodeURIComponent(`${school?.name || 'School'} ${type}: ${number}. Amount: ${row.currency} ${Number(amount).toFixed(2)}.`);
    const phone = String(row.phone || '').replace(/\D/g,'');
    logDelivery(type,row,'whatsapp',phone);
    window.open(`https://wa.me/${phone}?text=${text}`,'_blank');
  }

  return <div>
    <div style={{display:'flex',gap:8,marginBottom:18}}>
      <button className={tab==='invoices'?'':'ghost'} onClick={()=>setTab('invoices')}>Invoices</button>
      <button className={tab==='receipts'?'':'ghost'} onClick={()=>setTab('receipts')}>Receipts</button>
    </div>
    {err?<p className="error">{err}</p>:null}

    {tab==='invoices'?<div>
      <div className="card" style={{marginBottom:18}}>
        <h3 style={{marginTop:0}}>Create invoice</h3>
        <select style={inputStyle} value={invoice.student_id} onChange={e=>selectStudent(e.target.value,'invoice')}>
          <option value="">Select learner or enter recipient manually</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:10}}>
          {[
            ['invoice_number','Invoice number (automatic if blank)'],
            ['issued_to','Issued to'],
            ['email','Email'],
            ['phone','Phone'],
            ['description','Description'],
            ['amount','Amount'],
          ].map(([k,l])=><input key={k} type={k==='amount'?'number':'text'} style={inputStyle} placeholder={l} value={invoice[k]} onChange={e=>setInvoice(x=>({...x,[k]:e.target.value}))}/>)}
          <input type="date" style={inputStyle} value={invoice.invoice_date} onChange={e=>setInvoice(x=>({...x,invoice_date:e.target.value}))}/>
          <input type="date" style={inputStyle} value={invoice.due_date} onChange={e=>setInvoice(x=>({...x,due_date:e.target.value}))}/>
        </div>
        <button onClick={createInvoice} style={{marginTop:12}}>Issue invoice</button>
      </div>
      {invoices.map(row=><article className="card" key={row.id} style={{marginBottom:12}}>
        <strong>{row.invoice_number}</strong>  -  {row.issued_to}
        <div className="muted">{row.invoice_date}  -  {row.currency} {Number(row.total).toFixed(2)}  -  Balance {row.currency} {Number(row.balance).toFixed(2)}  -  {row.status}</div>
        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
          <button onClick={()=>printDoc('invoice',row)}>Print / Save PDF</button>
          <button className="ghost" onClick={()=>emailDoc('invoice',row)}>Email</button>
          <button className="ghost" onClick={()=>whatsappDoc('invoice',row)}>WhatsApp</button>
        </div>
      </article>)}
    </div>:null}

    {tab==='receipts'?<div>
      <div className="card" style={{marginBottom:18}}>
        <h3 style={{marginTop:0}}>Create receipt</h3>
        <select style={inputStyle} value={receipt.student_id} onChange={e=>selectStudent(e.target.value,'receipt')}>
          <option value="">Select learner or enter payer manually</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <select style={{...inputStyle,marginTop:10}} value={receipt.invoice_id} onChange={e=>setReceipt(x=>({...x,invoice_id:e.target.value}))}>
          <option value="">Optional: link to invoice</option>
          {invoices.filter(i=>i.status!=='paid'&&i.status!=='void').map(i=><option key={i.id} value={i.id}>{i.invoice_number}  -  {i.issued_to}</option>)}
        </select>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:10}}>
          {[
            ['receipt_number','Receipt number (automatic if blank)'],
            ['received_from','Received from'],
            ['email','Email'],
            ['phone','Phone'],
            ['amount','Amount'],
            ['payment_reference','Payment reference'],
            ['description','Description'],
          ].map(([k,l])=><input key={k} type={k==='amount'?'number':'text'} style={inputStyle} placeholder={l} value={receipt[k]} onChange={e=>setReceipt(x=>({...x,[k]:e.target.value}))}/>)}
          <input type="date" style={inputStyle} value={receipt.receipt_date} onChange={e=>setReceipt(x=>({...x,receipt_date:e.target.value}))}/>
          <select style={inputStyle} value={receipt.payment_method} onChange={e=>setReceipt(x=>({...x,payment_method:e.target.value}))}>
            {['cash','bank','mobile_money','card','cheque','other'].map(x=><option key={x} value={x}>{x.replace('_',' ')}</option>)}
          </select>
        </div>
        <button onClick={createReceipt} style={{marginTop:12}}>Issue receipt</button>
      </div>
      {receipts.map(row=><article className="card" key={row.id} style={{marginBottom:12}}>
        <strong>{row.receipt_number}</strong>  -  {row.received_from}
        <div className="muted">{row.receipt_date}  -  {row.currency} {Number(row.amount).toFixed(2)}  -  {row.payment_method || '-'}</div>
        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
          <button onClick={()=>printDoc('receipt',row)}>Print / Save PDF</button>
          <button className="ghost" onClick={()=>emailDoc('receipt',row)}>Email</button>
          <button className="ghost" onClick={()=>whatsappDoc('receipt',row)}>WhatsApp</button>
        </div>
      </article>)}
    </div>:null}
  </div>
}

function PettyCashPanel({ schoolId }) {
  const [rows,setRows]=useState([]);
  const [form,setForm]=useState({
    transaction_date:new Date().toISOString().slice(0,10),
    transaction_type:'expense',
    category:'',
    description:'',
    amount:'',
    currency:'USD',
    reference:'',
    payee:'',
    requested_by:'',
    approved_by:'',
    receipt_reference:'',
    notes:'',
  });
  const [err,setErr]=useState('');

  async function load(){
    const {data,error}=await supabase.from('petty_cash_transactions').select('*').eq('school_id',schoolId).order('transaction_date',{ascending:false}).order('created_at',{ascending:false});
    setRows(data||[]);
    if(error)setErr(error.message);
  }
  useEffect(()=>{load()},[schoolId]);

  async function save(){
    if(!form.description.trim()||!form.amount){setErr('Enter a description and amount.');return}
    const {error}=await supabase.from('petty_cash_transactions').insert({
      school_id:schoolId,
      ...form,
      amount:Number(form.amount),
      category:form.category||null,
      reference:form.reference||null,
      payee:form.payee||null,
      requested_by:form.requested_by||null,
      approved_by:form.approved_by||null,
      receipt_reference:form.receipt_reference||null,
      notes:form.notes||null,
    });
    if(error)setErr(error.message);else{
      setForm({...form,description:'',amount:'',category:'',reference:'',payee:'',requested_by:'',approved_by:'',receipt_reference:'',notes:''});
      await load();
    }
  }

  const cashIn=rows.filter(r=>['opening_balance','cash_in','reimbursement','adjustment'].includes(r.transaction_type)).reduce((s,r)=>s+Number(r.amount||0),0);
  const cashOut=rows.filter(r=>r.transaction_type==='expense').reduce((s,r)=>s+Number(r.amount||0),0);
  const balance=cashIn-cashOut;

  return <div>
    {err?<p className="error">{err}</p>:null}
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginBottom:18}}>
      {[['Cash in',cashIn],['Cash out',cashOut],['Balance',balance]].map(([l,v])=><div className="card" key={l}><div style={{fontSize:28,fontWeight:800}}>{Number(v).toFixed(2)}</div><div className="muted">{l}</div></div>)}
    </div>
    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Record petty cash transaction</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <input type="date" style={inputStyle} value={form.transaction_date} onChange={e=>setForm(x=>({...x,transaction_date:e.target.value}))}/>
        <select style={inputStyle} value={form.transaction_type} onChange={e=>setForm(x=>({...x,transaction_type:e.target.value}))}>
          {['opening_balance','cash_in','expense','reimbursement','adjustment'].map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}
        </select>
        {[
          ['category','Category'],
          ['description','Description'],
          ['amount','Amount'],
          ['reference','Reference'],
          ['payee','Payee'],
          ['requested_by','Requested by'],
          ['approved_by','Approved by'],
          ['receipt_reference','Receipt number'],
        ].map(([k,l])=><input key={k} type={k==='amount'?'number':'text'} style={inputStyle} placeholder={l} value={form[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>)}
      </div>
      <textarea style={{...inputStyle,minHeight:70,marginTop:10}} placeholder="Notes" value={form.notes} onChange={e=>setForm(x=>({...x,notes:e.target.value}))}/>
      <button onClick={save} style={{marginTop:10}}>Save transaction</button>
    </div>
    <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Payee</th><th className="r">Amount</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.id}><td>{r.transaction_date}</td><td>{r.transaction_type.replaceAll('_',' ')}</td><td>{r.description}</td><td>{r.payee||'-'}</td><td className="r">{r.currency} {Number(r.amount).toFixed(2)}</td></tr>)}</tbody></table>
  </div>
}

function BudgetPanel({ schoolId, settings }) {
  const currentYear = new Date().getFullYear();

  const [budgets, setBudgets] = useState([]);
  const [activeBudgetId, setActiveBudgetId] = useState('');
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState('');

  const [budgetForm, setBudgetForm] = useState({
    financial_year: currentYear,
    title: `${currentYear} Annual Budget`,
    currency: settings?.currency || 'USD',
    projected_learner_count: 0,
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-12-31`,
    notes: '',
  });

  const [lineForm, setLineForm] = useState({
    line_type: 'income',
    category: 'Fees and levies',
    subcategory: '',
    source_type: 'fees',
    description: '',
    quantity: 1,
    unit_rate: 0,
    periods: 1,
    assumptions: '',
  });

  const activeBudget =
    budgets.find(item => item.id === activeBudgetId) || null;

  async function load() {
    const { data: budgetRows, error: budgetError } = await supabase
      .from('school_budgets')
      .select('*')
      .eq('school_id', schoolId)
      .order('financial_year', { ascending: false })
      .order('version', { ascending: false });

    if (budgetError) {
      setErr(budgetError.message);
      return;
    }

    setBudgets(budgetRows || []);

    const selected =
      activeBudgetId ||
      budgetRows?.[0]?.id ||
      '';

    if (!activeBudgetId && selected) {
      setActiveBudgetId(selected);
    }

    if (selected) {
      const { data: lineRows, error: lineError } = await supabase
        .from('school_budget_lines')
        .select('*')
        .eq('budget_id', selected)
        .order('line_type')
        .order('sort_order')
        .order('created_at');

      if (lineError) setErr(lineError.message);
      else setLines(lineRows || []);
    } else {
      setLines([]);
    }
  }

  useEffect(() => {
    load();
  }, [schoolId, activeBudgetId]);

  async function createBudget() {
    if (
      !budgetForm.title.trim() ||
      !budgetForm.financial_year
    ) {
      setErr('Enter a title and financial year.');
      return;
    }

    const sameYear = budgets.filter(
      item =>
        Number(item.financial_year) ===
        Number(budgetForm.financial_year)
    );

    const nextVersion =
      sameYear.length > 0
        ? Math.max(
            ...sameYear.map(item =>
              Number(item.version || 1)
            )
          ) + 1
        : 1;

    const { data, error } = await supabase
      .from('school_budgets')
      .insert({
        school_id: schoolId,
        financial_year:
          Number(budgetForm.financial_year),
        version: nextVersion,
        title: budgetForm.title.trim(),
        currency: budgetForm.currency,
        status: 'draft',
        start_date:
          budgetForm.start_date || null,
        end_date:
          budgetForm.end_date || null,
        projected_learner_count:
          Number(
            budgetForm.projected_learner_count ||
              0
          ),
        notes: budgetForm.notes || null,
      })
      .select()
      .single();

    if (error) {
      setErr(error.message);
      return;
    }

    setActiveBudgetId(data.id);
    await load();
  }

  async function addLine() {
    if (
      !activeBudgetId ||
      !lineForm.description.trim()
    ) {
      setErr(
        'Select a budget and enter a line description.'
      );
      return;
    }

    if (
      activeBudget &&
      ['approved', 'locked', 'archived'].includes(
        activeBudget.status
      )
    ) {
      setErr(
        'This budget cannot be changed in its current status.'
      );
      return;
    }

    const { error } = await supabase
      .from('school_budget_lines')
      .insert({
        budget_id: activeBudgetId,
        school_id: schoolId,
        line_type: lineForm.line_type,
        category: lineForm.category,
        subcategory:
          lineForm.subcategory || null,
        source_type:
          lineForm.source_type || null,
        description:
          lineForm.description.trim(),
        quantity: Number(
          lineForm.quantity || 0
        ),
        unit_rate: Number(
          lineForm.unit_rate || 0
        ),
        periods: Number(
          lineForm.periods || 0
        ),
        assumptions:
          lineForm.assumptions || null,
        sort_order: lines.length + 1,
      });

    if (error) {
      setErr(error.message);
      return;
    }

    setLineForm(current => ({
      ...current,
      subcategory: '',
      description: '',
      unit_rate: 0,
      assumptions: '',
    }));

    await load();
  }

  async function removeLine(id) {
    if (
      activeBudget &&
      ['approved', 'locked', 'archived'].includes(
        activeBudget.status
      )
    ) {
      setErr(
        'This budget cannot be changed in its current status.'
      );
      return;
    }

    const { error } = await supabase
      .from('school_budget_lines')
      .delete()
      .eq('id', id);

    if (error) setErr(error.message);
    else await load();
  }

  async function changeStatus(status) {
    if (!activeBudgetId) return;

    const update = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'submitted') {
      update.submitted_at =
        new Date().toISOString();
    }

    if (status === 'approved') {
      update.approved_at =
        new Date().toISOString();
    }

    const { error } = await supabase
      .from('school_budgets')
      .update(update)
      .eq('id', activeBudgetId);

    if (error) {
      setErr(error.message);
      return;
    }

    await supabase
      .from('school_budget_approvals')
      .insert({
        budget_id: activeBudgetId,
        school_id: schoolId,
        action: status,
      });

    await load();
  }

  function createFeeProjection() {
    setLineForm({
      line_type: 'income',
      category: 'Fees and levies',
      subcategory: 'School fees',
      source_type: 'fees',
      description: 'Projected school fee income',
      quantity:
        activeBudget?.projected_learner_count ||
        budgetForm.projected_learner_count ||
        0,
      unit_rate: 0,
      periods: 3,
      assumptions:
        'Projected learners  -  fee per learner  -  school terms',
    });
  }

  function createLevyProjection() {
    setLineForm({
      line_type: 'income',
      category: 'Fees and levies',
      subcategory: 'Levy',
      source_type: 'levy',
      description: 'Projected levy income',
      quantity:
        activeBudget?.projected_learner_count ||
        budgetForm.projected_learner_count ||
        0,
      unit_rate: 0,
      periods: 1,
      assumptions:
        'Projected learners  -  annual levy',
    });
  }

  const income = lines
    .filter(item => item.line_type === 'income')
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const expenses = lines
    .filter(item => item.line_type === 'expense')
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const surplus = income - expenses;

  const expenseCategories = lines
    .filter(item => item.line_type === 'expense')
    .reduce((groups, item) => {
      groups[item.category] =
        (groups[item.category] || 0) +
        Number(item.amount || 0);
      return groups;
    }, {});

  const incomeCategories = [
    'Fees and levies',
    'Grants and donations',
    'Fundraising',
    'Facility income',
    'Other income',
  ];

  const expenseCategoryOptions = [
    'Staffing',
    'Teaching and learning',
    'Utilities',
    'Maintenance',
    'Administration',
    'Sports and activities',
    'Transport',
    'Technology',
    'Capital expenditure',
    'Finance costs',
    'Contingency',
    'Other expenses',
  ];

  return (
    <div>
      {err ? <p className="error">{err}</p> : null}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>
          Create annual budget
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 10,
          }}
        >
          <input
            type="number"
            style={inputStyle}
            value={budgetForm.financial_year}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                financial_year:
                  event.target.value,
              }))
            }
            placeholder="Financial year"
          />

          <input
            style={inputStyle}
            value={budgetForm.title}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Budget title"
          />

          <input
            type="number"
            style={inputStyle}
            value={
              budgetForm.projected_learner_count
            }
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                projected_learner_count:
                  event.target.value,
              }))
            }
            placeholder="Projected learner count"
          />

          <input
            style={inputStyle}
            value={budgetForm.currency}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                currency: event.target.value,
              }))
            }
            placeholder="Currency"
          />

          <input
            type="date"
            style={inputStyle}
            value={budgetForm.start_date}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                start_date:
                  event.target.value,
              }))
            }
          />

          <input
            type="date"
            style={inputStyle}
            value={budgetForm.end_date}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                end_date:
                  event.target.value,
              }))
            }
          />
        </div>

        <textarea
          style={{
            ...inputStyle,
            minHeight: 70,
            marginTop: 10,
          }}
          placeholder="Budget assumptions and notes"
          value={budgetForm.notes}
          onChange={event =>
            setBudgetForm(current => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />

        <button
          onClick={createBudget}
          style={{ marginTop: 10 }}
        >
          Create budget version
        </button>
      </div>

      {budgets.length ? (
        <div className="card" style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            Budget version
          </label>

          <select
            style={inputStyle}
            value={activeBudgetId}
            onChange={event =>
              setActiveBudgetId(
                event.target.value
              )
            }
          >
            {budgets.map(item => (
              <option key={item.id} value={item.id}>
                {item.financial_year}  -  Version{' '}
                {item.version}  -  {item.title}  - {' '}
                {item.status}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {activeBudget ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3,minmax(0,1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              [
                'Projected income',
                income,
              ],
              [
                'Planned expenditure',
                expenses,
              ],
              [
                surplus >= 0
                  ? 'Projected surplus'
                  : 'Projected deficit',
                surplus,
              ],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color:
                      label.includes('deficit')
                        ? '#c0392b'
                        : undefined,
                  }}
                >
                  {activeBudget.currency}{' '}
                  {Number(value).toFixed(2)}
                </div>
                <div className="muted">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>
                  {activeBudget.title}
                </strong>
                <div className="muted">
                  FY {activeBudget.financial_year}
                  {'  -  '}
                  Version {activeBudget.version}
                  {'  -  '}
                  Status {activeBudget.status}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {activeBudget.status ===
                'draft' ? (
                  <button
                    onClick={() =>
                      changeStatus('submitted')
                    }
                  >
                    Submit budget
                  </button>
                ) : null}

                {activeBudget.status ===
                'submitted' ? (
                  <>
                    <button
                      onClick={() =>
                        changeStatus('approved')
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="ghost"
                      onClick={() =>
                        changeStatus('rejected')
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {activeBudget.status ===
                'approved' ? (
                  <button
                    onClick={() =>
                      changeStatus('locked')
                    }
                  >
                    Lock budget
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>
              Add budget line
            </h3>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                className="ghost"
                onClick={createFeeProjection}
              >
                Add projected fees
              </button>

              <button
                type="button"
                className="ghost"
                onClick={createLevyProjection}
              >
                Add projected levy
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2,minmax(0,1fr))',
                gap: 10,
              }}
            >
              <select
                style={inputStyle}
                value={lineForm.line_type}
                onChange={event => {
                  const lineType =
                    event.target.value;

                  setLineForm(current => ({
                    ...current,
                    line_type: lineType,
                    category:
                      lineType === 'income'
                        ? incomeCategories[0]
                        : expenseCategoryOptions[0],
                    source_type:
                      lineType === 'income'
                        ? 'other_income'
                        : 'planned_expense',
                  }));
                }}
              >
                <option value="income">
                  Income
                </option>
                <option value="expense">
                  Expense
                </option>
              </select>

              <select
                style={inputStyle}
                value={lineForm.category}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    category:
                      event.target.value,
                  }))
                }
              >
                {(lineForm.line_type ===
                'income'
                  ? incomeCategories
                  : expenseCategoryOptions
                ).map(item => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <input
                style={inputStyle}
                placeholder="Subcategory"
                value={lineForm.subcategory}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    subcategory:
                      event.target.value,
                  }))
                }
              />

              <input
                style={inputStyle}
                placeholder="Description"
                value={lineForm.description}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Quantity / learner count"
                value={lineForm.quantity}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    quantity:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Rate per unit"
                value={lineForm.unit_rate}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    unit_rate:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Periods / terms"
                value={lineForm.periods}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    periods:
                      event.target.value,
                  }))
                }
              />

              <input
                style={inputStyle}
                placeholder="Assumptions"
                value={lineForm.assumptions}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    assumptions:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: '#eef5ff',
              }}
            >
              Calculated amount:{' '}
              <strong>
                {activeBudget.currency}{' '}
                {(
                  Number(
                    lineForm.quantity || 0
                  ) *
                  Number(
                    lineForm.unit_rate || 0
                  ) *
                  Number(
                    lineForm.periods || 0
                  )
                ).toFixed(2)}
              </strong>
            </div>

            <button
              onClick={addLine}
              style={{ marginTop: 12 }}
            >
              Add budget line
            </button>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>
              Budget detail
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Calculation</th>
                  <th className="r">Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lines.map(item => (
                  <tr key={item.id}>
                    <td
                      style={{
                        textTransform:
                          'capitalize',
                      }}
                    >
                      {item.line_type}
                    </td>

                    <td>
                      {item.category}
                      {item.subcategory
                        ? `  -  ${item.subcategory}`
                        : ''}
                    </td>

                    <td>
                      {item.description}
                      {item.assumptions ? (
                        <div
                          className="muted"
                          style={{ fontSize: 12 }}
                        >
                          {item.assumptions}
                        </div>
                      ) : null}
                    </td>

                    <td>
                      {Number(
                        item.quantity
                      ).toFixed(2)}
                      {'  -  '}
                      {Number(
                        item.unit_rate
                      ).toFixed(2)}
                      {'  -  '}
                      {Number(
                        item.periods
                      ).toFixed(2)}
                    </td>

                    <td className="r">
                      {activeBudget.currency}{' '}
                      {Number(
                        item.amount || 0
                      ).toFixed(2)}
                    </td>

                    <td className="r">
                      {[
                        'draft',
                        'rejected',
                      ].includes(
                        activeBudget.status
                      ) ? (
                        <button
                          className="ghost"
                          onClick={() =>
                            removeLine(item.id)
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(expenseCategories)
            .length ? (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>
                Planned expenditure allocation
              </h3>

              {Object.entries(
                expenseCategories
              ).map(([category, amount]) => (
                <div
                  key={category}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom:
                      '1px solid #e5e7eb',
                  }}
                >
                  <span>{category}</span>

                  <strong>
                    {activeBudget.currency}{' '}
                    {Number(amount).toFixed(2)}
                    {'  -  '}
                    {expenses > 0
                      ? (
                          (Number(amount) /
                            expenses) *
                          100
                        ).toFixed(1)
                      : '0.0'}
                    %
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="muted">
          Create a budget version to begin.
        </p>
      )}
    </div>
  );
}

function SchoolBillingPanel({ schoolId }) {
  const [sub, setSub] = useState(undefined); const [pays, setPays] = useState([]); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  async function load() {
    const { data } = await supabase.from('subscriptions').select('*').eq('school_id', schoolId).maybeSingle(); setSub(data || null);
    const { data: pp } = await supabase.from('subscription_payments').select('*').eq('school_id', schoolId).eq('status', 'paid').order('paid_on', { ascending: false }); setPays(pp || []);
  }
  useEffect(() => { load(); }, [schoolId]);
  const money = n => '$' + Number(n || 0).toLocaleString();
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = sub && sub.next_due ? Math.round((new Date(sub.next_due) - new Date(today)) / 86400000) : null;
  const si = (() => {
    if (!sub || !sub.next_due) return { t: 'No subscription set', c: '#5b6570' };
    if (daysLeft < 0) return { t: 'Overdue by ' + Math.abs(daysLeft) + ' day(s)', c: '#c0392b' };
    if (daysLeft <= 7) return { t: 'Due in ' + daysLeft + ' day(s)', c: '#b8860b' };
    return { t: 'Active  renews in ' + daysLeft + ' day(s)', c: '#1a7f5a' };
  })();
  async function payNow() {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/subscription-pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, origin: window.location.origin }) });
      const data = await res.json();
      if (!res.ok || !data.browserurl) { setMsg(data.error || 'Could not start payment.'); setBusy(false); return; }
      window.location.href = data.browserurl;
    } catch (e) { setMsg(String(e.message || e)); setBusy(false); }
  }
  if (sub === undefined) return <p className="muted">Loading</p>;
  return (<div>
    <div className="card" style={{ maxWidth: 520, marginBottom: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Your Chalkboard subscription</div>
      <div style={{ color: si.c, fontWeight: 600, marginBottom: 14 }}>{si.t}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
        <div><div className="muted" style={{ fontSize: 12 }}>Amount</div><div style={{ fontWeight: 600 }}>{sub && sub.amount ? money(sub.amount) + ' / month' : ''}</div></div>
        <div><div className="muted" style={{ fontSize: 12 }}>Next due</div><div style={{ fontWeight: 600 }}>{(sub && sub.next_due) || ''}</div></div>
        <div><div className="muted" style={{ fontSize: 12 }}>Last paid</div><div>{(sub && sub.last_paid) || ''}</div></div>
      </div>
      <div style={{ marginTop: 16 }}><button onClick={payNow} disabled={busy || !sub || !sub.amount}>{busy ? 'Starting' : 'Pay now'}</button></div>
      {msg && <p className="error">{msg}</p>}
      {(!sub || !sub.amount) && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>No amount set yet  the platform admin will set your subscription.</p>}
    </div>
    <div style={{ fontWeight: 700, marginBottom: 8 }}>Payment history</div>
    <table><thead><tr><th>Date</th><th>Method</th><th className="r">Amount</th></tr></thead><tbody>
      {pays.map(pp => (<tr key={pp.id}><td>{pp.paid_on}</td><td style={{ textTransform: 'capitalize' }}>{pp.method || ''}</td><td className="r">{money(pp.amount)}</td></tr>))}
      {pays.length === 0 && <tr><td colSpan="3" className="muted">No payments yet.</td></tr>}
    </tbody></table>
  </div>);
}

const labelStyle = { fontSize: 12, color: '#5b6570', marginBottom: 4, display: 'block' };
const inputStyle = { padding: '10px 11px', borderRadius: 8, border: '1px solid #dde1e6', background: '#fff', color: '#1f2328', fontSize: 14, width: '100%' };
