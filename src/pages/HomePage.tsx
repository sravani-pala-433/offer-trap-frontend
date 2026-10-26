import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Search, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import LetterfallHero from '../components/LetterfallHero'
import ReportCard from '../components/ReportCard'
import { api, demoMode, type Report } from '../lib/api'

export default function HomePage() {
  const [reports,setReports] = useState<Report[]>([])
  const [error,setError] = useState('')
  useEffect(()=>{ api.searchReports('',1,3).then(r=>setReports(r.items.slice(0,3))).catch(e=>setError(e.message)) },[])
  return <main>
    <LetterfallHero/>
    <section className="ticker" aria-label="Platform principles"><span>LOOK CLOSER</span><i/> <span>VERIFY THE SOURCE</span><i/> <span>SHARE WHAT YOU LEARN</span><i/> <span>LOOK CLOSER</span></section>
    <section className="section archive-section" id="reports">
      <div className="section-heading"><div><p className="eyebrow">The community archive</p><h2>Has someone seen<br/><em>this before?</em></h2></div><p className="section-intro">Search reports for similar offers, recruiter details, and warning signs.</p></div>
      {demoMode && <p className="demo-notice">Demo mode. Sample reports are illustrative, not verified allegations.</p>}
      {error && <p className="inline-error">{error}</p>}
      <div className="report-list">{reports.map(r=><ReportCard key={r.id} report={r}/>)}</div>
      {!reports.length && !error && <p className="empty-note">Loading community reports…</p>}
      <div className="section-bottom"><Link className="text-link" to="/reports">Explore all reports <ArrowUpRight size={16}/></Link><span className="quiet-meta">COMMUNITY-SUBMITTED · REVIEW STATUS SHOWN</span></div>
    </section>
    <section className="story-section" id="how-it-works">
      <div className="story-side"><p className="eyebrow">A little doubt can be useful</p><h2>Pause the excitement.<br/><em>Check the details.</em></h2><p>A polished offer letter can still contain warning signs. Take a moment to examine the details and look for independent confirmation.</p><Link className="button button-dark" to="/reports">Start investigating <ArrowUpRight size={16}/></Link></div>
      <div className="steps">
        <div className="step"><span>01</span><div><h3>Search the trail</h3><p>Look for company names, recruiter contacts, and similar community reports.</p></div><Search/></div>
        <div className="step"><span>02</span><div><h3>Check the details</h3><p>Lookalike domains, upfront fees, and pressure tactics deserve extra scrutiny.</p></div><ShieldCheck/></div>
        <div className="step"><span>03</span><div><h3>Share what happened</h3><p>Submit evidence for review so other candidates can learn from the pattern.</p></div><ArrowDownRight/></div>
      </div>
    </section>
    <section className="safety-section" id="safety"><div className="safety-mark"><ShieldCheck size={27}/><span>TRUST IS EARNED</span></div><div><p className="eyebrow">A note on fairness</p><h2>A report is a signal.<br/><em>Not a verdict.</em></h2><p>Community submissions can be incomplete or mistaken. Review status matters. Verify recruitment through official company channels, and never treat the absence of a report as proof that an offer is legitimate.</p></div><Link className="text-link" to="/submit">Share a report <ArrowUpRight size={16}/></Link><CheckCircle2 className="safety-watermark"/></section>
  </main>
}