$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"

if (-not (Test-Path $file)) {
  throw "app\app\admin\page.js was not found."
}

$backup = ".\app\app\admin\page.before-admin-refinement.js"

if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw

# 1. Replace the navigation structure.
$groupsPattern =
  'const groups = \[[\s\S]*?\]\.filter\(g => g\.items\.length > 0\);'

$groupsReplacement = @'
const groups = [
    {
      key: 'setup',
      label: 'School setup',
      icon: '',
      items: [
        ['school', 'School profile', ''],
        ['classes', 'Classes', ''],
        ['subjects', 'Subjects', ''],
      ],
    },
    {
      key: 'people',
      label: 'People',
      icon: '',
      items: [
        ['students', 'Learners', ''],
        ['teachers', 'Teachers', ''],
        ['staff', 'Staff', ''],
        ['admissions', 'Admissions', ''],
      ],
    },
    {
      key: 'attendance',
      label: 'Attendance',
      icon: '',
      items: [
        ['attendance', 'Attendance overview', ''],
        ['reports', 'Attendance reports', ''],
      ],
    },
    {
      key: 'money',
      label: 'Finance',
      icon: '',
      items: [
        ['fees', 'Fees', ''],
        ['arrears', 'Arrears', ''],
        ['finance', 'Income and expenses', ''],
        ['banking', 'Banking', ''],
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: '',
      items: [
        ['timetable', 'Timetable', ''],
        ['inventory', 'Inventory', ''],
        ['assets', 'Assets', ''],
      ],
    },
    {
      key: 'communication',
      label: 'Communication',
      icon: '',
      items: [
        ['announcements', 'Announcements', ''],
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
'@

$updated = [regex]::Replace(
  $content,
  $groupsPattern,
  $groupsReplacement,
  1
)

if ($updated -eq $content) {
  throw "Could not locate the navigation groups block. No changes were written."
}

$content = $updated

# 2. Replace page titles and remove Chalkboard assessment titles.
$titlePattern =
  'const title = \{[\s\S]*?\}\[nav\];'

$titleReplacement = @'
const title = {
    dashboard: 'Dashboard',
    mybilling: 'Subscription',
    fees: 'Fees',
    arrears: 'Arrears',
    announcements: 'Announcements',
    staff: 'Staff',
    admissions: 'Admissions',
    timetable: 'Timetable',
    attendance: 'Attendance overview',
    students: 'Learners',
    classes: 'Classes',
    teachers: 'Teachers',
    reports: 'Attendance reports',
    subjects: 'Subjects',
    school: 'School profile',
    finance: 'Income and expenses',
    banking: 'Banking',
    inventory: 'Inventory',
    assets: 'Assets',
  }[nav];
'@

$content = [regex]::Replace(
  $content,
  $titlePattern,
  $titleReplacement,
  1
)

# 3. Replace AttendancePanel with a read-only oversight panel.
$attendancePattern =
  'function AttendancePanel[\s\S]*?\r?\nfunction esc'

$attendanceReplacement = @'
function AttendancePanel({ schoolId, classes }) {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
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
        setStudents([]);
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
        setStudents([]);
        setRecords([]);
      } else {
        setStudents(studentsResult.data || []);
        setRecords(attendanceResult.data || []);
      }

      setBusy(false);
    }

    load();
  }, [schoolId, classId, date]);

  const recordByStudent = new Map(
    records.map(record => [record.student_id, record])
  );

  const statusFor = studentId => {
    const record = recordByStudent.get(studentId);
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
              const record = recordByStudent.get(student.id);
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

function esc
'@

$updated = [regex]::Replace(
  $content,
  $attendancePattern,
  $attendanceReplacement,
  1
)

if ($updated -eq $content) {
  throw "Could not locate AttendancePanel. No changes were written."
}

$content = $updated

# 4. Ensure the AttendancePanel call no longer exposes teacher editing.
$content = [regex]::Replace(
  $content,
  '<AttendancePanel\s+schoolId=\{schoolId\}\s+classes=\{available\}\s+isTeacher=\{isTeacher\}\s*/>',
  '<AttendancePanel schoolId={schoolId} classes={available} />'
)

# 5. Remove hidden render branches for Chalkboard assessment modules.
$content = [regex]::Replace(
  $content,
  '\{nav === ''marks''[\s\S]*?\}\s*',
  ''
)

$content = [regex]::Replace(
  $content,
  '\{nav === ''reportcards''[\s\S]*?\}\s*',
  ''
)

$content = [regex]::Replace(
  $content,
  '\{nav === ''academics''[\s\S]*?\}\s*',
  ''
)

# 6. Clean remaining display labels.
$content = $content.Replace('Students', 'Learners')
$content = $content.Replace('Student', 'Learner')
$content = $content.Replace('School letterhead', 'School profile')
$content = $content.Replace('Fee arrears', 'Arrears')

[System.IO.File]::WriteAllText(
  (Resolve-Path $file),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Chalkboard School Administrator navigation refined."
Write-Host "Marks, Report cards and Class overview removed from navigation."
Write-Host "Attendance is now read-only oversight from Dari."
Write-Host "Backup retained at: $backup"
