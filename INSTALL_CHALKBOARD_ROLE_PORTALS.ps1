$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"
$patchRoot = Join-Path (Get-Location) "_chalkboard_portal_patch"
if (-not (Test-Path ".\app\app\page.js")) { throw "The current app\app\page.js was not found." }
if (-not (Test-Path $patchRoot)) { throw "The _chalkboard_portal_patch folder was not found." }

$adminSource = Get-Content ".\app\app\page.js" -Raw
New-Item -ItemType Directory -Path ".\app\app\admin" -Force | Out-Null
New-Item -ItemType Directory -Path ".\app\app\operator" -Force | Out-Null
New-Item -ItemType Directory -Path ".\app\app\ministry" -Force | Out-Null

$adminSource = $adminSource.Replace(
  "import { supabase } from '../../lib/supabaseClient';",
  "import { supabase } from '../../../lib/supabaseClient';"
)

$adminSource = [regex]::Replace(
  $adminSource,
  'function ChalkMark\(size\) \{[\s\S]*?\n\}',
@'
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
'@,
  1
)

# Remove corrupted non-ASCII characters from the legacy single-file console.
$adminSource = [regex]::Replace($adminSource, '[^\x00-\x7F]', '')

$adminSource = [regex]::Replace(
  $adminSource,
  'const groups = \[[\s\S]*?\]\.filter\(g => g\.items\.length > 0\);',
@'
const groups = [
  { key: 'academics', label: 'Academics', icon: '', items: [['attendance', 'Attendance', ''], ['marks', 'Marks', ''], ['reportcards', 'Report cards', ''], ['reports', 'Attendance report', '']].concat(A ? [['academics', 'Class overview', '']] : []) },
  { key: 'people', label: 'People', icon: '', items: [['students', 'Students', '']].concat(A ? [['teachers', 'Teachers', ''], ['staff', 'Staff', ''], ['admissions', 'Admissions', '']] : []) },
  { key: 'money', label: 'Money', icon: '', items: A ? [['fees', 'Fees', ''], ['arrears', 'Arrears', ''], ['finance', 'Finance', ''], ['banking', 'Banking', '']] : [] },
  { key: 'operations', label: 'Operations', icon: '', items: A ? [['timetable', 'Timetable', ''], ['inventory', 'Inventory', ''], ['assets', 'Assets', '']] : [] },
  { key: 'comms', label: 'Communication', icon: '', items: [['announcements', 'Announcements', '']] },
  { key: 'setup', label: 'Setup', icon: '', items: A ? [['classes', 'Classes', ''], ['subjects', 'Subjects', ''], ['school', 'School', '']].concat(SA ? [['mybilling', 'Subscription', '']] : []) : [] },
].filter(g => g.items.length > 0);
'@,
  1
)

$adminSource = [regex]::Replace(
  $adminSource,
  'function App\(\{ session \}\) \{[\s\S]*?\n\}\n\nfunction Console',
@'
function App({ session }) {
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role, school_id, status')
        .eq('id', session.user.id)
        .single();

      setProfile(data || null);
    })();
  }, [session]);

  if (profile === undefined) return <div className="center muted">Loading...</div>;

  if (!profile || profile.role !== 'school_admin' || profile.status !== 'active') {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{ChalkMark(58)}</div>
          <h1>Wrong Chalkboard portal</h1>
          <p className="muted">This page is reserved for active School Administrator accounts.</p>
          <button onClick={() => window.location.assign('/app')}>Return to sign in</button>
        </div>
      </div>
    );
  }

  if (!profile.school_id) {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{ChalkMark(58)}</div>
          <h1>School assignment required</h1>
          <p className="muted">Your administrator account has not been assigned to a school. Contact the platform operator.</p>
          <button className="ghost" onClick={() => supabase.auth.signOut().then(() => window.location.assign('/app'))}>Sign out</button>
        </div>
      </div>
    );
  }

  return <Console session={session} role="school_admin" canPick={false} initialSchool={profile.school_id} />;
}

function Console
'@,
  1
)

$adminSource = $adminSource.Replace(
  "return session ? <App session={session} /> : <Login />;",
  "return session ? <App session={session} /> : <RedirectToPortalLogin />;"
)

$adminSource = $adminSource.Replace(
  "function SetNewPassword({ onDone }) {",
@'
function RedirectToPortalLogin() {
  useEffect(() => {
    window.location.replace('/app');
  }, []);

  return <div className="center muted">Opening Chalkboard sign in...</div>;
}

function SetNewPassword({ onDone }) {
'@
)

$adminSource = [regex]::Replace($adminSource,'<span className="si">.*?</span>Dashboard','<span className="si"></span>Dashboard')
$adminSource = [regex]::Replace($adminSource,'<span className="si">.*?</span>Download app','<span className="si"></span>Download app')
$adminSource = [regex]::Replace($adminSource,'<span className="si">.*?</span>Sign out','<span className="si"></span>Sign out')

[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "app\app\admin\page.js"),
  $adminSource,
  [System.Text.UTF8Encoding]::new($false)
)

Copy-Item "$patchRoot\app-page.js" ".\app\app\page.js" -Force
Copy-Item "$patchRoot\operator-page.js" ".\app\app\operator\page.js" -Force
Copy-Item "$patchRoot\ministry-page.js" ".\app\app\ministry\page.js" -Force

$globalFile = ".\app\globals.css"
$globalContent = Get-Content $globalFile -Raw
$marker = "/* Chalkboard role portals */"
if (-not $globalContent.Contains($marker)) {
  $portalCss = Get-Content "$patchRoot\portal.css" -Raw
  [System.IO.File]::WriteAllText(
    (Resolve-Path $globalFile),
    $globalContent + "`r`n`r`n" + $portalCss,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Write-Host "Chalkboard role portals installed."
Write-Host "Routes: /app, /app/admin, /app/operator, /app/ministry"
Write-Host "Do not rerun the old INSTALL_CHALKBOARD_WEBSITE.ps1."
