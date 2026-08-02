$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"
if (-not (Test-Path $file)) { throw "app\app\admin\page.js was not found." }

$backup = ".\app\app\admin\page.before-governance-events-contractors.js"
if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw

function Replace-Between {
  param([string]$Text,[string]$StartMarker,[string]$EndMarker,[string]$Replacement)
  $start = $Text.IndexOf($StartMarker)
  if ($start -lt 0) { throw "Start marker not found: $StartMarker" }
  $end = $Text.IndexOf($EndMarker, $start)
  if ($end -lt 0) { throw "End marker not found: $EndMarker" }
  return $Text.Substring(0,$start) + $Replacement + "`r`n`r`n" + $Text.Substring($end)
}

# Add Governance, Events and Contractors to navigation.
$content = $content.Replace(
@'
    {
      key: 'operations',
      label: 'Operations',
      icon: '',
      items: [
        ['inventory', 'Inventory', ''],
        ['assets', 'Assets', ''],
      ],
    },
'@,
@'
    {
      key: 'governance',
      label: 'Governance',
      icon: '',
      items: [
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
'@
)

# Add page titles.
$content = $content.Replace(
  "assets: 'Assets',",
  "assets: 'Assets',`r`n    meetings: 'Meetings and resolutions',`r`n    events: 'Events calendar',`r`n    contractors: 'Contractors and payments',"
)

# Add render branches before announcements.
$content = $content.Replace(
  "nav === 'announcements' ? <AnnouncementsPanel",
  "nav === 'meetings' ? <MeetingsPanel schoolId={schoolId} /> :`r`n        nav === 'events' ? <EventsPanel schoolId={schoolId} /> :`r`n        nav === 'contractors' ? <ContractorsPanel schoolId={schoolId} /> :`r`n        nav === 'announcements' ? <AnnouncementsPanel"
)

$panels = @'
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
          {meetings.map(m=><option key={m.id} value={m.id}>{m.meeting_date} — {m.title}</option>)}
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
          <div className="muted">{m.meeting_date} · {m.meeting_type} · {m.venue || 'Venue not set'}</div>
          {m.minutes ? <p style={{whiteSpace:'pre-wrap'}}>{m.minutes}</p> : null}
          <div style={{marginTop:10}}>
            {resolutions.filter(r=>r.meeting_id===m.id).map(r=>(
              <div key={r.id} style={{padding:'10px 0',borderTop:'1px solid #e5e7eb'}}>
                <strong>{r.resolution_number || 'Resolution'}</strong>: {r.resolution}
                <div className="muted">Owner: {r.responsible_person || '-'} · Due: {r.due_date || '-'} · Status: {r.status}</div>
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
        <div className="muted">{e.start_date}{e.end_date ? ` to ${e.end_date}` : ''} · {e.category} · {e.venue || 'Venue not set'}</div>
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
          <div className="muted">{c.company_name||''} · {c.service_type} · {c.status}</div>
          <div style={{marginTop:8}}>Contract value: {c.contract_value!=null?Number(c.contract_value).toLocaleString():'Not set'} · Paid: {total.toLocaleString()} · Balance: {balance!=null?balance.toLocaleString():'-'}</div>
        </article>
      })}
    </div>
  </div>
}
'@

# Insert before SchoolBillingPanel, a stable late-file marker.
$content = $content.Replace(
  "function SchoolBillingPanel({ schoolId }) {",
  $panels + "`r`n`r`nfunction SchoolBillingPanel({ schoolId }) {"
)

[System.IO.File]::WriteAllText(
  (Resolve-Path $file),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Governance, events and contractor modules added to Chalkboard."
Write-Host "Run the Supabase SQL before testing the new pages."
