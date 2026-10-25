import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CheckCircle2, FileText, UploadCloud, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const MAX_FILE_MB=10
const allowedTypes=['application/pdf','image/jpeg','image/png','message/rfc822','text/plain']
export default function SubmitReportPage() {
  const inputRef=useRef<HTMLInputElement>(null)
  const [files,setFiles]=useState<File[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState<{id?:string;message?:string}|null>(null)
  const [form,setForm]=useState({companyName:'',recruiterContact:'',jobTitle:'',jobUrl:'',category:'Advance-fee recruitment',description:'',paymentRequested:false})
  function field(e:ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>){const t=e.target;setForm(p=>({...p,[t.name]:t instanceof HTMLInputElement&&t.type==='checkbox'?t.checked:t.value}))}
  function addFiles(list:FileList|null){if(!list)return;setError('');const incoming=Array.from(list);const valid=incoming.filter(f=>{if(f.size>MAX_FILE_MB*1024*1024){setError(`${f.name} exceeds ${MAX_FILE_MB} MB.`);return false}if(!allowedTypes.includes(f.type)){setError(`${f.name} has an unsupported type. Use PDF, PNG, JPEG, TXT, or EML where supported.`);return false}return true});setFiles(p=>[...p,...valid].slice(0,5))}
  async function submit(e:FormEvent){e.preventDefault();setError('');setBusy(true);try{const result=await api.submitReport({...form,evidence:files});setSuccess(result)}catch(e){setError(e instanceof Error?e.message:'Unable to submit report.')}finally{setBusy(false)}}
  if(success)return <main className="inner-page success-page"><div className="success-symbol"><CheckCircle2 size={32}/></div><p className="eyebrow">Submission status</p><h1>Thank you for<br/><em>speaking up.</em></h1><p>{success.message??'Your report has been received for review.'}</p>{success.id&&<p className="reference-number">Reference: {success.id}</p>}<p>Reports should be reviewed before they are made public. Please redact personal information and avoid sharing unverified accusations as facts.</p><Link className="button button-primary" to="/reports">Return to archive <ArrowUpRight size={16}/></Link></main>
  return <main className="submit-page">
    <div className="submit-intro"><Link className="text-link" to="/"><ArrowLeft size={16}/> Home</Link><p className="eyebrow">Community incident report</p><h1>Something doesn't<br/><em>feel right?</em></h1><p>Share what happened. Your experience could help someone else avoid the same trap.</p><div className="privacy-note"><span className="privacy-icon"><FileText size={19}/></span><p><strong>Your evidence deserves care.</strong><br/>Avoid uploading identity documents or unrelated personal information. Submissions should be reviewed before publication.</p></div></div>
    <form className="submission-form" onSubmit={submit}>
      <div className="form-heading"><span>Incident details</span><p>Fields marked * are required.</p></div>
      <label>Company or organization *<input required name="companyName" value={form.companyName} onChange={field} placeholder="Name shown on the offer"/></label>
      <label>Recruiter email or contact identifier<input name="recruiterContact" value={form.recruiterContact} onChange={field} placeholder="Use only details appropriate to share"/></label>
      <div className="form-two"><label>Job title<input name="jobTitle" value={form.jobTitle} onChange={field} placeholder="e.g. Python Developer"/></label><label>Incident category<select name="category" value={form.category} onChange={field}><option>Advance-fee recruitment</option><option>Fake offer letter</option><option>Company impersonation</option><option>Suspicious interview process</option><option>Personal information request</option><option>Other</option></select></label></div>
      <label>Job posting URL<input name="jobUrl" type="url" value={form.jobUrl} onChange={field} placeholder="https://…"/></label>
      <label>What happened? *<textarea required minLength={20} rows={5} name="description" value={form.description} onChange={field} placeholder="Describe the sequence of events. Separate what you observed from what you suspect."/></label>
      <label className="checkbox-label"><input type="checkbox" name="paymentRequested" checked={form.paymentRequested} onChange={field}/><span>They asked me to pay money or a fee during recruitment.</span></label>
      <div className="form-heading evidence-heading"><span>Supporting evidence</span><p>Optional · up to 5 files · 10 MB each</p></div>
      <div className="upload-zone" role="button" tabIndex={0} onClick={()=>inputRef.current?.click()} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inputRef.current?.click()}}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}><UploadCloud size={27}/><strong>Drop evidence here, or browse files</strong><span>PDF, PNG, JPEG, TXT and EML where supported</span><input ref={inputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt,.eml" hidden onChange={e=>addFiles(e.target.files)}/></div>
      {files.map((f,i)=><div className="file-chip" key={`${f.name}-${i}`}><FileText size={16}/><span>{f.name} · {(f.size/1024/1024).toFixed(2)} MB</span><button type="button" aria-label={`Remove ${f.name}`} onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))}><X size={15}/></button></div>)}
      <p className="form-disclaimer">By submitting, you confirm this description reflects your experience to the best of your knowledge. Do not submit another person's sensitive personal information. A submission is not automatically published or treated as verified.</p>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary submit-button" type="submit" disabled={busy}>{busy?'Submitting…':'Submit for review'} <ArrowUpRight size={16}/></button>
    </form>
  </main>
}