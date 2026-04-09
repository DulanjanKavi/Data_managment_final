import { useState, useEffect, useCallback } from "react";
import * as API from "./api";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const SPECIALTIES = ["General Medicine","Cardiology","Dermatology","Pediatrics","Orthopedics","Neurology","Gynecology","ENT","Ophthalmology","Psychiatry","Oncology","Radiology"];
const DAYS        = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIME_SLOTS  = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

const fmt     = d => new Date(d).toLocaleDateString("en-LK",{weekday:"short",month:"short",day:"numeric"});
const fmtLong = d => new Date(d).toLocaleDateString("en-LK",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
const docName = doc => { if(!doc)return"?"; const n=doc.name?.[0]; return n?`Dr. ${n.given?.[0]||""} ${n.family||n.text||""}`.trim():"Unknown"; };
const docInit = doc => { const n=doc?.name?.[0]; return n?`${(n.given?.[0]||"")[0]}${(n.family||n.text||"")[0]}`:"?"; };

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const C = {
  navy:"#0B1F3A",navyLight:"#1E3D6A",teal:"#0B7C6E",tealLight:"#E6F5F3",tealMid:"#14A899",
  blue:"#1D6FA4",blueLight:"#EAF3FB",amber:"#C47E0B",amberLight:"#FEF5E7",
  red:"#C0392B",redLight:"#FDEDEC",green:"#1A7A4A",greenLight:"#E8F6EF",
  text:"#1A2535",textMid:"#4A5568",textLight:"#718096",border:"#E2E8F0",surface:"#F7F9FC",white:"#FFFFFF",
};

// ═══════════════════════════════════════════════════════════
// BASE UI COMPONENTS
// ═══════════════════════════════════════════════════════════
const Svg = ({d,size=18})=><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const ICONS={home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",plus:"M12 4v16m8-8H4",check:"M5 13l4 4L19 7",x:"M6 18L18 6M6 6l12 12",logout:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",chart:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",shield:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",hospital:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",stethoscope:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",arrow:"M15 19l-7-7 7-7"};
const Icon = ({name,size=18})=><Svg d={ICONS[name]} size={size}/>;

const Badge = ({status})=>{
  const m={booked:{bg:C.blueLight,c:C.blue},confirmed:{bg:C.greenLight,c:C.green},cancelled:{bg:C.redLight,c:C.red},completed:{bg:"#EEF2FF",c:"#4338CA"},pending:{bg:C.amberLight,c:C.amber}};
  const s=m[status]||m.pending;
  return <span style={{display:"inline-block",padding:"2px 10px",borderRadius:100,fontSize:11,fontWeight:600,background:s.bg,color:s.c,letterSpacing:.3}}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
};
const Pill = ({label,active,color,onClick})=><button onClick={onClick} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${active?color:C.border}`,background:active?color:"white",color:active?"white":C.textMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{label}</button>;
const Input = ({label,...props})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:4}}>{label}</label>}<input style={{width:"100%",boxSizing:"border-box",padding:"10px 13px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",background:C.white}} {...props}/></div>;
const Select = ({label,children,...props})=><div style={{marginBottom:12}}>{label&&<label style={{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:4}}>{label}</label>}<select style={{width:"100%",boxSizing:"border-box",padding:"10px 13px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",background:C.white}} {...props}>{children}</select></div>;
const Btn = ({label,onClick,color=C.blue,ghost=false,sm=false,icon,disabled=false})=><button onClick={onClick} disabled={disabled} style={{display:"flex",alignItems:"center",gap:6,padding:sm?"6px 13px":"10px 18px",borderRadius:9,border:`1.5px solid ${ghost?C.border:color}`,background:ghost?"white":(disabled?"#CBD5E0":color),color:ghost?C.textMid:"white",fontSize:sm?12:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?.7:1,transition:"all .15s"}}>{icon&&<Icon name={icon} size={15}/>}{label}</button>;
const Card = ({children,style={}})=><div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",padding:24,...style}}>{children}</div>;
const StatCard = ({label,value,color,icon})=><div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"18px 20px",borderLeft:`4px solid ${color}`}}><div style={{color,marginBottom:6}}><Icon name={icon} size={18}/></div><div style={{fontSize:28,fontWeight:700,color:C.navy,lineHeight:1}}>{value??<Spinner small/>}</div><div style={{fontSize:12,color:C.textLight,marginTop:4}}>{label}</div></div>;
const Avatar = ({initials,color,size=44})=><div style={{width:size,height:size,borderRadius:size/3,background:`${color}18`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",color,fontSize:size*.35,fontWeight:700,flexShrink:0}}>{initials}</div>;
const Spinner = ({small=false})=><div style={{display:"inline-block",width:small?16:28,height:small?16:28,border:`2px solid ${C.border}`,borderTopColor:C.teal,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;
const Err = ({msg,onDismiss})=>msg?<div style={{background:C.redLight,border:`1px solid ${C.red}30`,borderRadius:9,padding:"10px 14px",color:C.red,fontSize:13,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{msg}</span>{onDismiss&&<button onClick={onDismiss} style={{background:"none",border:"none",cursor:"pointer",color:C.red}}><Icon name="x" size={14}/></button>}</div>:null;

// ═══════════════════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════════════════
const Landing = ({onRole})=>{
  const roles=[{id:"patient",icon:"user",label:"Patient Portal",sub:"Register, login & book appointments",color:C.blue},{id:"doctor",icon:"stethoscope",label:"Doctor Portal",sub:"Manage schedule & appointments",color:C.teal},{id:"admin",icon:"hospital",label:"Hospital Admin",sub:"Monitor all hospital activity",color:C.amber}];
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,${C.navyLight} 60%,#0E4D41 100%)`,fontFamily:"system-ui,-apple-system,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.rc:hover{transform:translateY(-6px)!important}`}</style>
      <div style={{padding:"28px 40px",display:"flex",alignItems:"center",gap:12}}><div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"white"}}><Icon name="hospital" size={20}/></div><div><div style={{color:"white",fontSize:16,fontWeight:700}}>Colombo National Hospital</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:10,letterSpacing:2,textTransform:"uppercase",marginTop:1}}>FHIR R4 · HL7 · FastAPI · MongoDB</div></div></div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",animation:"fadeUp .6s ease-out"}}>
        <div style={{background:"rgba(14,185,166,0.15)",border:"1px solid rgba(14,185,166,0.3)",borderRadius:100,padding:"5px 16px",marginBottom:28,display:"inline-flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:"#4ADE80"}}/><span style={{color:"rgba(255,255,255,0.7)",fontSize:11,letterSpacing:1.5,fontWeight:600}}>SYSTEM ONLINE · SECURE</span></div>
        <h1 style={{color:"white",fontSize:"clamp(32px,5vw,60px)",fontWeight:700,textAlign:"center",lineHeight:1.15,margin:"0 0 12px",letterSpacing:-1}}>Healthcare,<br/><span style={{color:"#5EDBD4"}}>Reimagined.</span></h1>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:16,textAlign:"center",maxWidth:460,margin:"0 0 52px",lineHeight:1.7}}>Sri Lanka's first FHIR R4-compliant hospital platform — FastAPI backend, MongoDB database, JWT-secured.</p>
        <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",maxWidth:740}}>
          {roles.map(r=><button key={r.id} onClick={()=>onRole(r.id)} className="rc" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:18,padding:"28px 26px",width:210,cursor:"pointer",textAlign:"center",color:"white",transition:"all .25s cubic-bezier(.34,1.56,.64,1)"}}><div style={{width:58,height:58,borderRadius:14,background:`${r.color}25`,border:`1px solid ${r.color}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:r.color}}><Icon name={r.icon} size={26}/></div><div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{r.label}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{r.sub}</div></button>)}
        </div>
        <div style={{display:"flex",gap:24,marginTop:52,flexWrap:"wrap",justifyContent:"center"}}>
          {["HL7 FHIR R4","bcrypt Auth","JWT Sessions","256-bit Encrypted"].map(b=><div key={b} style={{display:"flex",alignItems:"center",gap:6,color:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:600}}><Icon name="shield" size={13}/>{b}</div>)}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════
const Auth = ({role,onSuccess,onBack})=>{
  const [mode,setMode]=useState("login");
  const [f,setF]=useState({email:"",password:"",name:"",nic:"",phone:"",dob:"",gender:"male"});
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const ri={patient:{label:"Patient Portal",color:C.blue,icon:"user"},doctor:{label:"Doctor Portal",color:C.teal,icon:"stethoscope"},admin:{label:"Admin Portal",color:C.amber,icon:"hospital"}}[role];

  const submit=async()=>{
    setErr(""); setLoading(true);
    try{
      if(mode==="register"){
        if(!f.name||!f.email||!f.password||!f.nic){setErr("Name, email, password and NIC are required.");setLoading(false);return;}
        const res=await API.register({name:f.name,email:f.email,password:f.password,nic:f.nic,phone:f.phone||undefined,birthDate:f.dob||undefined,gender:f.gender});
        onSuccess(res);
      } else {
        const res=await API.login(f.email,f.password,role);
        onSuccess(res);
      }
    } catch(e){ setErr(e.message); }
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy},${C.navyLight} 60%,#0E4D41)`,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,-apple-system,sans-serif"}}>
      <div style={{width:"100%",maxWidth:430}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",marginBottom:20,fontSize:13,display:"flex",alignItems:"center",gap:6}}><Icon name="arrow" size={15}/> Back</button>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:20,padding:36,border:"1px solid rgba(255,255,255,0.12)"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:50,height:50,borderRadius:13,background:`${ri.color}22`,border:`1px solid ${ri.color}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:ri.color}}><Icon name={ri.icon} size={22}/></div>
            <h2 style={{color:"white",fontSize:20,fontWeight:700,margin:0}}>{ri.label}</h2>
            {role==="patient"&&<div style={{display:"flex",gap:0,marginTop:14,background:"rgba(255,255,255,0.07)",borderRadius:9,padding:3}}>{["login","register"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:mode===m?"rgba(255,255,255,0.15)":"transparent",color:mode===m?"white":"rgba(255,255,255,0.45)",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>{m==="login"?"Sign In":"Create Account"}</button>)}</div>}
          </div>
          <style>{`.ai{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:9px;padding:11px 14px;color:white;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box;outline:none;margin-bottom:10px}.ai::placeholder{color:rgba(255,255,255,0.3)}.ai option{background:#1a3d6a}`}</style>
          {mode==="register"&&<><input className="ai" placeholder="Full Name *" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input className="ai" placeholder="NIC Number * (e.g. 199012345678V)" value={f.nic} onChange={e=>setF({...f,nic:e.target.value})}/><input className="ai" placeholder="Phone Number" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input className="ai" type="date" value={f.dob} onChange={e=>setF({...f,dob:e.target.value})}/><select className="ai" value={f.gender} onChange={e=>setF({...f,gender:e.target.value})} style={{marginBottom:10}}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></>}
          <input className="ai" type="email" placeholder="Email Address *" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/>
          <input className="ai" type="password" placeholder="Password *" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
          {err&&<div style={{background:"rgba(192,57,43,0.2)",borderRadius:8,padding:"8px 12px",color:"#F1948A",fontSize:12,marginBottom:10}}>{err}</div>}
          <button onClick={submit} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:loading?"wait":"pointer",background:ri.color,color:"white",fontSize:14,fontWeight:700,fontFamily:"inherit",marginTop:4,opacity:loading?.7:1}}>
            {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner small/> Please wait…</span>:(mode==="register"?"Create Account":"Sign In →")}
          </button>
          <div style={{textAlign:"center",marginTop:14,color:"rgba(255,255,255,0.25)",fontSize:11}}>{role==="patient"?"Demo: patient@demo.lk / pass123":role==="doctor"?"Demo: dr.priya@cnhospital.lk / doctor123":"Demo: admin@cnhospital.lk / admin123"}</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════
const Layout = ({user,role,view,setView,onLogout,children})=>{
  const navs={patient:[{id:"dashboard",icon:"home",label:"Dashboard"},{id:"find",icon:"search",label:"Find Doctors"},{id:"appointments",icon:"calendar",label:"My Appointments"},{id:"profile",icon:"user",label:"My Profile"}],doctor:[{id:"dashboard",icon:"home",label:"Dashboard"},{id:"schedule",icon:"calendar",label:"My Schedule"},{id:"availability",icon:"clock",label:"Availability"},{id:"appointments",icon:"bell",label:"Appointments"}],admin:[{id:"dashboard",icon:"chart",label:"Overview"},{id:"doctors",icon:"stethoscope",label:"Doctors"},{id:"appointments",icon:"calendar",label:"Appointments"},{id:"patients",icon:"user",label:"Patients"}]}[role];
  const rc={patient:C.blue,doctor:C.teal,admin:C.amber}[role];
  const uname=user?.name?.[0]?.text||user?.name||"User";
  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif",background:C.surface}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:230,background:C.navy,position:"fixed",top:0,left:0,height:"100vh",display:"flex",flexDirection:"column",zIndex:50}}>
        <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:8,background:`${rc}22`,display:"flex",alignItems:"center",justifyContent:"center",color:rc}}><Icon name="hospital" size={16}/></div><div><div style={{color:"white",fontSize:13,fontWeight:700,lineHeight:1.2}}>CNH Portal</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:9,letterSpacing:1.5,textTransform:"uppercase",marginTop:1}}>{role}</div></div></div></div>
        <div style={{padding:"14px 10px",flex:1,overflowY:"auto"}}>{navs.map(n=><button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",background:view===n.id?"rgba(255,255,255,0.12)":"transparent",color:view===n.id?"white":"rgba(255,255,255,0.5)",fontSize:13,fontWeight:view===n.id?600:400,fontFamily:"inherit",marginBottom:3,textAlign:"left",transition:"all .15s"}}><Icon name={n.icon} size={16}/>{n.label}</button>)}</div>
        <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.07)"}}><div style={{padding:"10px 12px",background:"rgba(255,255,255,0.06)",borderRadius:9,marginBottom:8}}><div style={{color:"white",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{uname}</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div></div><button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",padding:"7px 12px",width:"100%",fontSize:12,fontFamily:"inherit"}}><Icon name="logout" size={14}/> Sign Out</button></div>
      </div>
      <div style={{marginLeft:230,flex:1,padding:32,minHeight:"100vh"}}>{children}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PATIENT VIEWS
// ═══════════════════════════════════════════════════════════
const PatientDashboard = ({patient,appointments,doctors})=>{
  const today=new Date().toISOString().split("T")[0];
  const mine=appointments.filter(a=>a.patientId===patient.id);
  const upcoming=mine.filter(a=>a.date>=today&&a.status!=="cancelled").sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 4px"}}>Good day, {patient.name?.[0]?.text?.split(" ")[0]||"Patient"} 👋</h1>
      <p style={{color:C.textLight,fontSize:14,marginBottom:24}}>Here's your health overview</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
        <StatCard label="Upcoming Appointments" value={upcoming.length} color={C.blue} icon="calendar"/>
        <StatCard label="Completed Visits" value={mine.filter(a=>a.status==="completed").length} color={C.teal} icon="check"/>
        <StatCard label="Doctors Seen" value={new Set(mine.map(a=>a.doctorId)).size} color="#6C3483" icon="stethoscope"/>
      </div>
      <Card>
        <h3 style={{fontWeight:700,fontSize:16,color:C.navy,margin:"0 0 16px"}}>Upcoming Appointments</h3>
        {upcoming.length===0?<div style={{textAlign:"center",padding:"32px 0",color:C.textLight}}><Icon name="calendar" size={36}/><p>No upcoming appointments. Find a doctor to book.</p></div>:
          upcoming.slice(0,5).map((a,i)=>{const doc=doctors.find(d=>d.id===a.doctorId);return(<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<upcoming.length-1?`1px solid ${C.border}`:"none"}}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar initials={doc?docInit(doc):"?"} color={C.blue} size={42}/><div><div style={{fontWeight:600,fontSize:14,color:C.text}}>{doc?docName(doc):"Unknown Doctor"}</div><div style={{fontSize:12,color:C.textLight}}>{doc?.specialty} · {fmt(a.date)} at {a.time}</div></div></div><Badge status={a.status}/></div>);})
        }
      </Card>
    </div>
  );
};

const FindDoctors = ({doctors,patient,onRefreshAppointments})=>{
  const [spec,setSpec]=useState(""); const [selDoc,setSelDoc]=useState(null);
  const [selDate,setSelDate]=useState(""); const [slots,setSlots]=useState([]); const [loadingSlots,setLoadingSlots]=useState(false);
  const [selSlot,setSelSlot]=useState(""); const [reason,setReason]=useState(""); const [done,setDone]=useState(false);
  const [booking,setBooking]=useState(false); const [err,setErr]=useState("");
  const today=new Date().toISOString().split("T")[0];
  const filtered=doctors.filter(d=>d.active&&(!spec||d.specialty===spec));

  useEffect(()=>{
    if(!selDoc||!selDate)return;
    setLoadingSlots(true); setSelSlot(""); setSlots([]);
    API.getSlots(selDoc.id,selDate).then(s=>{setSlots(s);setLoadingSlots(false);}).catch(()=>setLoadingSlots(false));
  },[selDoc,selDate]);

  const book=async()=>{
    if(!selSlot)return; setBooking(true); setErr("");
    try{
      await API.bookAppointment({doctorId:selDoc.id,date:selDate,time:selSlot,reason:reason||undefined});
      await onRefreshAppointments(); setDone(true);
    } catch(e){setErr(e.message);}
    setBooking(false);
  };

  if(done)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{width:70,height:70,borderRadius:"50%",background:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",color:C.teal,marginBottom:16}}><Icon name="check" size={32}/></div><h2 style={{color:C.navy,fontWeight:700,fontSize:22,margin:"0 0 8px"}}>Appointment Confirmed!</h2><p style={{color:C.textLight,textAlign:"center",maxWidth:340}}>Your appointment with {docName(selDoc)} on {fmtLong(selDate)} at {selSlot} has been booked.</p><Btn label="Book Another" onClick={()=>{setDone(false);setSelDoc(null);setSelDate("");setSelSlot("");setReason("");setSlots([]);}} color={C.blue}/></div>);

  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 4px"}}>Find a Doctor</h1>
      <p style={{color:C.textLight,fontSize:14,marginBottom:20}}>Search and book appointments with our specialists</p>
      <Card style={{padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
        <Icon name="search" size={18}/><span style={{color:C.textLight,fontSize:13}}>Specialty:</span>
        <select value={spec} onChange={e=>{setSpec(e.target.value);setSelDoc(null);}} style={{border:"none",outline:"none",fontSize:13,color:C.text,fontFamily:"inherit",background:"transparent",flex:1}}><option value="">All Specialties</option>{SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}</select>
      </Card>
      {!selDoc?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>
          {filtered.map(doc=><div key={doc.id} onClick={()=>setSelDoc(doc)} style={{background:"white",borderRadius:14,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",padding:20,cursor:"pointer",transition:"all .2s"}}><div style={{display:"flex",gap:13,alignItems:"flex-start"}}><Avatar initials={docInit(doc)} color={C.blue} size={50}/><div><div style={{fontWeight:700,fontSize:14,color:C.text}}>{docName(doc)}</div><div style={{color:C.blue,fontSize:12,fontWeight:600,marginTop:2}}>{doc.specialty}</div><div style={{color:C.textLight,fontSize:11,marginTop:3}}>{doc.qualification||"—"}</div></div></div><div style={{marginTop:14,padding:"7px 11px",background:C.surface,borderRadius:7,display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.textLight}}><Icon name="calendar" size={13}/> Click to book an appointment</div></div>)}
        </div>
      ):(
        <div>
          <button onClick={()=>{setSelDoc(null);setSelDate("");setSelSlot("");setSlots([]);setErr("");}} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",marginBottom:18,fontSize:13,display:"flex",alignItems:"center",gap:6}}><Icon name="arrow" size={14}/> Back to doctors</button>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:22}}>
            <Card>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:20}}><Avatar initials={docInit(selDoc)} color={C.blue} size={54}/><div><div style={{fontWeight:700,fontSize:16,color:C.text}}>{docName(selDoc)}</div><div style={{color:C.blue,fontSize:13,fontWeight:600}}>{selDoc.specialty}</div><div style={{color:C.textLight,fontSize:12}}>{selDoc.qualification||"—"}</div></div></div>
              <Input label="Select Date" type="date" min={today} value={selDate} onChange={e=>{setSelDate(e.target.value);setSelSlot("");}}/>
              <div style={{marginBottom:12}}><label style={{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:4}}>Reason for Visit</label><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Brief description of your concern…" rows={3} style={{width:"100%",boxSizing:"border-box",padding:"10px 13px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:13,fontFamily:"inherit",color:C.text,outline:"none",resize:"none"}}/></div>
            </Card>
            <Card>
              <h3 style={{fontWeight:700,fontSize:15,color:C.navy,margin:"0 0 14px"}}>{selDate?`Available Slots — ${fmt(selDate)}`:"Select a date to see slots"}</h3>
              {loadingSlots&&<div style={{textAlign:"center",padding:"32px 0"}}><Spinner/></div>}
              {!loadingSlots&&selDate&&slots.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:C.textLight}}><Icon name="clock" size={32}/><p>No available slots on this date.</p></div>}
              {!loadingSlots&&slots.length>0&&<>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>{slots.map(s=><button key={s} onClick={()=>setSelSlot(s)} style={{padding:"7px 13px",borderRadius:7,border:`1.5px solid ${selSlot===s?C.blue:C.border}`,background:selSlot===s?C.blue:"white",color:selSlot===s?"white":C.blue,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{s}</button>)}</div>
                {selSlot&&<div style={{background:C.blueLight,borderRadius:10,padding:14,marginBottom:14}}><div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:6}}>Appointment Summary</div>{[["Doctor",docName(selDoc)],["Date",fmtLong(selDate)],["Time",selSlot],["Duration","30 minutes"]].map(([k,v])=><div key={k} style={{fontSize:12,color:C.textMid,marginTop:4}}><span style={{fontWeight:600}}>{k}:</span> {v}</div>)}</div>}
                <Err msg={err} onDismiss={()=>setErr("")}/>
                <Btn label={booking?"Booking…":selSlot?"Confirm Booking":"Select a time slot"} onClick={book} color={C.blue} disabled={!selSlot||booking}/>
              </>}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

const PatientAppointments = ({patient,appointments,doctors,onCancel})=>{
  const [filter,setFilter]=useState("all"); const [cancelling,setCancelling]=useState(null);
  const today=new Date().toISOString().split("T")[0];
  const mine=appointments.filter(a=>a.patientId===patient.id);
  const filtered=mine.filter(a=>filter==="all"||a.status===filter).sort((a,b)=>b.date.localeCompare(a.date));
  const cancel=async(id)=>{ setCancelling(id); await onCancel(id); setCancelling(null); };
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 20px"}}>My Appointments</h1>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>{["all","booked","completed","cancelled"].map(f=><Pill key={f} label={f.charAt(0).toUpperCase()+f.slice(1)} active={filter===f} color={C.blue} onClick={()=>setFilter(f)}/>)}</div>
      <Card style={{padding:0}}>
        {filtered.length===0?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}><Icon name="calendar" size={36}/><p>No appointments found.</p></div>:
          filtered.map((a,i)=>{const doc=doctors.find(d=>d.id===a.doctorId);const isPast=a.date<today;return(<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 22px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none"}}><div style={{display:"flex",gap:13,alignItems:"center"}}><Avatar initials={doc?docInit(doc):"?"} color={C.teal} size={44}/><div><div style={{fontWeight:600,fontSize:14,color:C.text}}>{doc?docName(doc):"Unknown"}</div><div style={{fontSize:12,color:C.textLight}}>{doc?.specialty}</div><div style={{fontSize:11,color:C.textLight}}>{fmtLong(a.date)} at {a.time}</div>{a.reason&&<div style={{fontSize:11,color:C.textLight,fontStyle:"italic",marginTop:2}}>{a.reason}</div>}</div></div><div style={{display:"flex",gap:10,alignItems:"center"}}><Badge status={a.status}/>{a.status==="booked"&&!isPast&&<button onClick={()=>cancel(a.id)} disabled={cancelling===a.id} style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${C.border}`,background:"white",color:C.red,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{cancelling===a.id?"…":"Cancel"}</button>}</div></div>);})}
      </Card>
    </div>
  );
};

const PatientProfile = ({patient})=>(
  <div>
    <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 20px"}}>My Profile</h1>
    <Card style={{maxWidth:520}}>
      <div style={{display:"flex",gap:18,alignItems:"center",marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${C.border}`}}><Avatar initials={(patient?.name?.[0]?.text||"P").charAt(0)} color={C.blue} size={66}/><div><div style={{fontWeight:700,fontSize:20,color:C.navy}}>{patient?.name?.[0]?.text||"Patient"}</div><div style={{color:C.textLight,fontSize:13,marginTop:3}}>{patient?.email}</div><div style={{display:"inline-block",marginTop:7,background:C.blueLight,color:C.blue,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:600}}>Patient</div></div></div>
      {[["NIC Number",patient?.identifier?.[0]?.value],["Phone",patient?.telecom?.[0]?.value||"—"],["Date of Birth",patient?.birthDate||"—"],["Gender",patient?.gender||"—"],["Registered",patient?.registeredAt?new Date(patient.registeredAt).toLocaleDateString("en-LK"):"—"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.textLight,fontWeight:600}}>{k}</span><span style={{fontSize:13,color:C.text,fontWeight:500}}>{v}</span></div>)}
      <div style={{marginTop:20,padding:14,background:C.greenLight,borderRadius:10,display:"flex",gap:10,alignItems:"flex-start"}}><div style={{color:C.teal,marginTop:1}}><Icon name="shield" size={16}/></div><div style={{fontSize:12,color:"#0B4D3B",lineHeight:1.6}}><strong>FHIR R4 Compliant</strong> — Your data is stored as an HL7 FHIR Patient resource. Passwords hashed with bcrypt. Sessions secured via JWT. PDPA Sri Lanka aligned.</div></div>
    </Card>
  </div>
);

// ═══════════════════════════════════════════════════════════
// DOCTOR VIEWS
// ═══════════════════════════════════════════════════════════
const DoctorDashboard = ({doctor,appointments,patients})=>{
  const today=new Date().toISOString().split("T")[0];
  const mine=appointments.filter(a=>a.doctorId===doctor.id);
  const todayA=mine.filter(a=>a.date===today&&a.status!=="cancelled").sort((a,b)=>a.time.localeCompare(b.time));
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 4px"}}>{docName(doctor)} 👨‍⚕️</h1>
      <p style={{color:C.textLight,fontSize:14,marginBottom:24}}>{doctor.specialty} · {doctor.qualification||"—"}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <StatCard label="Today's Patients" value={todayA.length} color={C.teal} icon="user"/>
        <StatCard label="Upcoming" value={mine.filter(a=>a.date>today&&a.status==="booked").length} color={C.blue} icon="calendar"/>
        <StatCard label="Total Bookings" value={mine.filter(a=>a.status!=="cancelled").length} color="#6C3483" icon="chart"/>
        <StatCard label="Completed" value={mine.filter(a=>a.status==="completed").length} color={C.green} icon="check"/>
      </div>
      <Card>
        <h3 style={{fontWeight:700,fontSize:16,color:C.navy,margin:"0 0 16px"}}>Today's Schedule — {fmtLong(today)}</h3>
        {todayA.length===0?<div style={{textAlign:"center",padding:"24px 0",color:C.textLight}}>No appointments scheduled today.</div>:
          todayA.map((a,i)=>{const pat=patients.find(p=>p.id===a.patientId);return(<div key={a.id} style={{display:"flex",alignItems:"center",gap:13,padding:"11px 0",borderBottom:i<todayA.length-1?`1px solid ${C.border}`:"none"}}><Avatar initials={(pat?.name?.[0]?.text||"P").charAt(0)} color={C.teal} size={42}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:C.text}}>{pat?.name?.[0]?.text||"Unknown"}</div><div style={{fontSize:12,color:C.textLight}}>{a.time} · {a.reason||"General consultation"}</div></div><Badge status={a.status}/></div>);})
        }
      </Card>
    </div>
  );
};

const DoctorScheduleView = ({doctor,appointments,schedule})=>{
  const today=new Date(); const [weekOff,setWeekOff]=useState(0);
  const start=new Date(today); start.setDate(today.getDate()-today.getDay()+1+weekOff*7);
  const weekDates=DAYS.map((day,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return{day,date:d.toISOString().split("T")[0],display:d.toLocaleDateString("en-LK",{day:"numeric",month:"short"})};});
  const sch=schedule||{weekly:{},overrides:{}};
  const getSlots=date=>{ const day=new Date(date).toLocaleDateString("en-US",{weekday:"long"}); return sch.overrides?.[date]!==undefined?sch.overrides[date]:(sch.weekly?.[day]||[]); };
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:0}}>My Schedule</h1><div style={{display:"flex",gap:10,alignItems:"center"}}><Btn label="← Prev" onClick={()=>setWeekOff(w=>w-1)} ghost sm/><span style={{fontSize:13,color:C.textLight,fontWeight:600}}>Week of {new Date(weekDates[0].date).toLocaleDateString("en-LK",{day:"numeric",month:"long"})}</span><Btn label="Next →" onClick={()=>setWeekOff(w=>w+1)} ghost sm/></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
        {weekDates.map(({day,date,display})=>{
          const avail=getSlots(date); const booked=appointments.filter(a=>a.doctorId===doctor.id&&a.date===date&&a.status!=="cancelled").map(a=>a.time);
          const isToday=date===today.toISOString().split("T")[0];
          return(<div key={date} style={{background:C.white,borderRadius:12,border:`1px solid ${isToday?C.teal:C.border}`,padding:12,borderTop:`3px solid ${isToday?C.teal:"transparent"}`}}><div style={{fontWeight:700,fontSize:11,color:isToday?C.teal:C.text,marginBottom:1}}>{day.slice(0,3)}</div><div style={{fontSize:10,color:C.textLight,marginBottom:10}}>{display}</div>{booked.map(t=><div key={t} style={{background:C.blueLight,borderRadius:5,padding:"3px 6px",marginBottom:4,fontSize:10,color:C.blue,fontWeight:600}}>{t} ●</div>)}{avail.filter(s=>!booked.includes(s)).map(s=><div key={s} style={{background:C.tealLight,borderRadius:5,padding:"3px 6px",marginBottom:4,fontSize:10,color:C.teal,fontWeight:500}}>{s}</div>)}{avail.length===0&&booked.length===0&&<div style={{fontSize:10,color:C.border,textAlign:"center",paddingTop:8}}>Off</div>}</div>);
        })}
      </div>
      <div style={{display:"flex",gap:18,marginTop:14,fontSize:12,color:C.textLight}}><div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:10,height:10,borderRadius:3,background:C.blueLight,border:`1px solid ${C.blue}`}}/> Booked</div><div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{width:10,height:10,borderRadius:3,background:C.tealLight,border:`1px solid ${C.teal}`}}/> Available</div></div>
    </div>
  );
};

const DoctorAvailability = ({doctor,schedule,onRefreshSchedule})=>{
  const [tab,setTab]=useState("weekly");
  const [weekly,setWeekly]=useState(schedule?.weekly||Object.fromEntries(DAYS.map(d=>[d,[]])));
  const [overrides,setOverrides]=useState(schedule?.overrides||{});
  const [ovDate,setOvDate]=useState(""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState("");

  useEffect(()=>{if(schedule){setWeekly(schedule.weekly||Object.fromEntries(DAYS.map(d=>[d,[]])));setOverrides(schedule.overrides||{});}},[schedule]);

  const toggleW=(day,slot)=>{const cur=weekly[day]||[];setWeekly({...weekly,[day]:cur.includes(slot)?cur.filter(s=>s!==slot):[...cur,slot].sort()});};
  const toggleO=slot=>{if(!ovDate)return;const cur=overrides[ovDate]||[];setOverrides({...overrides,[ovDate]:cur.includes(slot)?cur.filter(s=>s!==slot):[...cur,slot].sort()});};

  const save=async()=>{
    setSaving(true);setErr("");
    try{
      await API.updateWeekly(weekly);
      for(const[date,slots] of Object.entries(overrides)){await API.setOverride(date,slots);}
      await onRefreshSchedule(); setSaved(true); setTimeout(()=>setSaved(false),2500);
    }catch(e){setErr(e.message);}
    setSaving(false);
  };

  const removeOverride=async date=>{
    try{await API.deleteOverride(date); const o={...overrides}; delete o[date]; setOverrides(o); await onRefreshSchedule();}catch(e){setErr(e.message);}
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:0}}>Manage Availability</h1><p style={{color:C.textLight,fontSize:13,marginTop:4}}>Set weekly template or override specific dates</p></div><div style={{display:"flex",gap:10,alignItems:"center"}}>{saved&&<span style={{color:C.teal,fontWeight:600,fontSize:13}}>✓ Saved!</span>}<Btn label={saving?"Saving…":"Save Changes"} onClick={save} color={C.teal} disabled={saving}/></div></div>
      <Err msg={err} onDismiss={()=>setErr("")}/>
      <div style={{display:"flex",gap:0,marginBottom:22,background:C.white,borderRadius:10,padding:4,border:`1px solid ${C.border}`,width:"fit-content"}}>{[{id:"weekly",label:"Weekly Template"},{id:"override",label:"Date Overrides"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 18px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:tab===t.id?C.teal:"transparent",color:tab===t.id?"white":C.textLight}}>{t.label}</button>)}</div>
      {tab==="weekly"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{DAYS.map(day=><Card key={day} style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}><div style={{width:100,fontWeight:700,fontSize:13,color:C.text}}>{day}</div><div style={{fontSize:11,color:C.textLight}}>{(weekly[day]||[]).length} slots</div></div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{TIME_SLOTS.map(s=>{const active=(weekly[day]||[]).includes(s);return<button key={s} onClick={()=>toggleW(day,s)} style={{padding:"5px 11px",borderRadius:7,border:`1.5px solid ${active?C.teal:C.border}`,background:active?C.teal:"white",color:active?"white":C.textLight,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{s}</button>;})}</div></Card>)}</div>}
      {tab==="override"&&<div><Card style={{marginBottom:16}}><Input label="Select Date to Override" type="date" min={new Date().toISOString().split("T")[0]} value={ovDate} onChange={e=>setOvDate(e.target.value)} style={{maxWidth:260}}/>{ovDate&&<><div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:10}}>Slots for {fmtLong(ovDate)}</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{TIME_SLOTS.map(s=>{const active=(overrides[ovDate]||[]).includes(s);return<button key={s} onClick={()=>toggleO(s)} style={{padding:"5px 11px",borderRadius:7,border:`1.5px solid ${active?C.teal:C.border}`,background:active?C.teal:"white",color:active?"white":C.textLight,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>{s}</button>;})}</div><div style={{marginTop:10,fontSize:11,color:C.textLight}}>💡 Select 0 slots to mark this day fully unavailable.</div></>}</Card>
        {Object.keys(overrides).length>0&&<Card><h4 style={{fontWeight:700,fontSize:14,color:C.navy,margin:"0 0 12px"}}>Active Overrides</h4>{Object.entries(overrides).sort(([a],[b])=>a.localeCompare(b)).map(([date,slots])=><div key={date} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{fmtLong(date)}</div><div style={{fontSize:11,color:C.textLight}}>{slots.length===0?"Fully unavailable":`${slots.length} slots: ${slots.join(", ")}`}</div></div><Btn label="Remove" onClick={()=>removeOverride(date)} color={C.red} sm ghost/></div>)}</Card>}
      </div>}
    </div>
  );
};

const DoctorAppointments = ({doctor, appointments, patients, onStatus, onRefreshPatients}) => {
  useEffect(() => {
    if (onRefreshPatients) onRefreshPatients();
  }, []);

  const [filter,setFilter]=useState("booked"); const [updating,setUpdating]=useState(null);
  const today=new Date().toISOString().split("T")[0];
  const mine=appointments.filter(a=>a.doctorId===doctor.id).filter(a=>filter==="all"||a.status===filter).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  const markDone=async id=>{setUpdating(id); await onStatus(id,"completed"); setUpdating(null);};
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 20px"}}>Appointments</h1>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>{["booked","completed","cancelled","all"].map(f=><Pill key={f} label={f.charAt(0).toUpperCase()+f.slice(1)} active={filter===f} color={C.teal} onClick={()=>setFilter(f)}/>)}</div>
      <Card style={{padding:0}}>
        {mine.length===0?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}><Icon name="calendar" size={36}/><p>No appointments found.</p></div>:
          mine.map((a,i)=>{const pat=patients.find(p=>p.id===a.patientId);const isPast=a.date<today;return(<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 22px",borderBottom:i<mine.length-1?`1px solid ${C.border}`:"none"}}><div style={{display:"flex",gap:13,alignItems:"center"}}><Avatar initials={(pat?.name?.[0]?.text||"P").charAt(0)} color={C.blue} size={44}/><div><div style={{fontWeight:600,fontSize:14,color:C.text}}>{pat?.name?.[0]?.text||"Unknown"}</div><div style={{fontSize:12,color:C.textLight}}>{fmtLong(a.date)} · {a.time}</div>{a.reason&&<div style={{fontSize:11,color:C.textLight,fontStyle:"italic"}}>{a.reason}</div>}</div></div><div style={{display:"flex",gap:10,alignItems:"center"}}><Badge status={a.status}/>{a.status==="booked"&&(a.date<=today)&&<button onClick={()=>markDone(a.id)} disabled={updating===a.id} style={{padding:"5px 12px",borderRadius:7,border:"none",background:C.teal,color:"white",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{updating===a.id?"…":"Mark Complete"}</button>}</div></div>);})
        }
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ADMIN VIEWS
// ═══════════════════════════════════════════════════════════
const AdminDashboard = ({stats,doctors,appointments,patients})=>{
  const today=new Date().toISOString().split("T")[0];
  const todayA=appointments.filter(a=>a.date===today&&a.status!=="cancelled");
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 4px"}}>Hospital Overview</h1>
      <p style={{color:C.textLight,fontSize:14,marginBottom:24}}>Colombo National Hospital — Real-time Operations</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <StatCard label="Active Doctors" value={stats?.activeDoctors} color={C.teal} icon="stethoscope"/>
        <StatCard label="Registered Patients" value={stats?.totalPatients} color={C.blue} icon="user"/>
        <StatCard label="Today's Appointments" value={stats?.todayAppointments} color={C.amber} icon="calendar"/>
        <StatCard label="Active Bookings" value={stats?.activeBookings} color="#6C3483" icon="clock"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card><h3 style={{fontWeight:700,fontSize:15,color:C.navy,margin:"0 0 14px"}}>Active Doctors by Specialty</h3>{[...new Set(doctors.filter(d=>d.active).map(d=>d.specialty))].map(s=>{const cnt=doctors.filter(d=>d.specialty===s&&d.active).length;const ac=appointments.filter(a=>doctors.some(d=>d.specialty===s&&d.id===a.doctorId)).length;return(<div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{s}</div><div style={{fontSize:11,color:C.textLight}}>{cnt} doctor{cnt>1?"s":""}</div></div><div style={{background:C.tealLight,color:C.teal,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{ac} appts</div></div>);})}</Card>
        <Card><h3 style={{fontWeight:700,fontSize:15,color:C.navy,margin:"0 0 14px"}}>Today's Activity</h3>{todayA.length===0?<div style={{textAlign:"center",padding:"32px 0",color:C.textLight}}>No appointments today.</div>:todayA.sort((a,b)=>a.time.localeCompare(b.time)).slice(0,8).map((a,i)=>{const doc=doctors.find(d=>d.id===a.doctorId);const pat=patients.find(p=>p.id===a.patientId);return(<div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}><div><div style={{fontWeight:600,color:C.text}}>{pat?.name?.[0]?.text||"Unknown"}</div><div style={{color:C.textLight}}>→ {doc?docName(doc):"?"}</div></div><div style={{color:C.textLight}}>{a.time}</div></div>);})}</Card>
      </div>
    </div>
  );
};

const AdminDoctors = ({doctors,onRefreshDoctors})=>{
  const [showForm,setShowForm]=useState(false);
  const [f,setF]=useState({name:"",email:"",password:"",specialty:"General Medicine",qualification:"",phone:"",gender:"male",slmc:""});
  const [err,setErr]=useState(""); const [adding,setAdding]=useState(false); const [toggling,setToggling]=useState(null);

  const add=async()=>{
    if(!f.name||!f.email||!f.password||!f.slmc){setErr("Name, email, password and SLMC number are required.");return;}
    setAdding(true);setErr("");
    try{await API.adminAddDoctor({name:f.name,email:f.email,password:f.password,slmc:f.slmc,specialty:f.specialty,qualification:f.qualification||undefined,phone:f.phone||undefined,gender:f.gender});await onRefreshDoctors();setF({name:"",email:"",password:"",specialty:"General Medicine",qualification:"",phone:"",gender:"male",slmc:""});setShowForm(false);}
    catch(e){setErr(e.message);}
    setAdding(false);
  };

  const toggle=async id=>{setToggling(id);try{await API.adminToggleDoctor(id);await onRefreshDoctors();}catch(e){setErr(e.message);}setToggling(null);};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><div><h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:0}}>Manage Doctors</h1><p style={{color:C.textLight,fontSize:13,marginTop:4}}>Add and manage medical staff</p></div><Btn label="Add Doctor" icon="plus" onClick={()=>setShowForm(!showForm)} color={C.amber}/></div>
      <Err msg={err} onDismiss={()=>setErr("")}/>
      {showForm&&<Card style={{marginBottom:20,borderTop:`3px solid ${C.amber}`}}><h3 style={{fontWeight:700,fontSize:15,color:C.navy,margin:"0 0 18px"}}>Add New Doctor</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Input label="Full Name *" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="e.g. Kamal Jayawardena"/><Input label="SLMC Registration No. *" value={f.slmc} onChange={e=>setF({...f,slmc:e.target.value})} placeholder="e.g. SLMC-99999"/><Input label="Email *" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="dr.name@cnhospital.lk"/><Input label="Temporary Password *" type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/><Select label="Specialty" value={f.specialty} onChange={e=>setF({...f,specialty:e.target.value})}>{SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}</Select><Input label="Qualification" value={f.qualification} onChange={e=>setF({...f,qualification:e.target.value})} placeholder="MBBS, MD"/><Input label="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+94771234567"/><Select label="Gender" value={f.gender} onChange={e=>setF({...f,gender:e.target.value})}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></div><div style={{display:"flex",gap:10,marginTop:4}}><Btn label={adding?"Adding…":"Add Doctor"} onClick={add} color={C.amber} disabled={adding}/><Btn label="Cancel" onClick={()=>{setShowForm(false);setErr("");}} ghost/></div></Card>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{doctors.map(doc=><Card key={doc.id} style={{opacity:doc.active?1:.65}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar initials={docInit(doc)} color={C.amber} size={48}/><div><div style={{fontWeight:700,fontSize:14,color:C.text}}>{docName(doc)}</div><div style={{color:C.amber,fontSize:12,fontWeight:600,marginTop:2}}>{doc.specialty}</div></div></div><div style={{display:"inline-flex",alignItems:"center",gap:5,background:doc.active?C.greenLight:"#F1F5F9",borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:700,color:doc.active?C.teal:"#94A3B8"}}><div style={{width:5,height:5,borderRadius:"50%",background:doc.active?C.teal:"#94A3B8"}}/>{doc.active?"Active":"Inactive"}</div></div>{[["🎓",doc.qualification||"—"],["📧",doc.email],["📞",doc.phone||"—"],["🪪",doc.identifier?.[0]?.value||"—"]].map(([ic,v])=><div key={v} style={{fontSize:11,color:C.textLight,marginBottom:4}}>{ic} {v}</div>)}<div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><button onClick={()=>toggle(doc.id)} disabled={toggling===doc.id} style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${C.border}`,background:"white",color:doc.active?C.red:C.teal,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{toggling===doc.id?"…":doc.active?"Deactivate":"Activate"}</button></div></Card>)}</div>
    </div>
  );
};

const AdminAppointments = ({appointments,doctors,patients})=>{
  const [filter,setFilter]=useState("all"); const [search,setSearch]=useState("");
  const filtered=appointments.filter(a=>filter==="all"||a.status===filter).filter(a=>{if(!search)return true;const doc=doctors.find(d=>d.id===a.doctorId);const pat=patients.find(p=>p.id===a.patientId);return(doc?docName(doc):"").toLowerCase().includes(search.toLowerCase())||(pat?.name?.[0]?.text||"").toLowerCase().includes(search.toLowerCase());}).sort((a,b)=>b.date.localeCompare(a.date));
  return(
    <div>
      <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 20px"}}>All Appointments</h1>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}><Card style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",flex:"1 1 200px"}}><Icon name="search" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient or doctor…" style={{border:"none",outline:"none",fontSize:13,color:C.text,fontFamily:"inherit",background:"transparent",width:"100%"}}/></Card>{["all","booked","completed","cancelled"].map(f=><Pill key={f} label={f.charAt(0).toUpperCase()+f.slice(1)} active={filter===f} color={C.amber} onClick={()=>setFilter(f)}/>)}</div>
      <Card style={{padding:0}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1.5fr 1fr 0.8fr 1fr",gap:8,padding:"10px 22px",background:C.surface,borderRadius:"13px 13px 0 0",borderBottom:`1px solid ${C.border}`}}>{["Patient","Doctor","Date","Time","Status"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:C.textLight,letterSpacing:1,textTransform:"uppercase"}}>{h}</div>)}</div>
        {filtered.length===0?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}>No appointments found.</div>:filtered.map((a,i)=>{const doc=doctors.find(d=>d.id===a.doctorId);const pat=patients.find(p=>p.id===a.patientId);return(<div key={a.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1.5fr 1fr 0.8fr 1fr",gap:8,padding:"12px 22px",borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{pat?.name?.[0]?.text||"Unknown"}</div><div style={{fontSize:12,color:C.textMid}}>{doc?docName(doc):"?"} <span style={{color:C.textLight,fontSize:11}}>· {doc?.specialty}</span></div><div style={{fontSize:12,color:C.textLight}}>{fmt(a.date)}</div><div style={{fontSize:12,color:C.textLight}}>{a.time}</div><Badge status={a.status}/></div>);})}
      </Card>
    </div>
  );
};

const AdminPatients = ({patients,appointments})=>(
  <div>
    <h1 style={{fontSize:26,fontWeight:700,color:C.navy,margin:"0 0 20px"}}>Registered Patients</h1>
    <Card style={{padding:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 0.7fr",gap:8,padding:"10px 22px",background:C.surface,borderRadius:"13px 13px 0 0",borderBottom:`1px solid ${C.border}`}}>{["Name","NIC","Phone","Registered","Appts"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:C.textLight,letterSpacing:1,textTransform:"uppercase"}}>{h}</div>)}</div>
      {patients.length===0?<div style={{textAlign:"center",padding:"48px 0",color:C.textLight}}>No patients yet.</div>:patients.map((p,i)=><div key={p.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 0.7fr",gap:8,padding:"12px 22px",borderBottom:i<patients.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{p.name?.[0]?.text||"?"}</div><div style={{fontSize:12,color:C.textMid}}>{p.identifier?.[0]?.value||"—"}</div><div style={{fontSize:12,color:C.textLight}}>{p.telecom?.[0]?.value||"—"}</div><div style={{fontSize:12,color:C.textLight}}>{p.registeredAt?new Date(p.registeredAt).toLocaleDateString("en-LK"):"—"}</div><div style={{background:C.blueLight,color:C.blue,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:700,textAlign:"center",width:"fit-content"}}>{appointments.filter(a=>a.patientId===p.id).length}</div></div>)}
    </Card>
  </div>
);

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [role,   setRole]   = useState(null);
  const [user,   setUser]   = useState(null);
  const [view,   setView]   = useState("dashboard");

  // Shared data
  const [doctors,      setDoctors]      = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [schedule,     setSchedule]     = useState(null);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(false);

  // Register logout callback with API client
  useEffect(()=>{ API.api.onUnauthorized(logout); },[]);

  const logout = useCallback(()=>{
    API.api.clearToken();
    setUser(null); setRole(null);
    setDoctors([]); setPatients([]); setAppointments([]); setSchedule(null); setStats(null);
    setScreen("landing");
  },[]);

  // ── Load data after login ──────────────────────────────
  const loadData = useCallback(async (r, u) => {
    setLoading(true);
    try {
      if (r === "patient") {
        const [docs, appts] = await Promise.all([API.getDoctors(), API.getAppointments()]);
        setDoctors(docs); setAppointments(appts);
      } else if (r === "doctor") {
        const [appts, sch, allPats] = await Promise.all([API.getAppointments(), API.getSchedule(), API.getMyPatients().catch(()=>[])]);
        setAppointments(appts); setSchedule(sch); setPatients(allPats);
      } else if (r === "admin") {
        const [docs, pats, appts, st] = await Promise.all([API.adminGetDoctors(), API.adminGetPatients(), API.adminGetAppointments(), API.getStats()]);
        setDoctors(docs); setPatients(pats); setAppointments(appts); setStats(st);
      }
    } catch (e) { console.error("Load error:", e.message); }
    setLoading(false);
  }, []);

  const refreshAppointments = useCallback(async () => {
    const appts = await API.getAppointments();
    setAppointments(appts);
  }, []);

  const refreshSchedule = useCallback(async () => {
    const sch = await API.getSchedule();
    setSchedule(sch);
  }, []);

  const refreshDoctors = useCallback(async () => {
    const [docs, st] = await Promise.all([API.adminGetDoctors(), API.getStats()]);
    setDoctors(docs); setStats(st);
  }, []);

  const onAuthSuccess = useCallback(async (res) => {
    API.api.setToken(res.access_token);   // ← saves to sessionStorage
    const me = await API.getMe();
    setUser(me); setRole(res.role);
    await loadData(res.role, me);
    setView("dashboard"); setScreen("app");
}, [loadData]);

  const handleUpdateStatus = useCallback(async (id, status) => {
    await API.updateAppointment(id, status);
    await refreshAppointments();
  }, [refreshAppointments]);

  const handleCancelPatient = useCallback(async (id) => {
    await API.updateAppointment(id, "cancelled");
    await refreshAppointments();
  }, [refreshAppointments]);

  // ── View router ────────────────────────────────────────
  const renderView = () => {
    if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}><Spinner/><p style={{color:C.textLight,fontSize:14}}>Loading…</p></div>;

    if (role === "patient") switch(view) {
      case "dashboard":    return <PatientDashboard patient={user} appointments={appointments} doctors={doctors}/>;
      case "find":         return <FindDoctors doctors={doctors} patient={user} onRefreshAppointments={refreshAppointments}/>;
      case "appointments": return <PatientAppointments patient={user} appointments={appointments} doctors={doctors} onCancel={handleCancelPatient}/>;
      case "profile":      return <PatientProfile patient={user}/>;
      default: return null;
    }
    if (role === "doctor") switch(view) {
      case "dashboard":    return <DoctorDashboard doctor={user} appointments={appointments} patients={patients}/>;
      case "schedule":     return <DoctorScheduleView doctor={user} appointments={appointments} schedule={schedule}/>;
      case "availability": return <DoctorAvailability doctor={user} schedule={schedule} onRefreshSchedule={refreshSchedule}/>;
      case "appointments": return <DoctorAppointments 
  doctor={user} 
  appointments={appointments} 
  patients={patients} 
  onStatus={handleUpdateStatus}
  onRefreshPatients={async () => {
    const pats = await API.getMyPatients().catch(() => []);
    setPatients(pats);
  }}
/>;
      default: return null;
    }
    if (role === "admin") switch(view) {
      case "dashboard":    return <AdminDashboard stats={stats} doctors={doctors} appointments={appointments} patients={patients}/>;
      case "doctors":      return <AdminDoctors doctors={doctors} onRefreshDoctors={refreshDoctors}/>;
      case "appointments": return <AdminAppointments appointments={appointments} doctors={doctors} patients={patients}/>;
      case "patients":     return <AdminPatients patients={patients} appointments={appointments}/>;
      default: return null;
    }
    return null;
  };

  if (screen === "landing") return <Landing onRole={r=>{ setRole(r); setScreen("auth"); }}/>;
  if (screen === "auth")    return <Auth role={role} onSuccess={onAuthSuccess} onBack={()=>setScreen("landing")}/>;

  return (
    <Layout user={user} role={role} view={view} setView={setView} onLogout={logout}>
      {renderView()}
    </Layout>
  );
}
