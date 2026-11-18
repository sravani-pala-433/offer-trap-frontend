import { ChangeEvent, FormEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CheckCircle2, EyeOff, Image as ImageIcon, LockKeyhole, UploadCloud, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type ReportStatus, type UploadProgress, type UploadStage } from '../lib/api'

const allowedTypes = ['image/jpeg','image/png','image/webp']
const allowedExtensions = ['.png','.jpg','.jpeg','.webp']

type SubmitSuccess = { id?: string; message?: string; status?: ReportStatus }
type ValidatedField = 'submitterName' | 'submitterEmail' | 'companyName' | 'recruiterContact' | 'description' | 'jobUrl'
type EvidenceFileItem = {
  id: string
  file: File
  status: 'ready' | 'uploading' | 'uploaded' | 'failed'
  uploadId?: string
  uploadedBytes: number
  error?: string
}

const personNamePattern = /^(?=.{2,}$)[\p{L}\p{M}]+(?:[ .'’\-][\p{L}\p{M}]+)*$/u
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const recruiterMobilePattern = /^\d{10}$/

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 KB'
  return bytes < 1024 * 1024
    ? `${Math.max(1,Math.round(bytes/1024))} KB`
    : `${(bytes/1024/1024).toFixed(2)} MB`
}

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
  const [files,setFiles] = useState<EvidenceFileItem[]>([])
  const [busy,setBusy] = useState(false)
  const [uploadStage,setUploadStage] = useState<UploadStage|null>(null)
  const [error,setError] = useState('')
  const [fileSelectionError,setFileSelectionError] = useState('')
  const [success,setSuccess] = useState<SubmitSuccess|null>(null)
  const [touched,setTouched] = useState<Partial<Record<ValidatedField,boolean>>>({})
  const [form,setForm] = useState({
    submitterName:'',
    submitterEmail:'',
    isAnonymous:false,
    companyName:'',
    recruiterName:'',
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
  const uploadProgress: UploadProgress|null = files.length
    ? {
      uploadedBytes:files.reduce((total,item)=>total+item.uploadedBytes,0),
      totalBytes:files.reduce((total,item)=>total+item.file.size,0),
    }
    : null
  const uploadPercentage = uploadProgress && uploadProgress.totalBytes > 0
    ? Math.min(100,Math.round(uploadProgress.uploadedBytes/uploadProgress.totalBytes*100))
    : 0

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

  function updateEvidenceFile(id: string, updates: Partial<EvidenceFileItem>) {
    setFiles(previous => previous.map(item => item.id === id ? {...item,...updates} : item))
  }

  function addFiles(list: FileList|null) {
    if (!list) return
    setError('')
    const incoming = Array.from(list)
    const valid: File[] = []
    const unsupported: string[] = []
    incoming.forEach(file => {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowedExtensions.includes(extension) || (file.type && !allowedTypes.includes(file.type))) {
        unsupported.push(file.name)
      } else {
        valid.push(file)
      }
    })
    const availableSlots = Math.max(0,5-files.length)
    const accepted = valid.slice(0,availableSlots).map(file => ({
      id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status:'ready' as const,
      uploadedBytes:0,
    }))
    const messages = [
      unsupported.length ? `${unsupported.join(', ')}: unsupported format. Choose a JPEG, PNG, or WEBP image.` : '',
      valid.length > availableSlots ? 'You can attach up to 5 images.' : '',
    ].filter(Boolean)
    setFileSelectionError(messages.join(' '))
    if (accepted.length) setFiles(previous => [...previous,...accepted])
  }

  function evidenceUploadError(caught: unknown): string {
    const message = caught instanceof Error ? caught.message : 'The upload could not be completed.'
    if (/unsupported|only jpeg|415|content type|file format|file type|content does not match/i.test(message)) {
      return 'This file is not a supported image. Choose a valid JPEG, PNG, or WEBP image, then retry.'
    }
    if (/failed to fetch|network|cors/i.test(message)) {
      return 'Could not connect to the upload service. Check your connection, then retry.'
    }
    return `Upload failed: ${message}`
  }

  async function uploadEvidenceFile(item: EvidenceFileItem): Promise<string|null> {
    updateEvidenceFile(item.id,{status:'uploading',uploadedBytes:0,error:undefined})
    try {
      const uploadId = await api.uploadEvidenceFile(item.file,progress=>{
        updateEvidenceFile(item.id,{uploadedBytes:progress.uploadedBytes})
      })
      updateEvidenceFile(item.id,{
        status:'uploaded',
        uploadId,
        uploadedBytes:item.file.size,
        error:undefined,
      })
      return uploadId
    } catch (caught) {
      updateEvidenceFile(item.id,{
        status:'failed',
        uploadId:undefined,
        error:evidenceUploadError(caught),
      })
      return null
    }
  }

  async function retryEvidenceFile(item: EvidenceFileItem) {
    if (busy) return
    setBusy(true)
    setError('')
    setUploadStage('uploading')
    try {
      await uploadEvidenceFile(item)
    } finally {
      setBusy(false)
      setUploadStage(null)
    }
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
    setError('')
    try {
      const uploadIds = new Map<string,string>()
      files.forEach(item=>{
        if (item.status==='uploaded' && item.uploadId) uploadIds.set(item.id,item.uploadId)
      })
      const pendingFiles = files.filter(item=>item.status!=='uploaded' || !item.uploadId)
      if (pendingFiles.length) {
        setUploadStage('uploading')
        let nextIndex = 0
        let uploadFailed = false
        const workers = Array.from(
          {length:Math.min(3,pendingFiles.length)},
          async () => {
            while (nextIndex < pendingFiles.length) {
              const item = pendingFiles[nextIndex]
              nextIndex += 1
              const uploadId = await uploadEvidenceFile(item)
              if (uploadId) uploadIds.set(item.id,uploadId)
              else uploadFailed = true
            }
          },
        )
        await Promise.all(workers)
        if (uploadFailed) {
          setError('One or more images could not be uploaded. Review the error beside each file, retry it, or remove that image before publishing.')
          return
        }
      }
      const evidenceUploadIds = files.flatMap(item=>{
        const uploadId = uploadIds.get(item.id)
        return uploadId ? [uploadId] : []
      })
      const result = await api.submitReport({...form,evidenceUploadIds},setUploadStage)
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
      <p className="eyebrow">Submission status · {success.status === 'Rejected' ? 'Rejected' : 'Published'}</p>
      <h1>Thank you for<br/><em>speaking up.</em></h1>
      <p>Your report is now public.</p>
      {success.id && <p className="reference-number">Reference: {success.id}</p>}
      <p>Your name, description, recruiter details, job link, and images are public unless you chose anonymous for your name. Your email stays private. An administrator can reject the whole report, which removes it from the public archive.</p>
      {success.id
        ? <Link className="button button-primary" to={`/reports/${encodeURIComponent(success.id)}/status`}>View report status <ArrowUpRight size={16}/></Link>
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
        <p><strong>Your email stays private.</strong><br/>Only an authenticated administrator can see it. Your display name is public by default unless you choose to be anonymous.</p>
      </div>
    </div>

    <form className="submission-form" onSubmit={submit} noValidate>
      <div className="submission-steps" aria-label="Submission process">
        <div><span>01</span><p><strong>Tell us who you are</strong><small>Your email always stays private.</small></p></div>
        <div><span>02</span><p><strong>Describe the incident</strong><small>Share facts and useful identifiers.</small></p></div>
        <div><span>03</span><p><strong>Add evidence</strong><small>Images appear with the public report.</small></p></div>
      </div>
      <div className="form-heading"><span>About you</span><p>Both fields are required.</p></div>
      <div className="form-two">
        <label>Your name *
          <input required minLength={2} autoComplete="name" name="submitterName" value={form.submitterName} onChange={field} onBlur={()=>touchField('submitterName')} aria-invalid={Boolean(touched.submitterName && validationErrors.submitterName)} aria-describedby="submitter-name-error" placeholder="Your display name"/>
          {touched.submitterName && validationErrors.submitterName && <span className="field-error" id="submitter-name-error" role="alert">{validationErrors.submitterName}</span>}
        </label>
        <label>Your email *
          <input required type="email" autoComplete="email" name="submitterEmail" value={form.submitterEmail} onChange={field} onBlur={()=>touchField('submitterEmail')} aria-invalid={Boolean(touched.submitterEmail && validationErrors.submitterEmail)} aria-describedby="submitter-email-error" placeholder="Private email address"/>
          {touched.submitterEmail && validationErrors.submitterEmail && <span className="field-error" id="submitter-email-error" role="alert">{validationErrors.submitterEmail}</span>}
        </label>
      </div>
      <label className="checkbox-label anonymous-choice">
        <input type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={field}/>
        <span><strong><EyeOff size={15}/> Publish my name as Anonymous</strong>Your name and email remain visible to the administrator; only your name is hidden from the public.</span>
      </label>

      <div className="form-heading incident-heading"><span>Incident details</span><p>Fields marked * are required.</p></div>
      <label>Company or organization *
        <input required minLength={2} name="companyName" value={form.companyName} onChange={field} onBlur={()=>touchField('companyName')} aria-invalid={Boolean(touched.companyName && validationErrors.companyName)} aria-describedby="company-name-error" placeholder="Company name"/>
        {touched.companyName && validationErrors.companyName && <span className="field-error" id="company-name-error" role="alert">{validationErrors.companyName}</span>}
      </label>
      <div className="form-two">
        <label>Recruiter name<input name="recruiterName" value={form.recruiterName} onChange={field} placeholder="Optional"/></label>
        <label>Recruiter mobile number
          <input type="tel" inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} autoComplete="off" name="recruiterContact" value={form.recruiterContact} onChange={field} onBlur={()=>touchField('recruiterContact')} aria-invalid={Boolean(touched.recruiterContact && validationErrors.recruiterContact)} aria-describedby="recruiter-mobile-error" placeholder="Optional · 10 digits"/>
          {touched.recruiterContact && validationErrors.recruiterContact && <span className="field-error" id="recruiter-mobile-error" role="alert">{validationErrors.recruiterContact}</span>}
        </label>
      </div>
      <div className="form-two">
        <label>Job title<input name="jobTitle" value={form.jobTitle} onChange={field} placeholder="e.g. Software Developer"/></label>
        <label>Incident category<select name="category" value={form.category} onChange={field}><option>Advance-fee recruitment</option><option>Fake offer letter</option><option>Company impersonation</option><option>Suspicious interview process</option><option>Personal information request</option><option>Other</option></select></label>
      </div>
      <label>Job posting URL
        <input name="jobUrl" type="url" value={form.jobUrl} onChange={field} onBlur={()=>touchField('jobUrl')} aria-invalid={Boolean(touched.jobUrl && validationErrors.jobUrl)} aria-describedby="job-url-error" placeholder="https://company.com/job"/>
        {touched.jobUrl && validationErrors.jobUrl && <span className="field-error" id="job-url-error" role="alert">{validationErrors.jobUrl}</span>}
      </label>
      <label>What happened? *
        <textarea required minLength={20} rows={5} name="description" value={form.description} onChange={field} onBlur={()=>touchField('description')} aria-invalid={Boolean(touched.description && validationErrors.description)} aria-describedby="description-error" placeholder="Describe what happened and what you observed."/>
        {touched.description && validationErrors.description && <span className="field-error" id="description-error" role="alert">{validationErrors.description}</span>}
      </label>
      <label className="checkbox-label"><input type="checkbox" name="paymentRequested" checked={form.paymentRequested} onChange={field}/><span>They asked me to pay money or a fee during recruitment.</span></label>

      <div className="form-heading evidence-heading"><span>Supporting images</span><p>Optional · up to 5 images</p></div>
      <div className="upload-zone" role="button" tabIndex={0} aria-disabled={busy} onClick={()=>{if(!busy)inputRef.current?.click()}} onKeyDown={event=>{if(!busy&&(event.key==='Enter'||event.key===' ')){event.preventDefault();inputRef.current?.click()}}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(!busy)addFiles(event.dataTransfer.files)}}>
        <UploadCloud size={27}/>
        <strong>Drop images here, or browse files</strong>
        <span>JPEG, PNG, or WEBP only</span>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden disabled={busy} onChange={event=>{addFiles(event.target.files);event.currentTarget.value=''}}/>
      </div>
      {fileSelectionError && <p className="file-selection-error" role="alert">{fileSelectionError}</p>}
      {files.map(item=><div className={`file-chip file-chip-${item.status}`} key={item.id}>
        <ImageIcon size={16}/>
        <span className="file-chip-info">
          <strong>{item.file.name}</strong>
          <small>{formatFileSize(item.file.size)} · {item.status==='uploaded'?'Uploaded':item.status==='uploading'?'Uploading…':item.status==='failed'?'Upload failed':'Ready to upload'}</small>
          {item.error && <small className="file-chip-error" role="alert">{item.error}</small>}
        </span>
        {item.status==='failed' && <button className="file-retry" type="button" aria-label={`Retry upload for ${item.file.name}`} title="Retry upload" disabled={busy} onClick={()=>void retryEvidenceFile(item)}><UploadCloud size={17}/></button>}
        <button type="button" aria-label={`Remove ${item.file.name}`} disabled={busy} onClick={()=>setFiles(previous=>previous.filter(file=>file.id!==item.id))}><X size={15}/></button>
      </div>)}
      <p className="form-disclaimer">By submitting, you confirm this description reflects your experience to the best of your knowledge. Your report, including its description, recruiter details, and images, becomes public immediately; your name is public unless you choose anonymous, and your email always stays private. Reports are unverified community submissions and an administrator may reject the whole report.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {uploadProgress && files.some(item=>item.status==='uploading') && uploadStage === 'uploading' && <div className="upload-progress">
        <div className="upload-progress-track" role="progressbar" aria-label="Evidence upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercentage}>
          <span style={{width:`${uploadPercentage}%`}}/>
        </div>
        <p>{uploadPercentage}% · {formatFileSize(uploadProgress.uploadedBytes)} of {formatFileSize(uploadProgress.totalBytes)} uploaded</p>
      </div>}
      <button className="button button-primary submit-button" type="submit" disabled={busy || !isFormValid} title={!isFormValid ? 'Complete all required fields correctly to submit' : undefined}>{uploadStage==='preparing'?'Preparing uploads…':uploadStage==='uploading'?'Uploading evidence…':uploadStage==='submitting'?'Publishing report…':'Publish report'} <ArrowUpRight size={16}/></button>
    </form>
  </main>
}
