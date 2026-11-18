import { ArrowUpRight, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Report } from '../lib/api'
import { formatTitleCase } from '../lib/formatting'

export default function ReportCard({ report, showStatusAndRecruiterContact = true }: {
  report: Report
  showStatusAndRecruiterContact?: boolean
}) {
  return <article className="report-row">
    <div className="report-index"><span>CASE FILE</span><strong>{report.id.slice(-3).toUpperCase()}</strong></div>
    <div className="report-main">
      <div className="report-meta"><span className="category-label">{report.category}</span><time dateTime={report.date}>{new Date(report.date).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'})}</time>{report.illustrative && <span className="demo-label">Illustrative sample</span>}</div>
      <p className="report-company"><span>Organization</span><strong>{report.companyName}</strong></p>
      <h3><Link to={`/reports/${encodeURIComponent(report.id)}`}>{formatTitleCase(report.title)}</Link></h3>
      {report.isRedacted ? <p className="redacted-summary"><ShieldAlert size={14}/> Report details are not currently available in this public listing.</p> : <p>{report.summary}</p>}
      <div className="report-footer">{showStatusAndRecruiterContact && <span className="status-label">{report.status}</span>}{report.isRedacted && <span className="redaction-label">Details protected</span>}{report.submittedBy && <span className="report-submitter">Submitted by <strong>{report.submittedBy}</strong></span>}{showStatusAndRecruiterContact && !report.isRedacted && report.identifier && <span className="identifier"><span>Reported recruiter mobile</span><strong>{report.identifier}</strong></span>}{Boolean(report.relatedCount) && <span className="related-count">{report.relatedCount} potentially related {report.relatedCount===1?'report':'reports'}</span>}</div>
    </div>
    <Link className="report-arrow" to={`/reports/${encodeURIComponent(report.id)}`} aria-label={`Read ${formatTitleCase(report.title)}`}><ArrowUpRight size={20}/></Link>
  </article>
}
