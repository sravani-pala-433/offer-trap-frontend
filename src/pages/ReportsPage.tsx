import { FormEvent, useEffect, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ReportCard from '../components/ReportCard'
import { api, demoMode, type Report } from '../lib/api'

export default function ReportsPage() {
  const [params,setParams] = useSearchParams()
  const [query,setQuery] = useState(params.get('q') ?? '')
  const [reports,setReports] = useState<Report[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [total,setTotal] = useState(0)
  async function runSearch(q:string) {
    setLoading(true);setError('')
    try { const result=await api.searchReports(q,1,30);setReports(result.items);setTotal(result.total) }
    catch(e) { setError(e instanceof Error?e.message:'Unable to load reports.') }
    finally { setLoading(false) }
  }
  useEffect(()=>{ const q=params.get('q')??'';setQuery(q);void runSearch(q) },[params])
  function submit(e:FormEvent){e.preventDefault();setParams(query.trim()?{q:query.trim()}:{})}
  return <main className="inner-page">
    <div className="inner-intro"><p className="eyebrow">The evidence archive</p><h1>Explore the <em>reports.</em></h1><p>Search community-submitted recruitment incidents. A match is a reason to investigate further, not proof of wrongdoing.</p></div>
    {demoMode && <p className="demo-notice">Demo mode. These are illustrative sample reports.</p>}
    <form className="search-box archive-search" onSubmit={submit}><Search size={18}/><label className="sr-only" htmlFor="archive-query">Search reports</label><input id="archive-query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Company, recruiter email, phone number…"/><button type="submit">Search</button></form>
    <div className="results-bar"><span><SlidersHorizontal size={15}/> {loading?'Searching…':`${total} ${total===1?'report':'reports'} found`}</span><Link to="/submit">Submit a report ↗</Link></div>
    {error && <div className="error-panel">{error}<p>Check your API URL and endpoint mapping in <code>src/lib/api.ts</code>.</p></div>}
    {loading ? <p className="empty-note">Looking through the archive…</p> : reports.length ? <div className="report-list">{reports.map(r=><ReportCard key={r.id} report={r}/>)}</div> : !error ? <div className="empty-state"><span>NO MATCHING REPORTS</span><h2>Nothing in the archive yet.</h2><p>This does not mean the offer is legitimate. Verify it directly with the company through an official channel.</p><Link className="button button-primary" to="/submit">Report your experience</Link></div> : null}
  </main>
}