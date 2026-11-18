import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ExternalLink, FileWarning } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, type Report, type ReportEvidence } from '../lib/api'
import { formatTitleCase } from '../lib/formatting'

function EvidenceImage({ evidence, index }: { evidence: ReportEvidence; index: number }) {
  const containerRef = useRef<HTMLAnchorElement|null>(null)
  const [imageUrl,setImageUrl] = useState('')
  const [failed,setFailed] = useState(false)

  useEffect(()=>{
    let active = true
    let objectUrl = ''
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(entries=>{
      if (!entries.some(entry=>entry.isIntersecting)) return
      observer.disconnect()
      api.getPublicEvidenceImage(evidence)
        .then(blob=>{
          if (!active) return
          objectUrl = URL.createObjectURL(blob)
          setImageUrl(objectUrl)
        })
        .catch(()=>{if(active)setFailed(true)})
    })
    observer.observe(container)
    return ()=>{
      active = false
      observer.disconnect()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  },[evidence.id,evidence.url,evidence.contentType,evidence.chunkCount])

  return <a
    ref={containerRef}
    className="report-evidence-image"
    href={imageUrl || undefined}
    target="_blank"
    rel="noopener noreferrer"
    aria-busy={!imageUrl && !failed}
  >
    {imageUrl && <img src={imageUrl} alt={`Evidence image ${index + 1} submitted with the report`} decoding="async"/>}
    <span>{failed ? 'Evidence image unavailable' : imageUrl ? <>Open image <ExternalLink size={13}/></> : 'Loading image when visible…'}</span>
  </a>
}

function ReportPublicationStatus({ report }: { report: Report }) {
  return <section className="review-status-card" aria-label="Report publication status">
    <div className="review-status-heading">
      <span className="eyebrow">Publication status</span>
      <span className="review-status-badge">{report.status}</span>
    </div>
    <p>{report.isRedacted ? 'Report details are not currently available.' : 'Submitter email remains private.'}</p>
    <Link className="review-status-action" to="/submit">Report a similar incident <ArrowUpRight size={14}/></Link>
  </section>
}

export default function ReportDetailPage() {
  const { id=''} = useParams()
  const [report,setReport] = useState<Report|null>(null)
  const [error,setError] = useState('')
  useEffect(()=>{api.getReport(id).then(setReport).catch(e=>setError(e.message))},[id])
  if(error) return <main className="inner-page"><Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to reports</Link><div className="error-panel">{error}</div></main>
  if(!report) return <main className="inner-page"><p className="empty-note">Loading report…</p></main>
  const hasPublicEvidence = !report.isRedacted && Boolean(report.evidence?.length)
  const detailTitle = report.illustrative ? report.title : report.jobTitle
  return <main className="detail-page">
    <Link className="text-link" to="/reports"><ArrowLeft size={16}/> Back to reports</Link>
    {report.illustrative && <p className="demo-notice">Illustrative sample. This is not a real allegation.</p>}
    <div className={`detail-layout${hasPublicEvidence ? ' has-evidence' : ' no-evidence'}`}>
      <article className="detail-main">
        <p className="eyebrow detail-category">{report.category}</p>
        <h1>{report.isRedacted ? 'Report details unavailable' : 'Recruitment Report'}</h1>
        {!report.isRedacted && detailTitle && <>
          <p className="eyebrow detail-job-title-label">Job title</p>
          <p className="detail-report-subtitle">{formatTitleCase(detailTitle)}</p>
        </>}
        {!hasPublicEvidence && <ReportPublicationStatus report={report}/>}
        {!report.description && report.summary && <p className="detail-summary">{report.summary}</p>}
        <div className="detail-meta">
          <span>ORGANIZATION</span><strong>{report.companyName}</strong>
          <span>REPORTED</span><strong>{new Date(report.date).toLocaleDateString()}</strong>
          {!report.isRedacted && report.paymentRequested && <>
            <span>FEE OR PAYMENT REQUESTED</span><strong>Yes</strong>
          </>}
          {report.submittedBy && <><span>SUBMITTED BY</span><strong>{report.submittedBy}</strong></>}
          {!report.isRedacted && report.recruiterName && <>
            <span>REPORTED RECRUITER NAME</span><strong>{report.recruiterName}</strong>
          </>}
          {!report.isRedacted && report.identifier && <>
            <span>REPORTED RECRUITER MOBILE</span>
            <strong>{report.identifier}</strong>
          </>}
          {!report.isRedacted && report.jobUrl && <>
            <span>JOB POSTING URL</span>
            <strong className="detail-job-url">
              <a href={report.jobUrl} target="_blank" rel="noopener noreferrer">{report.jobUrl}</a>
              <ExternalLink size={14} aria-hidden="true"/>
            </strong>
          </>}
        </div>
        {!report.isRedacted && report.description && <section className="report-description">
          <p className="eyebrow">Incident description</p>
          <p>{report.description}</p>
        </section>}
        <div className="fairness-note"><FileWarning/><div><strong>Read this report with care</strong><p>A community submission is not proof of fraud. Confirm information independently and use official company contact details.</p></div></div>
      </article>
      {hasPublicEvidence && <aside className="detail-aside has-evidence">
        <ReportPublicationStatus report={report}/>
        <section className="report-evidence">
          <p className="eyebrow">Submitted images</p>
          <div className="report-evidence-grid">
            {report.evidence?.map((item, index) => <EvidenceImage evidence={item} index={index} key={item.id}/>) }
          </div>
        </section>
      </aside>}
    </div>
  </main>
}
