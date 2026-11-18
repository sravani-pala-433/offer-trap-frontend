import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, type SubmissionStatus } from '../lib/api'

const statusCopy = {
  submitted: 'Your report was published when you submitted it. Your name is public unless you chose anonymous; your email remains private.',
  rejected: 'An administrator rejected this whole report, so it has been removed from the public archive. Your email remains private.',
}

export default function ReportStatusPage() {
  const { id='' } = useParams()
  const [submission,setSubmission] = useState<SubmissionStatus|null>(null)
  const [error,setError] = useState('')

  useEffect(()=>{
    setError('')
    api.getReportStatus(id).then(setSubmission).catch(caught=>setError(caught instanceof Error ? caught.message : 'Unable to load report status.'))
  },[id])

  if (error) return <main className="inner-page status-page"><Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to reports</Link><div className="error-panel">{error}</div></main>
  if (!submission) return <main className="inner-page status-page"><p className="empty-note">Loading report status...</p></main>

  const StatusIcon = submission.reviewStatus === 'rejected' ? XCircle : CheckCircle2

  return <main className="inner-page status-page">
    <Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to reports</Link>
    <article className="status-card">
      <div className={`status-orb status-orb-${submission.reviewStatus}`}><StatusIcon size={30}/></div>
      <p className="eyebrow">Report status</p>
      <h1 className="status-title">{submission.reviewStatus === 'rejected' ? submission.status : 'Published'}</h1>
      <p className="status-explanation">{statusCopy[submission.reviewStatus]}</p>
      <dl className="status-details">
        <div><dt>Reference</dt><dd>{submission.id}</dd></div>
        <div><dt>Organization</dt><dd>{submission.companyName}</dd></div>
        <div><dt>Submitted by</dt><dd>{submission.submittedBy}</dd></div>
        <div><dt>Submitted</dt><dd>{new Date(submission.submittedAt).toLocaleDateString()}</dd></div>
        {submission.reviewedAt && <div><dt>Rejected</dt><dd>{new Date(submission.reviewedAt).toLocaleDateString()}</dd></div>}
      </dl>
      {submission.reviewNote && <div className="review-note"><strong>Administrator note</strong><p>{submission.reviewNote}</p></div>}
      {submission.isPublic && <Link className="button button-primary" to={`/reports/${encodeURIComponent(submission.id)}`}>View public report <ArrowUpRight size={16}/></Link>}
    </article>
  </main>
}
