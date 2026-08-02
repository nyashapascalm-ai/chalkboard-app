"use client";
import {Building2,CalendarCheck2,GraduationCap,Landmark,LogOut,MapPinned,Users} from "lucide-react";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabaseClient";

export default function MinistryPortal(){
 const[s,setS]=useState({loading:true,error:"",user:null,schools:[],metrics:{}});
 useEffect(()=>{(async()=>{try{const{data:sd}=await supabase.auth.getSession();const session=sd.session;if(!session){location.replace("/app");return}const{data:p}=await supabase.from("profiles").select("role,status,full_name").eq("id",session.user.id).maybeSingle();if(p?.role!=="ministry_official"||p?.status!=="active"){location.replace("/app");return}
 const[schools,learners,teachers,attendance]=await Promise.all([
  supabase.from("schools").select("id,name,emis_code,province_id,district_id").order("name"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","student"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher"),
  supabase.from("attendance").select("student_id",{count:"exact",head:true})
 ]);if(schools.error)throw schools.error;const rows=schools.data||[];setS({loading:false,error:"",user:{name:p.full_name||"Ministry Official",email:session.user.email},schools:rows,metrics:{schools:rows.length,learners:learners.count||0,teachers:teachers.count||0,attendance:attendance.count||0,geography:rows.filter(x=>x.province_id&&x.district_id).length}})}catch(e){setS(x=>({...x,loading:false,error:e instanceof Error?e.message:"Unable to load Ministry reporting."}))}})()},[]);
 async function out(){await supabase.auth.signOut();location.assign("/app")}
 if(s.loading)return <main className="cb-portal-loading"><img src="/icon-192.png" alt=""/><p>Loading Ministry reporting...</p></main>;
 return <main className="cb-portal-page"><aside className="cb-portal-sidebar"><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/><div className="cb-portal-role"><Landmark size={20}/><div><strong>Ministry Official</strong><span>Read-only education oversight</span></div></div><div className="cb-portal-user"><strong>{s.user?.name}</strong><span>{s.user?.email}</span></div><button onClick={out} className="cb-signout"><LogOut size={18}/>Sign out</button></aside>
 <section className="cb-portal-main"><header><p>Chalkboard</p><h1>Ministry oversight</h1><span>Aggregated school participation and reporting</span></header>
 {s.error?<div className="cb-portal-error">{s.error}</div>:null}
 <div className="cb-metric-grid"><Metric icon={Building2} label="Schools" value={s.metrics.schools}/><Metric icon={Users} label="Learners" value={s.metrics.learners}/><Metric icon={GraduationCap} label="Teachers" value={s.metrics.teachers}/><Metric icon={CalendarCheck2} label="Attendance records" value={s.metrics.attendance}/><Metric icon={MapPinned} label="Geography ready" value={s.metrics.geography}/></div>
 <section className="cb-portal-card"><div className="cb-card-heading"><div><p>Reporting readiness</p><h2>School coverage</h2></div><Landmark size={24}/></div><div className="cb-school-table"><div className="cb-school-row cb-school-head"><span>School</span><span>EMIS</span><span>Province</span><span>District</span></div>{s.schools.map(sc=><div className="cb-school-row" key={sc.id}><strong>{sc.name}</strong><span>{sc.emis_code||"Not set"}</span><span>{sc.province_id?"Assigned":"Not assigned"}</span><span>{sc.district_id?"Assigned":"Not assigned"}</span></div>)}</div></section>
 <p className="cb-readonly-note">Ministry access is read-only. Individual learner records are not editable from this portal.</p>
 </section></main>
}
function Metric({icon:Icon,label,value}){return <article className="cb-metric-card"><Icon size={21}/><strong>{Number(value||0).toLocaleString("en-GB")}</strong><span>{label}</span></article>}
