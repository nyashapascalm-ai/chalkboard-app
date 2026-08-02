"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const field = { width: "100%", padding: "10px 12px", border: "1px solid #dde1e6", borderRadius: 8 };
const grid = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 };
const channels = [["in_app","In app"],["email","Email"],["sms","SMS"],["whatsapp","WhatsApp"]];
const toggle = (list, value) => list.includes(value) ? list.filter(x => x !== value) : [...list, value];

export default function CommunicationCentre({ schoolId }) {
  const [tab, setTab] = useState("compose");
  const [announcements, setAnnouncements] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title:"", body:"", priority:"normal", audience_type:"all", audience_reference:"", audience_label:"", channels:["in_app"], scheduled_for:"", manual_name:"", manual_email:"", manual_phone:"", manual_whatsapp:"" });
  const [template, setTemplate] = useState({ name:"", subject_template:"", body_template:"", category:"", default_priority:"normal", default_channels:["in_app"], variables:"" });
  const [group, setGroup] = useState({ name:"", description:"" });
  const [member, setMember] = useState({ group_id:"", member_type:"manual", member_name:"", email:"", phone:"", whatsapp_number:"" });

  async function load() {
    const [a,d,t,g,m,c,s] = await Promise.all([
      supabase.from("communication_announcements").select("*").eq("school_id",schoolId).order("created_at",{ascending:false}),
      supabase.from("communication_deliveries").select("*,communication_recipients(recipient_name,email,phone,whatsapp_number)").eq("school_id",schoolId).order("created_at",{ascending:false}).limit(500),
      supabase.from("communication_templates").select("*").eq("school_id",schoolId).order("name"),
      supabase.from("communication_groups").select("*").eq("school_id",schoolId).order("name"),
      supabase.from("communication_group_members").select("*").eq("school_id",schoolId),
      supabase.from("classes").select("id,name").eq("school_id",schoolId).order("name"),
      supabase.from("communication_provider_settings").select("*").eq("school_id",schoolId),
    ]);
    setAnnouncements(a.data||[]); setDeliveries(d.data||[]); setTemplates(t.data||[]); setGroups(g.data||[]); setMembers(m.data||[]); setClasses(c.data||[]); setSettings(s.data||[]);
    const e=a.error||d.error||t.error||g.error||m.error||c.error||s.error; if(e)setError(e.message);
  }
  useEffect(()=>{load()},[schoolId]);

  async function resolveAudience(announcement) {
    let rows=[];
    if(announcement.audience_type==="teachers"){
      const {data,error}=await supabase.from("profiles").select("id,full_name,email").eq("school_id",schoolId).eq("role","teacher").eq("status","active"); if(error)throw error;
      rows=(data||[]).map(x=>({recipient_type:"profile",recipient_reference:x.id,recipient_name:x.full_name,email:x.email}));
    } else if(announcement.audience_type==="staff"){
      const {data,error}=await supabase.from("staff").select("id,full_name,email,phone").eq("school_id",schoolId); if(error)throw error;
      rows=(data||[]).map(x=>({recipient_type:"staff",recipient_reference:x.id,recipient_name:x.full_name,email:x.email,phone:x.phone,whatsapp_number:x.phone}));
    } else if(announcement.audience_type==="learners" || announcement.audience_type==="class"){
      let q=supabase.from("students").select("id,full_name").eq("school_id",schoolId); if(announcement.audience_type==="class")q=q.eq("class_id",announcement.audience_reference);
      const {data,error}=await q; if(error)throw error; rows=(data||[]).map(x=>({recipient_type:"learner",recipient_reference:x.id,recipient_name:x.full_name}));
    } else if(announcement.audience_type==="board"){
      const {data,error}=await supabase.from("governance_members").select("id,full_name,email,phone").eq("school_id",schoolId).eq("status","active"); if(error)throw error;
      rows=(data||[]).map(x=>({recipient_type:"board_member",recipient_reference:x.id,recipient_name:x.full_name,email:x.email,phone:x.phone,whatsapp_number:x.phone}));
    } else if(announcement.audience_type==="custom_group"){
      rows=members.filter(x=>x.group_id===announcement.audience_reference).map(x=>({recipient_type:x.member_type,recipient_reference:x.member_reference,recipient_name:x.member_name,email:x.email,phone:x.phone,whatsapp_number:x.whatsapp_number}));
    } else if(announcement.audience_type==="manual"){
      rows=[{recipient_type:"manual",recipient_name:form.manual_name,email:form.manual_email||null,phone:form.manual_phone||null,whatsapp_number:form.manual_whatsapp||form.manual_phone||null}];
    } else {
      const [p,s,l,b]=await Promise.all([
        supabase.from("profiles").select("id,full_name,email").eq("school_id",schoolId).eq("role","teacher").eq("status","active"),
        supabase.from("staff").select("id,full_name,email,phone").eq("school_id",schoolId),
        supabase.from("students").select("id,full_name").eq("school_id",schoolId),
        supabase.from("governance_members").select("id,full_name,email,phone").eq("school_id",schoolId).eq("status","active"),
      ]);
      rows=[...(p.data||[]).map(x=>({recipient_type:"profile",recipient_reference:x.id,recipient_name:x.full_name,email:x.email})),...(s.data||[]).map(x=>({recipient_type:"staff",recipient_reference:x.id,recipient_name:x.full_name,email:x.email,phone:x.phone,whatsapp_number:x.phone})),...(l.data||[]).map(x=>({recipient_type:"learner",recipient_reference:x.id,recipient_name:x.full_name})),...(b.data||[]).map(x=>({recipient_type:"board_member",recipient_reference:x.id,recipient_name:x.full_name,email:x.email,phone:x.phone,whatsapp_number:x.phone}))];
    }
    rows=rows.filter(x=>x.recipient_name||x.email||x.phone||x.whatsapp_number); if(!rows.length)throw new Error("No recipients matched the selected audience.");
    const {data:recipients,error}=await supabase.from("communication_recipients").insert(rows.map(x=>({school_id:schoolId,announcement_id:announcement.id,...x}))).select(); if(error)throw error;
    const queue=[];
    for(const r of recipients||[]) for(const channel of announcement.channels||[]){
      let address=null,status="pending_provider";
      if(channel==="in_app"){address=r.recipient_reference||r.recipient_name||"in-app";status="delivered"}
      if(channel==="email")address=r.email;
      if(channel==="sms")address=r.phone;
      if(channel==="whatsapp")address=r.whatsapp_number||r.phone;
      if(!address&&channel!=="in_app")status="skipped";
      queue.push({school_id:schoolId,announcement_id:announcement.id,recipient_id:r.id,channel,recipient_address:address,status,sent_at:channel==="in_app"?new Date().toISOString():null,delivered_at:channel==="in_app"?new Date().toISOString():null,request_payload:{title:announcement.title,body:announcement.body,priority:announcement.priority}});
    }
    const {error:qe}=await supabase.from("communication_deliveries").insert(queue); if(qe)throw qe;
    return {recipients:(recipients||[]).length,deliveries:queue.length,pending:queue.filter(x=>x.status==="pending_provider").length};
  }

  async function saveAnnouncement(mode){
    setError(""); if(!form.title.trim()||!form.body.trim())return setError("Enter a title and message."); if(!form.channels.length)return setError("Select at least one channel.");
    const status=mode==="draft"?"draft":form.scheduled_for?"scheduled":"queued";
    const {data,error}=await supabase.from("communication_announcements").insert({school_id:schoolId,title:form.title.trim(),body:form.body.trim(),priority:form.priority,audience_type:form.audience_type,audience_reference:form.audience_reference||null,audience_label:form.audience_label||null,channels:form.channels,status,scheduled_for:form.scheduled_for||null}).select().single();
    if(error)return setError(error.message);
    if(mode!=="draft") try{const x=await resolveAudience(data);await supabase.from("communication_announcements").update({metadata:{recipient_count:x.recipients,delivery_count:x.deliveries,pending_provider:x.pending}}).eq("id",data.id)}catch(e){await supabase.from("communication_announcements").update({status:"failed",metadata:{resolution_error:e.message}}).eq("id",data.id);setError(e.message)}
    setForm({title:"",body:"",priority:"normal",audience_type:"all",audience_reference:"",audience_label:"",channels:["in_app"],scheduled_for:"",manual_name:"",manual_email:"",manual_phone:"",manual_whatsapp:""}); await load();
  }

  async function createTemplate(){if(!template.name.trim()||!template.body_template.trim())return setError("Enter a template name and message.");const {error}=await supabase.from("communication_templates").insert({...template,school_id:schoolId,variables:template.variables.split(",").map(x=>x.trim()).filter(Boolean)});if(error)setError(error.message);else{setTemplate({name:"",subject_template:"",body_template:"",category:"",default_priority:"normal",default_channels:["in_app"],variables:""});await load()}}
  async function createGroup(){if(!group.name.trim())return setError("Enter a group name.");const {error}=await supabase.from("communication_groups").insert({school_id:schoolId,name:group.name.trim(),description:group.description||null});if(error)setError(error.message);else{setGroup({name:"",description:""});await load()}}
  async function addMember(){if(!member.group_id||!member.member_name.trim())return setError("Select a group and enter a member name.");const {error}=await supabase.from("communication_group_members").insert({school_id:schoolId,...member,email:member.email||null,phone:member.phone||null,whatsapp_number:member.whatsapp_number||member.phone||null});if(error)setError(error.message);else{setMember({...member,member_name:"",email:"",phone:"",whatsapp_number:""});await load()}}
  async function retryDelivery(row){const {error}=await supabase.from("communication_deliveries").update({status:"pending_provider",retry_count:Number(row.retry_count||0)+1,next_retry_at:new Date().toISOString(),failure_code:null,failure_reason:null,failed_at:null}).eq("id",row.id);if(error)setError(error.message);else await load()}
  const summary=useMemo(()=>({queued:deliveries.filter(x=>["queued","pending_provider","sending"].includes(x.status)).length,sent:deliveries.filter(x=>["sent","delivered","read"].includes(x.status)).length,failed:deliveries.filter(x=>x.status==="failed").length,skipped:deliveries.filter(x=>x.status==="skipped").length}),[deliveries]);

  return <div>
    {error?<p className="error">{error}</p>:null}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>{[["compose","Compose"],["announcements","Announcements"],["templates","Templates"],["groups","Recipient groups"],["history","Delivery history"],["settings","Communication settings"]].map(([v,l])=><button key={v} className={tab===v?"":"ghost"} onClick={()=>setTab(v)}>{l}</button>)}</div>
    {tab==="compose"?<div className="card"><h3 style={{marginTop:0}}>Create announcement</h3><div style={grid}><input style={field} placeholder="Announcement title" value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))}/><select style={field} value={form.priority} onChange={e=>setForm(x=>({...x,priority:e.target.value}))}>{["normal","important","urgent","emergency"].map(x=><option key={x}>{x}</option>)}</select><select style={field} value={form.audience_type} onChange={e=>setForm(x=>({...x,audience_type:e.target.value,audience_reference:""}))}><option value="all">Everyone</option><option value="teachers">All teachers</option><option value="staff">All staff</option><option value="learners">All learners</option><option value="board">Governing board</option><option value="class">Selected class</option><option value="custom_group">Recipient group</option><option value="manual">Manual recipient</option></select>{form.audience_type==="class"?<select style={field} value={form.audience_reference} onChange={e=>setForm(x=>({...x,audience_reference:e.target.value,audience_label:classes.find(c=>c.id===e.target.value)?.name||""}))}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>:null}{form.audience_type==="custom_group"?<select style={field} value={form.audience_reference} onChange={e=>setForm(x=>({...x,audience_reference:e.target.value,audience_label:groups.find(g=>g.id===e.target.value)?.name||""}))}><option value="">Select group</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>:null}<input type="datetime-local" style={field} value={form.scheduled_for} onChange={e=>setForm(x=>({...x,scheduled_for:e.target.value}))}/></div>{form.audience_type==="manual"?<div style={{...grid,marginTop:10}}>{[["manual_name","Recipient name"],["manual_email","Email"],["manual_phone","Phone"],["manual_whatsapp","WhatsApp number"]].map(([k,l])=><input key={k} style={field} placeholder={l} value={form[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>)}</div>:null}<textarea style={{...field,minHeight:180,marginTop:10}} placeholder="Announcement message" value={form.body} onChange={e=>setForm(x=>({...x,body:e.target.value}))}/><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{channels.map(([v,l])=><button type="button" key={v} className={form.channels.includes(v)?"":"ghost"} onClick={()=>setForm(x=>({...x,channels:toggle(x.channels,v)}))}>{l}</button>)}</div><div style={{display:"flex",gap:8,marginTop:16}}><button onClick={()=>saveAnnouncement("queue")}>{form.scheduled_for?"Schedule announcement":"Queue announcement"}</button><button className="ghost" onClick={()=>saveAnnouncement("draft")}>Save draft</button></div><p className="muted">In-app is recorded immediately. Email, SMS and WhatsApp are queued as pending-provider until integrations are connected.</p></div>:null}
    {tab==="announcements"?<div style={{display:"grid",gap:12}}>{announcements.map(a=><article className="card" key={a.id}><strong>{a.title}</strong><div className="muted">{a.priority} - {a.audience_label||a.audience_type} - {a.status}</div><p style={{whiteSpace:"pre-wrap"}}>{a.body}</p><div className="muted">Channels: {(a.channels||[]).join(", ")}</div></article>)}</div>:null}
    {tab==="templates"?<div><div className="card" style={{marginBottom:18}}><h3 style={{marginTop:0}}>Create message template</h3><div style={grid}>{[["name","Template name"],["subject_template","Subject template"],["category","Category"],["variables","Variables, comma separated"]].map(([k,l])=><input key={k} style={field} placeholder={l} value={template[k]} onChange={e=>setTemplate(x=>({...x,[k]:e.target.value}))}/>)}</div><textarea style={{...field,minHeight:130,marginTop:10}} placeholder="Message template" value={template.body_template} onChange={e=>setTemplate(x=>({...x,body_template:e.target.value}))}/><button onClick={createTemplate} style={{marginTop:10}}>Save template</button></div><table><thead><tr><th>Template</th><th>Category</th><th>Channels</th><th></th></tr></thead><tbody>{templates.map(t=><tr key={t.id}><td>{t.name}</td><td>{t.category||"-"}</td><td>{(t.default_channels||[]).join(", ")}</td><td className="r"><button onClick={()=>{setForm(x=>({...x,title:t.subject_template||t.name,body:t.body_template,priority:t.default_priority,channels:t.default_channels||["in_app"]}));setTab("compose")}}>Use</button></td></tr>)}</tbody></table></div>:null}
    {tab==="groups"?<div><div className="card" style={{marginBottom:18}}><input style={field} placeholder="Group name" value={group.name} onChange={e=>setGroup(x=>({...x,name:e.target.value}))}/><textarea style={{...field,minHeight:70,marginTop:10}} placeholder="Description" value={group.description} onChange={e=>setGroup(x=>({...x,description:e.target.value}))}/><button onClick={createGroup} style={{marginTop:10}}>Create group</button></div><div className="card" style={{marginBottom:18}}><div style={grid}><select style={field} value={member.group_id} onChange={e=>setMember(x=>({...x,group_id:e.target.value}))}><option value="">Select group</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>{[["member_name","Member name"],["email","Email"],["phone","Phone"],["whatsapp_number","WhatsApp number"]].map(([k,l])=><input key={k} style={field} placeholder={l} value={member[k]} onChange={e=>setMember(x=>({...x,[k]:e.target.value}))}/>)}</div><button onClick={addMember} style={{marginTop:10}}>Add member</button></div>{groups.map(g=><div className="card" key={g.id} style={{marginBottom:12}}><strong>{g.name}</strong><div className="muted">{g.description||""}</div><div>{members.filter(m=>m.group_id===g.id).length} member(s)</div></div>)}</div>:null}
    {tab==="history"?<div><div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:18}}>{[["Queued",summary.queued],["Sent or delivered",summary.sent],["Failed",summary.failed],["Skipped",summary.skipped]].map(([l,v])=><div className="card" key={l}><div style={{fontSize:28,fontWeight:800}}>{v}</div><div className="muted">{l}</div></div>)}</div><table><thead><tr><th>Recipient</th><th>Channel</th><th>Address</th><th>Status</th><th>Retries</th><th></th></tr></thead><tbody>{deliveries.map(d=><tr key={d.id}><td>{d.communication_recipients?.recipient_name||"-"}</td><td>{d.channel}</td><td>{d.recipient_address||"-"}</td><td>{d.status}</td><td>{d.retry_count||0}</td><td className="r">{d.status==="failed"?<button onClick={()=>retryDelivery(d)}>Retry</button>:null}</td></tr>)}</tbody></table></div>:null}
    {tab==="settings"?<div style={{display:"grid",gap:14}}>{["email","sms","whatsapp"].map(ch=><Setting key={ch} schoolId={schoolId} channel={ch} initial={settings.find(x=>x.channel===ch)||{}} onSaved={load} onError={setError}/>) }<div style={{padding:12,borderRadius:10,background:"#eef5ff"}}>Provider secrets are not stored here. API keys, tokens and webhook secrets must be configured in protected server environment variables.</div></div>:null}
  </div>;
}

function Setting({schoolId,channel,initial,onSaved,onError}){
 const [f,setF]=useState({enabled:Boolean(initial.enabled),provider_key:initial.provider_key||"",sender_name:initial.sender_name||"",sender_address:initial.sender_address||"",reply_to:initial.reply_to||"",default_country_code:initial.default_country_code||"+263",quiet_hours_start:initial.quiet_hours_start||"",quiet_hours_end:initial.quiet_hours_end||"",emergency_override:initial.emergency_override===undefined?true:Boolean(initial.emergency_override)});
 async function save(){const {error}=await supabase.from("communication_provider_settings").upsert({school_id:schoolId,channel,...f,updated_at:new Date().toISOString()},{onConflict:"school_id,channel"});if(error)onError(error.message);else onSaved()}
 return <div className="card"><h3 style={{marginTop:0,textTransform:"capitalize"}}>{channel}</h3><div style={grid}><select style={field} value={f.enabled?"yes":"no"} onChange={e=>setF(x=>({...x,enabled:e.target.value==="yes"}))}><option value="no">Disabled</option><option value="yes">Enabled</option></select>{[["provider_key","Provider identifier"],["sender_name","Sender name"],["sender_address","Sender address or number"],["reply_to","Reply-to email"],["default_country_code","Default country code"]].map(([k,l])=><input key={k} style={field} placeholder={l} value={f[k]} onChange={e=>setF(x=>({...x,[k]:e.target.value}))}/>)}<input type="time" style={field} value={f.quiet_hours_start} onChange={e=>setF(x=>({...x,quiet_hours_start:e.target.value}))}/><input type="time" style={field} value={f.quiet_hours_end} onChange={e=>setF(x=>({...x,quiet_hours_end:e.target.value}))}/></div><button onClick={save} style={{marginTop:10}}>Save {channel} settings</button></div>
}
