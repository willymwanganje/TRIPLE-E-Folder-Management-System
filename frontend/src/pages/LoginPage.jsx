import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage(){
  const { user, login } = useAuth(); const { push } = useToast(); const nav = useNavigate();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false);
  if(user) return <Navigate to="/" replace/>;
  async function submit(e){e.preventDefault();setBusy(true);try{await login(email,password);nav('/');}catch(err){push(err.message,'error');}finally{setBusy(false);}}
  return <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1.05fr .95fr',background:'#f3f7f8'}}>
    <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'7vw',background:'linear-gradient(145deg,#062e2d,#0f766e)',color:'#fff'}}><div className="logo-mark" style={{background:'#ffffff22',width:54,height:54,marginBottom:25}}>✓</div><div style={{fontSize:46,fontWeight:1000,lineHeight:1.05}}>TRIPLE-E</div><div style={{fontSize:17,opacity:.85,marginTop:12,maxWidth:480}}>Securely organize, manage and govern Rice Council of Tanzania documents, folders and access.</div><div style={{display:'grid',gap:10,marginTop:30,fontSize:13,opacity:.9}}><div>✓ Role-based access control</div><div>✓ Centralized document management</div><div>✓ Audit-ready activity tracking</div></div></div>
    <div style={{display:'grid',placeItems:'center',padding:25}}><form onSubmit={submit} className="card" style={{width:'100%',maxWidth:440,padding:34}}><h1 style={{marginBottom:7}}>Welcome back</h1><p className="subtle" style={{marginBottom:25}}>Sign in to your workspace.</p><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="name@organization.org" required/></label><label style={{marginTop:15}}>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" required/></label><button className="btn btn-primary" disabled={busy} style={{width:'100%',marginTop:20}}>{busy?'Signing in…':'Sign in'}</button><div className="muted-box" style={{marginTop:18,fontSize:12}}><b>Local Super Admin</b><br/>admin@triple-e.local · Admin@12345</div></form></div>
  </div>
}
