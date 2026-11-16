import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CheckCircle2, EyeOff, FileText, LockKeyhole, UploadCloud, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type ReportStatus, type UploadStage } from '../lib/api'

const allowedTypes = ['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const allowedExtensions = ['.pdf','.png','.jpg','.jpeg','.webp','.doc','.docx']

type SubmitSuccess = { id?: string; message?: string; status?: ReportStatus }
type ValidatedField = 'submitterName' | 'submitterEmail' | 'companyName' | 'recruiterContact' | 'description' | 'jobUrl'

const personNamePattern = /^(?=.{2,120}$)[\p{L}\p{M}]+(?:[ .'’\-][\p{L}\p{M}]+)*$/u
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const recruiterMobilePattern = /^\d{10}$/

function isValidJobUrl(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function SubmitReportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files,setFiles] = useState<File[]>([])
  const [busy,setBusy] = useState(false)
  const [uploadStage,setUploadStage] = useState<UploadStage|null>(null)
  const [error,setError] = useState('')
  const [success,setSuccess] = useState<SubmitSuccess|null>(null)
  const [touched,setTouched] = useState<Partial<Record<ValidatedField,boolean>>>({})
  const [form,setForm] = useState({
    submitterName:'',
    submitterEmail:'',
    isAnonymous:false,
    companyName:'',
    recruiterContact:'',
    jobTitle:'',
    jobUrl:'',
    category:'Advance-fee recruitment',
    description:'',
    paymentRequested:false,
  })

  const validationErrors: Record<ValidatedField,string> = {
    submitterName: personNamePattern.test(form.submitterName.trim())
      ? ''
      : 'Enter a valid name using letters, spaces, apostrophes, or hyphens.',
    submitterEmail: emailPattern.test(form.submitterEmail.trim())
      ? ''
      : 'Enter a valid email address, such as name@example.com.',
    companyName: form.companyName.trim().length >= 2
      ? ''
      : 'Enter a company or organization name with at least 2 characters.',
    recruiterContact: !form.recruiterContact || recruiterMobilePattern.test(form.recruiterContact)
      ? ''
      : 'Enter exactly 10 digits for the recruiter mobile number.',
    description: form.description.trim().length >= 20
      ? ''
      : 'Describe what happened using at least 20 characters.',
    jobUrl: isValidJobUrl(form.jobUrl)
      ? ''
      : 'Enter a complete URL beginning with http:// or https://.',
  }
  const isFormValid = Boolean(form.category) && Object.values(validationErrors).every(message => !message)

  function field(e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    const target = e.target
    const value = target instanceof HTMLInputElement && target.type === 'checkbox'
      ? target.checked
      : target.name === 'recruiterContact'
        ? target.value.replace(/\D/g,'').slice(0,10)
        : target.value
    setError('')
    setForm(previous => ({
      ...previous,
      [target.name]: value,
    }))
  }

  function touchField(name: ValidatedField) {
    setTouched(previous => ({...previous,[name]:true}))
  }

  function addFiles(list: FileList|null) {
    if (!list) return
    setError('')
    const incoming = Array.from(list)
    const valid = incoming.filter(file => {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
        setError(`${file.name} has an unsupported type. Use an image, PDF, DOC, or DOCX file.`)
        return false
      }
      return true
    })
    setFiles(previous => [...previous,...valid].slice(0,5))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!isFormValid) {
      setTouched({
        submitterName:true,
        submitterEmail:true,
        companyName:true,
        recruiterContact:true,
        description:true,
        jobUrl:true,
      })
      setError('Please correct the highlighted fields before submitting.')
      return
    }
    setBusy(true)
    try {
      const result = await api.submitReport({...form,evidence:files},setUploadStage)
      setSuccess(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit report.')
    } finally {
      setBusy(false)
      setUploadStage(null)
    }
  }

  if (success) {
    return <main className="inner-page success-page">
      <div className="success-symbol"><CheckCircle2 size={32}/></div>
      <p className="eyebrow">Submission status · {success.status ?? 'Under Review'}</p>
      <h1>Thank you for<br/><em>speaking up.</em></h1>
      <p>{success.message ?? 'Your report has been received for review.'}</p>
      {success.id && <p className="reference-number">Reference: {success.id}</p>}
      <p>Your submission status may appear in the public archive, but recruiter details, your raw description, and evidence stay hidden until approval. Your email always remains private.</p>
      {success.id
        ? <Link className="button button-primary" to={`/reports/${encodeURIComponent(success.id)}/status`}>Track review status <ArrowUpRight size={16}/></Link>
        : <Link className="button button-primary" to="/reports">Return to archive <ArrowUpRight size={16}/></Link>}
    </main>
  }

  return <main className="submit-page">
    <div className="submit-intro">
      <Link className="text-link" to="/"><ArrowLeft size={16}/> Home</Link>
      <p className="eyebrow">Community incident report</p>
      <h1>Something doesn't<br/><em>feel right?</em></h1>
      <p>Share what happened. Your experience could help someone else avoid the same trap.</p>
      <div className="privacy-note">
        <span className="privacy-icon"><LockKeyhole size={19}/></span>
        <p><strong>Your email stays private.</strong><br/>Only an authenticated administrator can see it. Your display name is public only after approval, unless you choose to be anonymous.</p>
      </div>
    </div>

    <form className="submission-form" onSubmit={submit} noValidate>
      <div className="submission-steps" aria-label="Submission process">
        <div><span>01</span><p><strong>Tell us who you are</strong><small>Your email always stays private.</small></p></div>
        <div><span>02</span><p><strong>Describe the incident</strong><small>Share facts and useful identifiers.</small></p></div>
        <div><span>03</span><p><strong>Add evidence</strong><small>Files upload securely for review.</small></p></div>
      </div>
      <div className="form-heading"><span>About you</span><p>Both fields are required.</p></div>
      <div className="form-two">
        <label>Your name *
          <input required minLength={2} maxLength={120} autoComplete="name" name="submitterName" value={form.submitterName} onChange={field} onBlur={()=>touchField('submitterName')} aria-invalid={Boolean(touched.submitterName && validationErrors.submitterName)} aria-describedby="submitter-name-error" placeholder="Your display name"/>
          {touched.submitterName && validationErrors.submitterName && <span className="field-error" id="submitter-name-error" role="alert">{validationErrors.submitterName}</span>}
        </label>
        <label>Your email *
          <input required type="email" maxLength={320} autoComplete="email" name="submitterEmail" value={form.submitterEmail} onChange={field} onBlur={()=>touchField('submitterEmail')} aria-invalid={Boolean(touched.submitterEmail && validationErrors.submitterEmail)} aria-describedby="submitter-email-error" placeholder="Private email address"/>
          {touched.submitterEmail && validationErrors.submitterEmail && <span className="field-error" id="submitter-email-error" role="alert">{validationErrors.submitterEmail}</span>}
        </label>
      </div>
      <label className="checkbox-label anonymous-choice">
        <input type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={field}/>
        <span><strong><EyeOff size={15}/> Publish my name as Anonymous</strong>Your real name and email will still be visible to the administrator reviewing the evidence.</span>
      </label>

      <div className="form-heading incident-heading"><span>Incident details</span><p>Fields marked * are required.</p></div>
      <label>Company or organization *
        <input required minLength={2} maxLength={200} name="companyName" value={form.companyName} onChange={field} onBlur={()=>touchField('companyName')} aria-invalid={Boolean(touched.companyName && validationErrors.companyName)} aria-describedby="company-name-error" placeholder="Company name"/>
        {touched.companyName && validationErrors.companyName && <span className="field-error" id="company-name-error" role="alert">{validationErrors.companyName}</span>}
      </label>
      <label>Recruiter mobile number
        <input type="tel" inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} autoComplete="off" name="recruiterContact" value={form.recruiterContact} onChange={field} onBlur={()=>touchField('recruiterContact')} aria-invalid={Boolean(touched.recruiterContact && validationErrors.recruiterContact)} aria-describedby="recruiter-mobile-error" placeholder="Optional · 10 digits"/>
        {touched.recruiterContact && validationErrors.recruiterContact && <span className="field-error" id="recruiter-mobile-error" role="alert">{validationErrors.recruiterContact}</span>}
      </label>
      <div className="form-two">
        <label>Job title<input maxLength={200} name="jobTitle" value={form.jobTitle} onChange={field} placeholder="e.g. Software Developer"/></label>
        <label>Incident category<select name="category" value={form.category} onChange={field}><option>Advance-fee recruitment</option><option>Fake offer letter</option><option>Company impersonation</option><option>Suspicious interview process</option><option>Personal information request</option><option>Other</option></select></label>
      </div>
      <label>Job posting URL
        <input name="jobUrl" type="url" maxLength={2048} value={form.jobUrl} onChange={field} onBlur={()=>touchField('jobUrl')} aria-invalid={Boolean(touched.jobUrl && validationErrors.jobUrl)} aria-describedby="job-url-error" placeholder="https://company.com/job"/>
        {touched.jobUrl && validationErrors.jobUrl && <span className="field-error" id="job-url-error" role="alert">{validationErrors.jobUrl}</span>}
      </label>
      <label>What happened? *
        <textarea required minLength={20} maxLength={10000} rows={5} name="description" value={form.description} onChange={field} onBlur={()=>touchField('description')} aria-invalid={Boolean(touched.description && validationErrors.description)} aria-describedby="description-error" placeholder="Describe what happened and what you observed."/>
        {touched.description && validationErrors.description && <span className="field-error" id="description-error" role="alert">{validationErrors.description}</span>}
      </label>
      <label className="checkbox-label"><input type="checkbox" name="paymentRequested" checked={form.paymentRequested} onChange={field}/><span>They asked me to pay money or a fee during recruitment.</span></label>

      <div className="form-heading evidence-heading"><span>Supporting evidence</span><p>Optional · up to 5 files</p></div>
      <div className="upload-zone" role="button" tabIndex={0} onClick={()=>inputRef.current?.click()} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inputRef.current?.click()}}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();addFiles(event.dataTransfer.files)}}>
        <UploadCloud size={27}/>
        <strong>Drop evidence here, or browse files</strong>
        <span>Images, PDF, DOC and DOCX</span>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx" hidden onChange={event=>addFiles(event.target.files)}/>
      </div>
      {files.map((file,index)=><div className="file-chip" key={`${file.name}-${index}`}><FileText size={16}/><span>{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span><button type="button" aria-label={`Remove ${file.name}`} onClick={()=>setFiles(previous=>previous.filter((_,itemIndex)=>itemIndex!==index))}><X size={15}/></button></div>)}
      <p className="form-disclaimer">By submitting, you confirm this description reflects your experience to the best of your knowledge. The archive may show a protected status-only record before approval; the raw description, recruiter identity and contact details, evidence, and your email remain private. A submission is never automatically treated as verified.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary submit-button" type="submit" disabled={busy || !isFormValid} title={!isFormValid ? 'Complete all required fields correctly to submit' : undefined}>{uploadStage==='preparing'?'Preparing secure uploads…':uploadStage==='uploading'?'Uploading evidence…':uploadStage==='submitting'?'Creating report…':'Submit for review'} <ArrowUpRight size={16}/></button>
    </form>
  </main>
}
