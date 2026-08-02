$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"
if (-not (Test-Path $file)) { throw "app\app\admin\page.js was not found." }

$backup = ".\app\app\admin\page.before-hr-teacher-sync.js"
if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw

function Replace-Between {
  param(
    [string]$Text,
    [string]$StartMarker,
    [string]$EndMarker,
    [string]$Replacement
  )

  $start = $Text.IndexOf($StartMarker)
  if ($start -lt 0) { throw "Start marker not found: $StartMarker" }

  $end = $Text.IndexOf($EndMarker, $start)
  if ($end -lt 0) { throw "End marker not found: $EndMarker" }

  return $Text.Substring(0, $start) + $Replacement + "`r`n`r`n" + $Text.Substring($end)
}

# Navigation: no daily attendance and no timetable.
$groupsStart = "const groups = ["
$groupsEnd = "const groupOf ="
$groups = @'
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
        ['teachers', 'Teachers and allocations', ''],
        ['staff', 'Human Resources', ''],
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
$content = Replace-Between $content $groupsStart $groupsEnd $groups

# Titles.
$titleStart = "const title = {"
$titleEnd = "const subToday ="
$titles = @'
const title = {
    dashboard: 'Dashboard',
    mybilling: 'Subscription',
    fees: 'Fees',
    arrears: 'Arrears',
    announcements: 'Announcements',
    staff: 'Human Resources',
    admissions: 'Admissions',
    students: 'Learners',
    classes: 'Classes',
    teachers: 'Teachers and allocations',
    reports: 'Attendance reports',
    subjects: 'Subjects',
    school: 'School profile',
    finance: 'Income and expenses',
    banking: 'Banking',
    inventory: 'Inventory',
    assets: 'Assets',
  }[nav];
'@
$content = Replace-Between $content $titleStart $titleEnd $titles

# Teacher render call gets subjects.
$content = $content.Replace(
  "nav === 'teachers' ? <TeachersPanel schoolId={schoolId} classes={allClasses} /> :",
  "nav === 'teachers' ? <TeachersPanel schoolId={schoolId} classes={allClasses} subjects={subjects} /> :"
)

# Remove legacy timetable and daily attendance render branches.
$content = [regex]::Replace(
  $content,
  "nav === 'timetable' \? <TimetablePanel[\s\S]*?/> :\s*",
  ""
)
$content = [regex]::Replace(
  $content,
  "nav === 'attendance' \? <AttendancePanel[\s\S]*?/> :\s*",
  ""
)

# Teachers panel: account creation plus class and subject allocation.
$teachers = @'
function TeachersPanel({ schoolId, classes, subjects }) {
  const [teachers, setTeachers] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pickedClasses, setPickedClasses] = useState([]);
  const [pickedSubjects, setPickedSubjects] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    const [teachersResult, classResult, subjectResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,email,status')
        .eq('role', 'teacher')
        .eq('school_id', schoolId)
        .order('full_name'),
      supabase
        .from('teacher_class_assignments')
        .select('id,teacher_id,class_id')
        .eq('school_id', schoolId),
      supabase
        .from('teacher_subject_assignments')
        .select('id,teacher_id,subject_id')
        .eq('school_id', schoolId),
    ]);

    setTeachers(teachersResult.data || []);
    setClassAssignments(classResult.data || []);
    setSubjectAssignments(subjectResult.data || []);

    const loadError =
      teachersResult.error ||
      classResult.error ||
      subjectResult.error;

    if (loadError) setErr(loadError.message);
  }

  useEffect(() => {
    load();
  }, [schoolId]);

  function toggle(list, setter, id) {
    setter(
      list.includes(id)
        ? list.filter(item => item !== id)
        : [...list, id]
    );
  }

  async function createTeacher() {
    if (!email.trim()) {
      setErr('Enter a teacher email address.');
      return;
    }

    setBusy(true);
    setErr('');
    setResult(null);

    try {
      const response = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          email: email.trim(),
          fullName: name.trim(),
          classIds: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not create teacher.');
      }

      const teacherId =
        data.id ||
        data.userId ||
        data.teacherId;

      if (!teacherId) {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('school_id', schoolId)
          .eq('role', 'teacher')
          .eq('email', email.trim())
          .maybeSingle();

        if (!createdProfile?.id) {
          throw new Error(
            'Teacher account was created, but its profile could not be found for allocation.'
          );
        }

        await saveAllocations(createdProfile.id);
      } else {
        await saveAllocations(teacherId);
      }

      setResult(data);
      setName('');
      setEmail('');
      setPickedClasses([]);
      setPickedSubjects([]);
      await load();
    } catch (error) {
      setErr(error.message || String(error));
    }

    setBusy(false);
  }

  async function saveAllocations(teacherId) {
    if (pickedClasses.length) {
      const { error } = await supabase
        .from('teacher_class_assignments')
        .upsert(
          pickedClasses.map(classId => ({
            school_id: schoolId,
            teacher_id: teacherId,
            class_id: classId,
          })),
          { onConflict: 'teacher_id,class_id' }
        );

      if (error) throw error;
    }

    if (pickedSubjects.length) {
      const { error } = await supabase
        .from('teacher_subject_assignments')
        .upsert(
          pickedSubjects.map(subjectId => ({
            school_id: schoolId,
            teacher_id: teacherId,
            subject_id: subjectId,
          })),
          { onConflict: 'teacher_id,subject_id' }
        );

      if (error) throw error;
    }
  }

  async function toggleExisting(type, teacherId, targetId) {
    const table =
      type === 'class'
        ? 'teacher_class_assignments'
        : 'teacher_subject_assignments';

    const targetColumn =
      type === 'class'
        ? 'class_id'
        : 'subject_id';

    const rows =
      type === 'class'
        ? classAssignments
        : subjectAssignments;

    const existing = rows.find(
      row =>
        row.teacher_id === teacherId &&
        row[targetColumn] === targetId
    );

    if (existing) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', existing.id);

      if (error) {
        setErr(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from(table)
        .insert({
          school_id: schoolId,
          teacher_id: teacherId,
          [targetColumn]: targetId,
        });

      if (error) {
        setErr(error.message);
        return;
      }
    }

    await load();
  }

  function assigned(rows, teacherId, column, id) {
    return rows.some(
      row =>
        row.teacher_id === teacherId &&
        row[column] === id
    );
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        Create teacher accounts and allocate their classes and
        subjects. Dari reads these shared assignments automatically.
      </p>

      {result ? (
        <div className="card" style={{ marginBottom: 18, borderColor: '#1a7f5a' }}>
          <div style={{ fontWeight: 700, color: '#1a7f5a' }}>
            Teacher login created
          </div>
          <p className="muted" style={{ marginBottom: 6 }}>
            Send these credentials securely to the teacher.
          </p>
          <div><b>Email:</b> {result.email}</div>
          {result.password ? (
            <div style={{ marginTop: 4 }}>
              <b>Temporary password:</b>{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {result.password}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>
          Add a teacher
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              style={inputStyle}
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>
        </div>

        <label style={{ ...labelStyle, marginTop: 14 }}>
          Classes
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {classes.map(item => (
            <button
              key={item.id}
              type="button"
              style={chip(pickedClasses.includes(item.id))}
              onClick={() =>
                toggle(
                  pickedClasses,
                  setPickedClasses,
                  item.id
                )
              }
            >
              {item.name}
            </button>
          ))}
        </div>

        <label style={{ ...labelStyle, marginTop: 14 }}>
          Subjects
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {subjects.map(item => (
            <button
              key={item.id}
              type="button"
              style={chip(pickedSubjects.includes(item.id))}
              onClick={() =>
                toggle(
                  pickedSubjects,
                  setPickedSubjects,
                  item.id
                )
              }
            >
              {item.name}
            </button>
          ))}
        </div>

        <button
          onClick={createTeacher}
          disabled={busy}
          style={{ marginTop: 16 }}
        >
          {busy ? 'Creating...' : 'Create teacher and allocations'}
        </button>

        {err ? <p className="error">{err}</p> : null}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {teachers.map(teacher => (
          <article className="card" key={teacher.id}>
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              {teacher.full_name || teacher.email || 'Teacher'}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
              {teacher.email || 'No email stored'}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Assigned classes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {classes.map(item => {
                  const on = assigned(
                    classAssignments,
                    teacher.id,
                    'class_id',
                    item.id
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      style={chip(on)}
                      onClick={() =>
                        toggleExisting(
                          'class',
                          teacher.id,
                          item.id
                        )
                      }
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={labelStyle}>Assigned subjects</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {subjects.map(item => {
                  const on = assigned(
                    subjectAssignments,
                    teacher.id,
                    'subject_id',
                    item.id
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      style={chip(on)}
                      onClick={() =>
                        toggleExisting(
                          'subject',
                          teacher.id,
                          item.id
                        )
                      }
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
'@
$content = Replace-Between $content "function TeachersPanel" "function LearnersPanel" $teachers

# Full Human Resources module.
$hr = @'
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
'@
$content = Replace-Between $content "function StaffPanel" "function AdmissionsPanel" $hr

[System.IO.File]::WriteAllText(
  (Resolve-Path $file),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Chalkboard HR and teacher-allocation patch applied."
Write-Host "Daily attendance and timetable removed from Chalkboard navigation."
Write-Host "Attendance reports remain connected to the shared Dari attendance table."
Write-Host "Run the included Supabase SQL before testing Human Resources."
