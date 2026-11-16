import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, FileWarning, Link2, ShieldAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, type Report } from '../lib/api'

export default function ReportDetailPage() {
  const { id=''} = useParams()
  const [report,setReport] = useState<Report|null>(null)
  const [error,setError] = useState('')
  useEffect(()=>{api.getReport(id).then(setReport).catch(e=>setError(e.message))},[id])
  if(error) return <main className="inner-page"><Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to reports</Link><div className="error-panel">{error}</div></main>
  if(!report) return <main className="inner-page"><p className="empty-note">Loading report…</p></main>
  return <main className="detail-page">
    <Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to archive</Link>
    {report.illustrative && <p className="demo-notice">Illustrative sample. This is not a real allegation.</p>}
    <div className="detail-layout"><article className="detail-main"><p className="eyebrow">{report.category}</p><h1>{report.title}</h1>{report.isRedacted?<div className="detail-redaction"><ShieldAlert/><div><strong>Protected while unapproved</strong><p>This submission is publicly acknowledged, but the raw description, recruiter identity, contact details, and evidence remain hidden until approval.</p></div></div>:<p className="detail-summary">{report.summary}</p>}<div className="detail-meta"><span>ORGANIZATION</span><strong>{report.companyName}</strong><span>REPORTED</span><strong>{new Date(report.date).toLocaleDateString()}</strong>{report.submittedBy&&<><span>SUBMITTED BY</span><strong>{report.submittedBy}</strong></>}{!report.isRedacted&&report.identifier&&<><span>IDENTIFIER</span><strong><Link2 size={14}/>{report.identifier}</strong></>}</div><div className="fairness-note"><FileWarning/><div><strong>Read this report with care</strong><p>A community submission is not proof of fraud. Confirm information independently and use official company contact details.</p></div></div></article><aside className="detail-aside"><span className="eyebrow">Review status</span><h3>{report.status}</h3><p>{report.isRedacted?'This submission has not been approved. Sensitive incident and recruiter details are intentionally hidden.':'The reviewed details are published, but this status is not a legal finding.'} Submitter email addresses are never public.</p><Link className="button button-primary" to="/submit">Report a similar incident <ArrowUpRight size={16}/></Link></aside></div>
  </main>
}
