'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ExportToolbar from '../../../components/ExportToolbar';
import PersonnelPanel from '../../../components/admin/people/PersonnelPanel';
import GovernanceBoardPanel from '../../../components/admin/governance/GovernanceBoardPanel';
import CommunicationCentre from '../../../components/CommunicationCentre';
import AdminDashboard from '../../../components/admin/dashboard/AdminDashboard';
import AdminSidebar from '../../../components/portal/AdminSidebar';
import PageHeader from '../../../components/ui/PageHeader';
import ClassesPanel from '../../../components/admin/school-setup/ClassesPanel';
import SubjectsPanel from '../../../components/admin/school-setup/SubjectsPanel';
import SchoolProfilePanel from '../../../components/admin/school-setup/SchoolProfilePanel';
import TeachersPanel from '../../../components/admin/people/TeachersPanel';
import AdmissionsPanel from '../../../components/admin/people/AdmissionsPanel';
import LearnersPanel from '../../../components/admin/people/LearnersPanel';
import HumanResourcesPanel from '../../../components/admin/people/HumanResourcesPanel';
import FinancePanel from '../../../components/admin/finance/FinancePanel';
import BankingPanel from '../../../components/admin/finance/BankingPanel';
import PettyCashPanel from '../../../components/admin/finance/PettyCashPanel';
import FinanceFeesPanel from '../../../components/admin/finance/FeesPanel';
import FinanceArrearsPanel from '../../../components/admin/finance/ArrearsPanel';
import ModularFinanceDocumentsPanel from '../../../components/admin/finance/FinanceDocumentsPanel';
import ModularBudgetPanel from '../../../components/admin/finance/BudgetPanel';
import MeetingsPanel from '../../../components/admin/governance/MeetingsPanel';
import EventsPanel from '../../../components/admin/operations/EventsPanel';
import ContractorsPanel from '../../../components/admin/operations/ContractorsPanel';
import InventoryPanel from '../../../components/admin/operations/InventoryPanel';
import AssetsPanel from '../../../components/admin/operations/AssetsPanel';

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
        nav === 'arrears' ? <FinanceArrearsPanel schoolId={schoolId} classes={allClasses} school={school} settings={settings} /> :
        nav === 'documents' ? <ModularFinanceDocumentsPanel schoolId={schoolId} school={school} settings={settings} /> :
        nav === 'budget' ? <ModularBudgetPanel schoolId={schoolId} settings={settings} /> :
        nav === 'pettycash' ? <PettyCashPanel schoolId={schoolId} /> :
        nav === 'fees' ? <FinanceFeesPanel schoolId={schoolId} classes={allClasses} school={school} settings={settings} /> :
        nav === 'academics' ? <AcademicsPanel schoolId={schoolId} classes={allClasses} subjects={subjects} /> :
        nav === 'dashboard' ? (isTeacher ? <TeacherDashboardPanel schoolId={schoolId} classes={available} session={session} /> : <DashboardPanel schoolId={schoolId} school={school} />) :
        nav === 'board' ? <GovernanceBoardPanel schoolId={schoolId} /> :
        nav === 'meetings' ? <MeetingsPanel schoolId={schoolId} /> :
        nav === 'events' ? <EventsPanel schoolId={schoolId} /> :
        nav === 'contractors' ? <ContractorsPanel schoolId={schoolId} /> :
        nav === 'communications' ? <CommunicationCentre schoolId={schoolId} /> :
        nav === 'announcements' ? <AnnouncementsPanel schoolId={schoolId} canPost={!isTeacher} /> :
        nav === 'personnel' ? <PersonnelPanel schoolId={schoolId} /> :
        nav === 'staff' ? <HumanResourcesPanel schoolId={schoolId} /> :
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
