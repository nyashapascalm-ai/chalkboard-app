"use client";
import {Building2,CreditCard,GraduationCap,LogOut,School,ShieldCheck,Users} from "lucide-react";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabaseClient";
import ExportToolbar from '../../../components/ExportToolbar';

export default function OperatorPortal(){
 const[s,setS]=useState({loading:true,error:"",user:null,schools:[],metrics:{}});
 useEffect(()=>{(async()=>{try{const{data:sd}=await supabase.auth.getSession();const session=sd.session;if(!session){location.replace("/app");return}const{data:p}=await supabase.from("profiles").select("role,status,full_name").eq("id",session.user.id).maybeSingle();if(p?.role!=="operator"||p?.status!=="active"){location.replace("/app");return}
 const[schools,admins,teachers,learners,subs]=await Promise.all([
  supabase.from("schools").select("id,name,emis_code,status,province_id,district_id").order("name"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","school_admin"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher"),
  supabase.from("profiles").select("id",{count:"exact",head:true}).eq("role","student"),
  supabase.from("subscriptions").select("school_id",{count:"exact",head:true})
 ]);if(schools.error)throw schools.error;setS({loading:false,error:"",user:{name:p.full_name||"Platform Operator",email:session.user.email},schools:schools.data||[],metrics:{schools:schools.data?.length||0,administrators:admins.count||0,teachers:teachers.count||0,learners:learners.count||0,subscriptions:subs.count||0}})}catch(e){setS(x=>({...x,loading:false,error:e instanceof Error?e.message:"Unable to load the Operator portal."}))}})()},[]);
 async function out(){await supabase.auth.signOut();location.assign("/app")}
 if(s.loading)return <Loading label="Loading Operator portal..."/>;
 return <Shell title="Platform Operator" subtitle="Connected school and subscription oversight" user={s.user} onSignOut={out} icon={ShieldCheck}>
  {s.error?<div className="cb-portal-error">{s.error}</div>:null}
  <div className="cb-metric-grid"><Metric icon={School} label="Schools" value={s.metrics.schools}/><Metric icon={Users} label="Administrators" value={s.metrics.administrators}/><Metric icon={GraduationCap} label="Teachers" value={s.metrics.teachers}/><Metric icon={Users} label="Learners" value={s.metrics.learners}/><Metric icon={CreditCard} label="Subscriptions" value={s.metrics.subscriptions}/></div>
  <section className="cb-portal-card"><div className="cb-card-heading"><div><p>School registry</p><h2>Connected schools</h2></div><Building2 size={24}/></div>
   <div className="cb-school-table"><div className="cb-school-row cb-school-head"><span>School</span><span>EMIS</span><span>Status</span><span>Geography</span></div>
   {s.schools.map(sc=><div className="cb-school-row" key={sc.id}><strong>{sc.name}</strong><span>{sc.emis_code||"Not set"}</span><span>{sc.status||"Active"}</span><span>{sc.province_id&&sc.district_id?"Assigned":"Needs assignment"}</span></div>)}
   {!s.schools.length?<p className="cb-empty">No schools are available.</p>:null}</div>
  </section>
 </Shell>
}
function Metric({icon:Icon,label,value}){return <article className="cb-metric-card"><Icon size={21}/><strong>{Number(value||0).toLocaleString("en-GB")}</strong><span>{label}</span></article>}
function Shell({title,subtitle,user,onSignOut,icon:Icon,children}){return <main className="cb-portal-page"><aside className="cb-portal-sidebar"><img src="/brand/chalkboard-logo.png" alt="Chalkboard"/><div className="cb-portal-role"><Icon size={20}/><div><strong>{title}</strong><span>{subtitle}</span></div></div><div className="cb-portal-user"><strong>{user?.name}</strong><span>{user?.email}</span></div><button onClick={onSignOut} className="cb-signout"><LogOut size={18}/>Sign out</button></aside><section className="cb-portal-main"><header><p>Chalkboard</p><h1>{title}</h1><span>{subtitle}</span></header>
        <ExportToolbar title={'Platform Operator'} scopeSelector=".cb-portal-main" />{children}</section></main>}
function Loading({label}){return <main className="cb-portal-loading"><img src="/icon-192.png" alt=""/><p>{label}</p></main>}
