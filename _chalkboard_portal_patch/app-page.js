"use client";
import {Building2,Eye,EyeOff,Landmark,ShieldCheck} from "lucide-react";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabaseClient";

const portals={
 school_admin:{label:"School Administrator",description:"Manage attendance, learners, staff, finance, reports and school operations.",icon:Building2,route:"/app/admin"},
 operator:{label:"Platform Operator",description:"Manage connected schools, subscriptions and platform operations.",icon:ShieldCheck,route:"/app/operator"},
 ministry_official:{label:"Ministry Official",description:"Review aggregated school participation, enrolment and attendance information.",icon:Landmark,route:"/app/ministry"}
};

export default function ChalkboardAppLogin(){
 const[portal,setPortal]=useState("school_admin"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[show,setShow]=useState(false),[status,setStatus]=useState(""),[busy,setBusy]=useState(false),[checking,setChecking]=useState(true);
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){setChecking(false);return}const{data:p}=await supabase.from("profiles").select("role,school_id,status").eq("id",data.session.user.id).maybeSingle();if(p?.status==="active"&&portals[p.role]){location.replace(portals[p.role].route);return}setChecking(false)})()},[]);
 async function signIn(e){e.preventDefault();if(busy)return;setBusy(true);setStatus("");try{const{data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error||!data.user)throw error||new Error("Sign in failed.");const{data:p,error:pe}=await supabase.from("profiles").select("role,school_id,status").eq("id",data.user.id).maybeSingle();if(pe||!p){await supabase.auth.signOut();throw pe||new Error("No Chalkboard profile is linked to this account.")}if(p.status!=="active"){await supabase.auth.signOut();throw new Error("This Chalkboard account is not active.")}if(p.role!==portal){await supabase.auth.signOut();throw new Error(`These credentials belong to a ${portals[p.role]?.label||p.role} account.`)}if(p.role==="school_admin"&&!p.school_id){await supabase.auth.signOut();throw new Error("Your administrator account has not been assigned to a school. Contact the platform operator.")}location.assign(portals[p.role].route)}catch(err){setStatus(err instanceof Error?err.message:"Unable to sign in.");setBusy(false)}}
 if(checking)return <main className="cb-auth-page"><p>Checking your Chalkboard session...</p></main>;
 const selected=portals[portal];
 return <main className="cb-auth-page"><section className="cb-auth-card">
  <img src="/brand/chalkboard-logo.png" alt="Chalkboard" className="cb-auth-logo"/>
  <div className="cb-auth-heading"><p>School Management. Simplified.</p><h1>Sign in to Chalkboard</h1></div>
  <div className="cb-role-grid">{Object.entries(portals).map(([value,o])=>{const Icon=o.icon;return <button type="button" key={value} onClick={()=>{setPortal(value);setStatus("")}} className={portal===value?"cb-role-option active":"cb-role-option"}><Icon size={20}/><span><strong>{o.label}</strong><small>{o.description}</small></span></button>})}</div>
  <form onSubmit={signIn} className="cb-auth-form">
   <label><span>Email address</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
   <label><span>Password</span><div className="cb-password-field"><input required type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
   {status?<div className="cb-auth-error">{status}</div>:null}
   <button type="submit" disabled={busy} className="cb-auth-submit">{busy?"Signing in...":`Sign in as ${selected.label}`}</button>
  </form><a href="/" className="cb-back-link">Return to Chalkboard website</a>
 </section></main>
}
