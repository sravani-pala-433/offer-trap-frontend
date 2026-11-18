import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, Image as ImageIcon, LockKeyhole, LogOut, Mail, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { adminSession, api, type AdminEvidence, type AdminReport, type ReviewStatus } from '../lib/api'

type Filter = 'all' | ReviewStatus

const filterLabels: Record<Filter,string> = {
  all:'All reports',
  submitted:'Published',
  rejected:'Rejected',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1,Math.round(bytes/1024))} KB`
  return `${(bytes/1024/1024).toFixed(2)} MB`
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [filter,setFilter] = useState<Filter>('all')
  const [reports,setReports] = useState<AdminReport[]>([])
  const [notes,setNotes] = useState<Record<string,string>>({})
  const [searchInput,setSearchInput] = useState('')
  const [query,setQuery] = useState('')
  const [emailInput,setEmailInput] = useState('')
  const [submitterEmail,setSubmitterEmail] = useState('')
  const [loading,setLoading] = useState(true)
  const [busyId,setBusyId] = useState('')
  const [error,setError] = useState('')
  const [deleteCandidate,setDeleteCandidate] = useState<AdminReport|null>(null)
  const [deleteError,setDeleteError] = useState('')
  const deleteDialogRef = useRef<HTMLDialogElement|null>(null)

  const token = adminSession.get()

  const loadReports = useCallback(async () => {
    if (!token) {
      navigate('/admin/login',{replace:true})
      return
    }
    setLoading(true)
    setError('')
    try {
      setReports(await api.getAdminReports(
        token,
        filter === 'all' ? undefined : filter,
        query,
        submitterEmail,
      ))
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load reports.'
      setError(message)
      if (/admin session|required|unauthorized|valid/i.test(message)) {
        adminSession.clear()
        navigate('/admin/login',{replace:true})
      }
    } finally {
      setLoading(false)
    }
  },[filter,navigate,query,submitterEmail,token])

  useEffect(()=>{ void loadReports() },[loadReports])

  useEffect(()=>{
    if (deleteCandidate) deleteDialogRef.current?.showModal()
  },[deleteCandidate])

  function logout() {
    adminSession.clear()
    navigate('/admin/login',{replace:true})
  }

  function search(event: FormEvent) {
    event.preventDefault()
    setQuery(searchInput.trim())
    setSubmitterEmail(emailInput.trim())
  }

  function clearSearch() {
    setSearchInput('')
    setQuery('')
    setEmailInput('')
    setSubmitterEmail('')
  }

  async function rejectReport(report: AdminReport) {
    if (!token || report.reviewStatus === 'rejected') return
    setBusyId(report.id)
    setError('')
    try {
      await api.reviewReport(token,report.id,'rejected',notes[report.id] ?? report.reviewNote)
      await loadReports()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to reject the report.')
    } finally {
      setBusyId('')
    }
  }

  function requestDeleteReport(report: AdminReport) {
    setDeleteError('')
    setDeleteCandidate(report)
  }

  async function confirmDeleteReport() {
    const report = deleteCandidate
    if (!token || !report) return
    setBusyId(report.id)
    setDeleteError('')
    try {
      await api.deleteReport(token, report.id)
      setReports(previous => previous.filter(item => item.id !== report.id))
      setNotes(previous => {
        const next = { ...previous }
        delete next[report.id]
        return next
      })
      setDeleteCandidate(null)
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Unable to delete the report.')
    } finally {
      setBusyId('')
    }
  }

  function cancelDeleteReport() {
    if (deleteCandidate && busyId === deleteCandidate.id) return
    setDeleteError('')
    setDeleteCandidate(null)
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
      <div><p className="eyebrow">Private moderation workspace</p><h1>Report review.</h1><p>New reports are published immediately as unverified community submissions. You can reject a whole report; submitter emails remain private.</p></div>
      <div className="admin-heading-actions"><button className="button button-quiet" type="button" onClick={()=>void loadReports()}><RefreshCw size={15}/> Refresh</button><button className="button button-quiet" type="button" onClick={logout}><LogOut size={15}/> Sign out</button></div>
    </div>

    <form className="admin-search" role="search" onSubmit={search}>
      <label className="admin-search-field" htmlFor="admin-report-search">
        <Search size={19}/>
        <span className="sr-only">Search reports</span>
        <input id="admin-report-search" value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Search company, recruiter, reference, or report text"/>
      </label>
      <label className="admin-search-field admin-email-filter" htmlFor="admin-email-search">
        <Mail size={18}/>
        <span className="sr-only">Filter by submitter email</span>
        <input id="admin-email-search" type="email" value={emailInput} onChange={event=>setEmailInput(event.target.value)} placeholder="Exact submitter email"/>
      </label>
      <button className="admin-search-submit" type="submit">Apply filters</button>
      {(searchInput || emailInput) && <button className="admin-search-clear" type="button" aria-label="Clear filters" onClick={clearSearch}><X size={16}/></button>}
    </form>
    {(query || submitterEmail) && <div className="admin-search-context">
      <span>{query && <>Search: “{query}”</>}{query && submitterEmail && ' · '}{submitterEmail && <>Submitter email: {submitterEmail}</>}</span>
      <button type="button" onClick={clearSearch}>Clear filters</button>
    </div>}
    <div className="admin-filters" role="group" aria-label="Filter reports by publication status">
      {(Object.keys(filterLabels) as Filter[]).map(value=><button type="button" className={filter===value?'active':''} aria-pressed={filter===value} key={value} onClick={()=>setFilter(value)}>{filterLabels[value]}</button>)}
    </div>

    {error && <div className="error-panel" role="alert">{error}</div>}
    {loading ? <p className="empty-note">Loading private reports...</p> : reports.length === 0 ? <div className="empty-state"><span>REPORT ARCHIVE</span><h2>No reports found.</h2><p>Adjust the status or email filter, or clear your search.</p></div> :
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
              <div><dt>Recruiter name</dt><dd>{report.recruiterName || 'Not provided'}</dd></div>
              <div><dt>Recruiter mobile</dt><dd>{report.recruiterContact || 'Not provided'}</dd></div>
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
              <span>Evidence files · {report.evidence.length}</span>
              {report.evidence.length === 0 ? <p>No images attached.</p> : report.evidence.map(item=><button type="button" key={item.id} onClick={()=>void download(item)}><ImageIcon size={14}/><span>{item.name}<small>{formatBytes(item.sizeBytes)}</small></span><Download size={14}/></button>)}
            </div>
          </aside>
        </div>
        <footer className="admin-review-controls">
          {report.reviewStatus === 'rejected'
            ? <p className="admin-rejection-note">This whole report is rejected and hidden from the public archive.{report.reviewNote ? ` Note: ${report.reviewNote}` : ''}</p>
            : <>
              <label>Private note for the submitter <span>Visible on their report-status page</span><textarea rows={2} value={notes[report.id] ?? report.reviewNote ?? ''} onChange={event=>setNotes(previous=>({...previous,[report.id]:event.target.value}))} placeholder="Optional reason for rejecting the report"/></label>
              <div className="admin-report-actions"><button className="button admin-reject" type="button" disabled={busyId===report.id} onClick={()=>void rejectReport(report)}><X size={15}/> Reject report</button><button className="button admin-delete" type="button" disabled={busyId===report.id} onClick={()=>requestDeleteReport(report)}><Trash2 size={15}/> Delete report</button></div>
            </>}
          {report.reviewStatus === 'rejected' && <div className="admin-report-actions"><button className="button admin-delete" type="button" disabled={busyId===report.id} onClick={()=>requestDeleteReport(report)}><Trash2 size={15}/> Delete report</button></div>}
          {report.reviewStatus !== 'rejected' && <Link className="admin-public-link" to={`/reports/${encodeURIComponent(report.id)}`}>View public report <ExternalLink size={13}/></Link>}
        </footer>
      </article>)}</div>}
    {deleteCandidate && <dialog
      ref={deleteDialogRef}
      className="admin-confirm-dialog"
      role="alertdialog"
      aria-labelledby="admin-delete-title"
      aria-describedby="admin-delete-description"
      onCancel={event=>{
        event.preventDefault()
        cancelDeleteReport()
      }}
      onClick={event=>{
        if (event.target === event.currentTarget) cancelDeleteReport()
      }}
    >
      <div className="admin-confirm-content">
        <div className="admin-confirm-icon"><Trash2 size={20}/></div>
        <p className="eyebrow">Permanent action</p>
        <h2 id="admin-delete-title">Delete this report?</h2>
        <p id="admin-delete-description">Permanently delete the report for <strong>{deleteCandidate.companyName}</strong>? Its evidence images and review history will also be deleted. This cannot be undone.</p>
        {deleteError && <p className="admin-confirm-error" role="alert">{deleteError}</p>}
        <div className="admin-confirm-actions">
          <button className="button button-quiet" type="button" autoFocus disabled={busyId===deleteCandidate.id} onClick={cancelDeleteReport}>Cancel</button>
          <button className="button admin-delete admin-confirm-delete" type="button" disabled={busyId===deleteCandidate.id} onClick={()=>void confirmDeleteReport()}>
            <Trash2 size={15}/>{busyId===deleteCandidate.id?'Deleting…':'Delete report'}
          </button>
        </div>
      </div>
    </dialog>}
  </main>
}
