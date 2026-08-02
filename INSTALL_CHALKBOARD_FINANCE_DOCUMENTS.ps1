$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"
if (-not (Test-Path $file)) { throw "app\app\admin\page.js was not found." }

$backup = ".\app\app\admin\page.before-finance-documents.js"
if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw

# Make Classes easier to locate.
$content = $content.Replace(
  "['classes', 'Classes', '']",
  "['classes', 'Classes and forms', '']"
)
$content = $content.Replace(
  "classes: 'Classes',",
  "classes: 'Classes and forms',"
)

# Add finance navigation entries.
$content = $content.Replace(
@'
        ['fees', 'Fees', ''],
        ['arrears', 'Arrears', ''],
        ['finance', 'Income and expenses', ''],
        ['banking', 'Banking', ''],
'@,
@'
        ['fees', 'Fees', ''],
        ['documents', 'Invoices and receipts', ''],
        ['arrears', 'Arrears', ''],
        ['finance', 'Income and expenses', ''],
        ['pettycash', 'Petty cash', ''],
        ['banking', 'Banking', ''],
'@
)

$content = $content.Replace(
  "banking: 'Banking',",
  "banking: 'Banking',`r`n    documents: 'Invoices and receipts',`r`n    pettycash: 'Petty cash',"
)

# Add render branches before Fees.
$content = $content.Replace(
  "nav === 'fees' ? <FeesPanel",
  "nav === 'documents' ? <FinanceDocumentsPanel schoolId={schoolId} school={school} settings={settings} /> :`r`n        nav === 'pettycash' ? <PettyCashPanel schoolId={schoolId} /> :`r`n        nav === 'fees' ? <FeesPanel"
)

$panels = @'
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
      supabase.from('students').select('id,full_name,email,phone').eq('school_id',schoolId).order('full_name'),
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
        email:student?.email || '',
        phone:student?.phone || '',
      }));
    } else {
      setReceipt(x=>({
        ...x,
        student_id:id,
        received_from:student?.full_name || '',
        email:student?.email || '',
        phone:student?.phone || '',
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
        <strong>{row.invoice_number}</strong> — {row.issued_to}
        <div className="muted">{row.invoice_date} · {row.currency} {Number(row.total).toFixed(2)} · Balance {row.currency} {Number(row.balance).toFixed(2)} · {row.status}</div>
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
          {invoices.filter(i=>i.status!=='paid'&&i.status!=='void').map(i=><option key={i.id} value={i.id}>{i.invoice_number} — {i.issued_to}</option>)}
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
        <strong>{row.receipt_number}</strong> — {row.received_from}
        <div className="muted">{row.receipt_date} · {row.currency} {Number(row.amount).toFixed(2)} · {row.payment_method || '-'}</div>
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
'@

$content = $content.Replace(
  "function SchoolBillingPanel({ schoolId }) {",
  $panels + "`r`n`r`nfunction SchoolBillingPanel({ schoolId }) {"
)

[System.IO.File]::WriteAllText(
  (Resolve-Path $file),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Invoices, receipts and petty cash added to Chalkboard."
Write-Host "Classes renamed to Classes and forms under School setup."
Write-Host "Run the Supabase SQL before testing."
