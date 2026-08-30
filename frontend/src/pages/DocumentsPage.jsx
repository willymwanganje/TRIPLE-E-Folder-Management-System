import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import FileIcon from '../components/FileIcon';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';
export default function DocumentsPage(){
  const [docs,setDocs]=useState(null); const [q,setQ]=useState(''); const {push}=useToast();
  const load=()=>api.documents(q?`?search=${encodeURIComponent(q)}`:'').then(setDocs).catch(e=>push(e.message,'error'));
  useEffect(()=>{load()},[]);
  if(!docs)return <Spinner/>;
  return <div><div className="page-head"><div><h1>Documents</h1><div className="subtle">View only the files your account is allowed to access.</div></div><Link to="/upload" className="btn btn-primary" style={{textDecoration:'none'}}>+ Upload</Link></div><input placeholder="Search by document name or description…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} style={{marginBottom:16}}/><div className="grid-3">{docs.length===0?<div className="card" style={{padding:30,gridColumn:'1/-1',textAlign:'center'}}><h3>No documents found</h3><div className="subtle">Try a different search or upload a document.</div></div>:docs.map(x=><div className="card" key={x.id} style={{padding:18}}><FileIcon mime={x.mimeType}/><h3 style={{marginTop:10}}>{x.name}</h3><p className="subtle" style={{fontSize:13}}>{x.description||'No description'}</p><div className="subtle" style={{fontSize:12}}>{x.category?.name} · {(x.sizeBytes/1024/1024).toFixed(2)} MB</div><div style={{marginTop:14,display:'flex',gap:8,alignItems:'center'}}><span className={`badge ${x.accessLevel==='PUBLIC'?'badge-green':'badge-teal'}`}>{x.accessLevel}</span><Link className="btn btn-light btn-sm" to={`/documents/${x.id}`} style={{textDecoration:'none',marginLeft:'auto'}}>Open</Link></div></div>)}</div></div>
}
