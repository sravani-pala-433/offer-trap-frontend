import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Check, Download, ExternalLink, FileQuestion, FileText, LockKeyhole, LogOut, RefreshCw, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { adminSession, api, type AdminEvidence, type AdminReport, type ReviewStatus } from '../lib/api'

type Filter = 'all' | ReviewStatus

const filterLabels: Record<Filter,string> = {
  all:'All submissions',
  submitted:'Submitted',
  under_review:'Under review',
  needs_information:'Needs information',
  approved:'Approved',
  rejected:'Rejected',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1,Math.round(bytes/1024))} KB`
  return `${(bytes/1024/1024).toFixed(2)} MB`
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [filter,setFilter] = useState<Filter>('submitted')
  const [reports,setReports] = useState<AdminReport[]>([])
  const [notes,setNotes] = useState<Record<string,string>>({})
  const [searchInput,setSearchInput] = useState('')
  const [query,setQuery] = useState('')
  const [loading,setLoading] = useState(true)
  const [busyId,setBusyId] = useState('')
  const [error,setError] = useState('')

  const token = adminSession.get()

  const loadReports = useCallback(async () => {
    if (!token) {
      navigate('/admin/login',{replace:true})
      return
    }
    setLoading(true)
    setError('')
    try {
      setReports(await api.getAdminReports(token,filter === 'all' ? undefined : filter,query))
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load submissions.'
      setError(message)
      if (/admin session|required|unauthorized|valid/i.test(message)) {
        adminSession.clear()
        navigate('/admin/login',{replace:true})
      }
    } finally {
      setLoading(false)
    }
  },[filter,navigate,query,token])

  useEffect(()=>{ void loadReports() },[loadReports])

  function logout() {
    adminSession.clear()
    navigate('/admin/login',{replace:true})
  }

  function search(event: FormEvent) {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  function clearSearch() {
    setSearchInput('')
    setQuery('')
  }

  async function decide(report: AdminReport, decision: 'needs_information'|'approved'|'rejected') {
    if (!token) return
    setBusyId(report.id)
    setError('')
    try {
      await api.reviewReport(token,report.id,decision,notes[report.id] ?? report.reviewNote)
      await loadReports()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the review decision.')
    } finally {
      setBusyId('')
    }
  }

  async function download(evidence: AdminEvidence) {
    if (!token) return
    setError('')
    try {
      await api.downloadEvidence(token,evidence)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to download evidence.')
    }
  }

  return <main className="inner-page admin-page">
    <div className="admin-heading">
      <div><p className="eyebrow">Private moderation workspace</p><h1>Evidence review.</h1><p>Submitter emails and uploaded evidence are visible only inside this authenticated view.</p></div>
      <div className="admin-heading-actions"><button className="button button-quiet" type="button" onClick={()=>void loadReports()}><RefreshCw size={15}/> Refresh</button><button className="button button-quiet" type="button" onClick={logout}><LogOut size={15}/> Sign out</button></div>
    </div>

    <form className="admin-search" role="search" onSubmit={search}>
      <Search size={20}/>
      <label className="sr-only" htmlFor="admin-report-search">Search private submissions</label>
      <input id="admin-report-search" value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Search company, email, or reference…"/>
      {searchInput && <button className="admin-search-clear" type="button" aria-label="Clear search" onClick={clearSearch}><X size={16}/></button>}
      <button className="admin-search-submit" type="submit">Search</button>
    </form>
    {query && <div className="admin-search-context"><span>Results for “{query}”</span><button type="button" onClick={clearSearch}>Clear search</button></div>}
    <div className="admin-filters" role="group" aria-label="Filter submissions">
      {(Object.keys(filterLabels) as Filter[]).map(value=><button type="button" className={filter===value?'active':''} aria-pressed={filter===value} key={value} onClick={()=>setFilter(value)}>{filterLabels[value]}</button>)}
    </div>

    {error && <div className="error-panel" role="alert">{error}</div>}
    {loading ? <p className="empty-note">Loading private submissions…</p> : reports.length === 0 ? <div className="empty-state"><span>REVIEW QUEUE</span><h2>No submissions here.</h2><p>Choose another status filter or refresh the queue.</p></div> :
      <div className="admin-report-list">{reports.map(report=><article className="admin-report-card" key={report.id}>
        <header>
          <div><span className={`review-badge review-badge-${report.reviewStatus}`}>{report.status}</span><p>{new Date(report.date).toLocaleString()}</p></div>
          <strong>#{report.id}</strong>
        </header>
        <div className="admin-report-grid">
          <section>
            <p className="eyebrow">{report.category}</p>
            <h2>{report.companyName}</h2>
            <p className="admin-description">{report.description}</p>
            <dl className="admin-metadata">
              <div><dt>Job title</dt><dd>{report.jobTitle || 'Not provided'}</dd></div>
              <div><dt>Recruiter contact</dt><dd>{report.recruiterContact || 'Not provided'}</dd></div>
              <div><dt>Payment requested</dt><dd>{report.paymentRequested ? 'Yes' : 'No'}</dd></div>
              <div><dt>Public identity</dt><dd>{report.isAnonymous ? 'Anonymous' : report.submitterName}</dd></div>
            </dl>
            {report.jobUrl && <a className="text-link admin-job-link" href={report.jobUrl} target="_blank" rel="noreferrer">Open job posting <ExternalLink size={14}/></a>}
          </section>
          <aside className="admin-private-panel">
            <p><LockKeyhole size={14}/> Private submitter details</p>
            <strong>{report.submitterName}</strong>
            <a href={`mailto:${report.submitterEmail}`}>{report.submitterEmail}</a>
            {report.isAnonymous && <small>Requested public anonymity</small>}
            <div className="admin-evidence">
              <span>Evidence · {report.evidence.length}</span>
              {report.evidence.length === 0 ? <p>No files attached.</p> : report.evidence.map(item=><button type="button" key={item.id} onClick={()=>void download(item)}><FileText size={14}/><span>{item.name}<small>{formatBytes(item.sizeBytes)}</small></span><Download size={14}/></button>)}
            </div>
          </aside>
        </div>
        <footer className="admin-review-controls">
          <label>Reviewer note <span>Shown on the submitter’s status page</span><textarea rows={2} maxLength={1000} value={notes[report.id] ?? report.reviewNote ?? ''} onChange={event=>setNotes(previous=>({...previous,[report.id]:event.target.value}))} placeholder="Optional reason or next step"/></label>
          <div>
            <button className="button admin-reject" type="button" disabled={busyId===report.id} onClick={()=>void decide(report,'rejected')}><X size={15}/> Reject</button>
            <button className="button admin-needs-info" type="button" disabled={busyId===report.id} onClick={()=>void decide(report,'needs_information')}><FileQuestion size={15}/> Request info</button>
            <button className="button admin-approve" type="button" disabled={busyId===report.id} onClick={()=>void decide(report,'approved')}><Check size={15}/> Approve</button>
          </div>
          {report.reviewStatus==='approved' && <Link className="admin-public-link" to={`/reports/${encodeURIComponent(report.id)}`}>View public report <ExternalLink size={13}/></Link>}
        </footer>
      </article>)}</div>}
  </main>
}
