import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Search, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import LetterfallHero from '../components/LetterfallHero'
import ReportCard from '../components/ReportCard'
import { api, type Report } from '../lib/api'
import { sampleReport } from '../data/sampleReport'

export default function HomePage() {
  const [reports,setReports] = useState<Report[]>([])
  const [showingSample,setShowingSample] = useState(false)
  useEffect(()=>{
    api.searchReports('',1,1).then(result=>{
      const report = result.items[0]
      setReports([report ?? sampleReport])
      setShowingSample(Boolean(result.isSample || !report || report.illustrative))
    }).catch(()=>{
      setReports([sampleReport])
      setShowingSample(true)
    })
  },[])
  return <main>
    <LetterfallHero/>
    <section className="ticker" aria-label="Platform principles"><span>LOOK CLOSER</span><i/> <span>VERIFY THE SOURCE</span><i/> <span>SHARE WHAT YOU LEARN</span><i/> <span>LOOK CLOSER</span></section>
    <section className="section archive-section" id="reports">
      <div className="section-heading"><div><p className="eyebrow">The community archive</p><h2>Has someone seen<br/><em>this before?</em></h2></div><p className="section-intro">See every submission’s review status. Recruiter details appear only after a report is approved.</p></div>
      {showingSample && <p className="demo-notice">Illustrative preview shown while published API data is unavailable. This is not a real allegation.</p>}
      <div className="report-list">{reports.map(r=><ReportCard key={r.id} report={r}/>)}</div>
      {!reports.length && <p className="empty-note">Loading community reports…</p>}
      <div className="section-bottom"><Link className="text-link" to="/reports">Explore all reports <ArrowUpRight size={16}/></Link><span className="quiet-meta">COMMUNITY-SUBMITTED · REVIEW STATUS SHOWN</span></div>
    </section>
    {/* Temporarily hidden per request; keep this section available for a future landing-page redesign.
    <section className="landing-trust" aria-labelledby="trust-heading">
      <div className="trust-heading">
        <div><p className="eyebrow">What you can trust here</p><h2 id="trust-heading">Transparency without<br/><em>exposure.</em></h2></div>
        <p>OfferTrap shows that a submission exists while protecting the people and evidence behind it until review is complete.</p>
      </div>
      <div className="trust-grid">
        <article><span><ListChecks size={22}/></span><small>01 · VISIBLE PROCESS</small><h3>Every report carries a status</h3><p>Submitted, under review, needs information, approved, or rejected—you can see where a report stands.</p></article>
        <article><span><EyeOff size={22}/></span><small>02 · PRIVACY FIRST</small><h3>Sensitive details stay protected</h3><p>Contributor email, evidence, raw descriptions, and recruiter identifiers remain private until they are safe to publish.</p></article>
        <article><span><BadgeCheck size={22}/></span><small>03 · REVIEWED CONTEXT</small><h3>Approval unlocks reviewed details</h3><p>Approved reports can show moderated summaries and relevant identifiers, always with a community-report disclaimer.</p></article>
      </div>
    </section>
    */}
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
