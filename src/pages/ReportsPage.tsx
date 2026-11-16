import { FormEvent, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ReportCard from '../components/ReportCard'
import { api, type Report } from '../lib/api'

const PAGE_SIZE = 8

export default function ReportsPage() {
  const [params,setParams] = useSearchParams()
  const page = Math.max(1,Number(params.get('page') ?? '1') || 1)
  const [query,setQuery] = useState(params.get('q') ?? '')
  const [reports,setReports] = useState<Report[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [total,setTotal] = useState(0)
  const [isSample,setIsSample] = useState(false)

  async function runSearch(searchQuery: string,currentPage: number) {
    setLoading(true)
    setError('')
    try {
      const result = await api.searchReports(searchQuery,currentPage,PAGE_SIZE)
      setReports(result.items)
      setTotal(result.total)
      setIsSample(Boolean(result.isSample))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load reports.')
      setIsSample(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    const searchQuery = params.get('q') ?? ''
    setQuery(searchQuery)
    void runSearch(searchQuery,page)
  },[params,page])

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (query.trim()) next.set('q',query.trim())
    setParams(next)
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    if (nextPage <= 1) next.delete('page')
    else next.set('page',String(nextPage))
    setParams(next)
  }

  const totalPages = Math.max(1,Math.ceil(total/PAGE_SIZE))
  const pageWindowStart = Math.max(1,Math.min(page-2,Math.max(1,totalPages-4)))
  const visiblePages = Array.from({length:Math.min(5,totalPages)},(_,index)=>pageWindowStart+index)

  return <main className="inner-page">
    <div className="inner-intro"><p className="eyebrow">The evidence archive</p><h1>Explore the <em>reports.</em></h1><p>Approved reports include reviewed details. Other submissions remain visible with their review status while recruiter identities, contact details, evidence, and raw descriptions stay protected.</p></div>
    {isSample && <p className="demo-notice">Illustrative frontend preview. This is not a real allegation and appears only while the reports API is unavailable.</p>}
    <form className="search-box archive-search" onSubmit={submit}><Search size={21}/><label className="sr-only" htmlFor="archive-query">Search reports</label><input id="archive-query" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search company, recruiter email, phone number, domain or reference…"/><button type="submit">Search</button></form>
    <div className="results-bar"><span><SlidersHorizontal size={15}/> {loading?'Searching…':`${total} ${total===1?'report':'reports'} found`}</span><Link to="/submit">Submit a report ↗</Link></div>
    {error && <div className="error-panel">{error}<p>Check your API URL and endpoint mapping in <code>src/lib/api.ts</code>.</p></div>}
    {loading ? <p className="empty-note">Looking through the archive…</p> : reports.length ? <>
      <div className="report-list">{reports.map(report=><ReportCard key={report.id} report={report}/>)}</div>
      {totalPages > 1 && <nav className="report-pagination" aria-label="Report pages">
        <button type="button" onClick={()=>changePage(page-1)} disabled={page<=1}><ChevronLeft size={16}/> Previous</button>
        <div className="pagination-pages">{visiblePages.map(pageNumber=><button type="button" key={pageNumber} className={page===pageNumber?'active':''} aria-current={page===pageNumber?'page':undefined} aria-label={`Go to page ${pageNumber}`} onClick={()=>changePage(pageNumber)}>{pageNumber}</button>)}</div>
        <button type="button" onClick={()=>changePage(page+1)} disabled={page>=totalPages}>Next <ChevronRight size={16}/></button>
      </nav>}
    </> : !error ? <div className="empty-state"><span>NO MATCHING REPORTS</span><h2>Nothing in the archive yet.</h2><p>This does not mean the offer is legitimate. Verify it directly with the company through an official channel.</p><Link className="button button-primary" to="/submit">Report your experience</Link></div> : null}
  </main>
}
