import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const links = [
  ['/','Dashboard',null],
  ['/documents','Documents','document.view'],
  ['/folders','Folders','folder.view'],
  ['/upload','Upload','document.create'],
  ['/users','Users','user.view'],
  ['/profile','My Profile','profile.update']
];

export default function Sidebar(){
  const { user, logout } = useAuth();
  const allowed = (p) => user?.isSuperAdmin || !p || user?.permissions?.includes(p);
  return <aside className="side-nav" style={{width:250,minHeight:'100vh',background:'#0b1728',color:'#fff',padding:20,display:'flex',flexDirection:'column',position:'sticky',top:0}}>
    <div className="side-logo" style={{marginBottom:28}}><div className="logo-mark"><svg width="23" height="23" viewBox="0 0 24 24" fill="none"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" stroke="currentColor" strokeWidth="2"/><path d="m8 12 2.5 2.5L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div><div style={{fontWeight:950,fontSize:18,letterSpacing:'.02em'}}>TRIPLE-E</div><div style={{fontSize:10,color:'#9fb0c4',fontWeight:700}}>FOLDER MANAGEMENT</div></div></div>
    <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'#72839a',fontWeight:900,margin:'0 0 9px 8px'}}>Workspace</div>
    <nav style={{display:'grid',gap:5}}>{links.filter(([, , p])=>allowed(p)).map(([to,label,p])=><NavLink key={to} to={to} end={to==='/' } style={({isActive})=>({display:'flex',alignItems:'center',padding:'11px 12px',borderRadius:10,color:isActive?'#fff':'#b5c2d1',background:isActive?'#0f766e':'transparent',textDecoration:'none',fontWeight:800,fontSize:14})}>{label}</NavLink>)}</nav>
    {user?.isSuperAdmin && <div style={{marginTop:24}}><div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'#72839a',fontWeight:900,margin:'0 0 9px 8px'}}>Master Control</div><div className="muted-box" style={{background:'#101f32',borderColor:'#24344a',color:'#dbe6f2'}}><div style={{fontWeight:900,fontSize:13}}>Super Admin</div><div style={{fontSize:12,color:'#91a3b8',marginTop:3}}>All system controls enabled</div></div></div>}
    <div style={{marginTop:'auto',paddingTop:25}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><Avatar name={user?.fullName} src={user?.profilePhotoUrl} size={39}/><div style={{minWidth:0}}><div style={{fontWeight:850,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.fullName}</div><div style={{fontSize:11,color:'#94a3b8'}}>{user?.role?.name}</div></div></div><button onClick={logout} className="btn btn-light" style={{width:'100%'}}>Sign out</button></div>
  </aside>
}
