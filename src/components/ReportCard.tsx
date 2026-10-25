import { ArrowUpRight, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Report } from '../lib/api'

export default function ReportCard({ report }: { report: Report }) {
  return <article className="report-row">
    <div className="report-index"><span>CASE FILE</span><strong>{report.id.slice(-3).toUpperCase()}</strong></div>
    <div className="report-main">
      <div className="report-meta"><span className="category-label">{report.category}</span><time dateTime={report.date}>{new Date(report.date).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'})}</time>{report.illustrative && <span className="demo-label">Illustrative sample</span>}</div>
      <p className="report-company"><span>Organization</span><strong>{report.companyName}</strong></p>
      <h3><Link to={`/reports/${encodeURIComponent(report.id)}`}>{report.title}</Link></h3>
      <p>{report.summary}</p>
      <div className="report-footer"><span className="status-label">{report.status}</span>{report.identifier && <span className="identifier"><Link2 size={13}/><span>Reported contact</span><strong>{report.identifier}</strong></span>}{Boolean(report.relatedCount) && <span className="related-count">{report.relatedCount} potentially related {report.relatedCount===1?'report':'reports'}</span>}</div>
    </div>
    <Link className="report-arrow" to={`/reports/${encodeURIComponent(report.id)}`} aria-label={`Read ${report.title}`}><ArrowUpRight size={20}/></Link>
  </article>
}