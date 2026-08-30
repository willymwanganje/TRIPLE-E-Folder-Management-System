import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
export default function DocumentDetailsPage(){
  const {id}=useParams(); const nav=useNavigate(); const {user}=useAuth(); const {push}=useToast(); const [d,setD]=useState();
  useEffect(()=>{api.document(id).then(setD).catch(e=>push(e.message,'error'))},[id]); if(!d)return <Spinner/>;
  const canManage=user?.isSuperAdmin||user?.role?.name==='Admin'||d.uploadedById===user?.id;
  async function del(){if(!confirm('Delete this document?'))return;try{await api.deleteDocument(id);push('Document deleted.');nav('/documents')}catch(e){push(e.message,'error')}}
  return <div><div className="page-head"><div><Link to="/documents" className="subtle">← Documents</Link><h1 style={{marginTop:10}}>{d.name}</h1><div className="subtle">{d.category?.name} · {d.mimeType}</div></div><span className={`badge ${d.accessLevel==='PUBLIC'?'badge-green':'badge-teal'}`}>{d.accessLevel}</span></div><section className="card" style={{padding:22,maxWidth:850}}><p>{d.description||'No description provided.'}</p><div className="grid-3" style={{margin:'20px 0'}}><div><div className="subtle">Folder</div><b>{d.folder?.name||'Root'}</b></div><div><div className="subtle">Uploaded by</div><b>{d.uploadedBy?.fullName}</b></div><div><div className="subtle">Size</div><b>{(d.sizeBytes/1024/1024).toFixed(2)} MB</b></div></div><div style={{display:'flex',gap:8}}><a className="btn btn-primary" href={`${api.baseUrl}${d.fileUrl}`} target="_blank" rel="noreferrer">Open / Download</a>{canManage&&<button className="btn btn-danger" onClick={del}>Delete</button>}</div></section></div>
}
