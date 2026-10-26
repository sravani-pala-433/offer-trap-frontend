import { motion, useReducedMotion } from 'framer-motion'
import { Search, ArrowUpRight, FileWarning } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const papers = [
  { className:'paper-one', label:'JOB OFFER', sub:'Congratulations on your selection', stamp:'VERIFY FIRST' },
  { className:'paper-two', label:'URGENT', sub:'Pay your registration fee today', stamp:'PAY NOW' },
]
export default function LetterfallHero() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  function search(e: FormEvent) { e.preventDefault(); navigate(`/reports?q=${encodeURIComponent(query.trim())}`) }
  return <section className="hero">
    <div className="hero-launch" aria-hidden="true">
      <svg className="paper-rocket" viewBox="0 0 330 210" role="presentation">
        <path className="rocket-sheet" d="M12 90 306 12 214 193 166 132 12 90Z"/>
        <path className="rocket-fold" d="m12 90 154 42 140-120-91 111-1 70-48-61Z"/>
        <path className="rocket-wing" d="m166 132-91 60 29-68Z"/>
        <path className="rocket-crease" d="m104 124 62 8 140-120"/>
        <g className="rocket-letter" transform="rotate(-14 166 86)">
          <text x="105" y="63">EMPLOYMENT OFFER</text>
          <path d="M105 72h97M105 80h79"/>
          <text x="105" y="98">PAY A FEE TO CONFIRM</text>
          <path d="M105 106h62"/>
          <text className="rocket-warning" x="105" y="124">VERIFY FIRST</text>
        </g>
      </svg>
    </div>
    <div className="hero-copy">
      <motion.p className="eyebrow" initial={reduced ? false : { opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>A second look can change everything</motion.p>
      <motion.h1 initial={reduced ? false : { opacity:0, y:22 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.1 }}>Your next job offer deserves a <em>second look.</em></motion.h1>
      <motion.p className="hero-description" initial={reduced ? false : { opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6, delay:.2 }}>Search reports about suspicious job offers, check for warning signs, and share your experience. Reports are not proof, so verify offers directly with the company.</motion.p>
      <motion.div className="hero-actions" initial={reduced ? false : { opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, delay:.3 }}>
        <a className="button button-primary" href="#offer-search">Check a job offer <ArrowUpRight size={16}/></a>
        <a className="button button-quiet" href="/submit">Report a suspicious offer</a>
      </motion.div>
      <motion.form id="offer-search" className="search-box hero-search" onSubmit={search} initial={reduced ? false : { opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.5 }}>
        <Search size={19} aria-hidden="true"/><label className="sr-only" htmlFor="hero-query">Search company, recruiter email or phone number</label>
        <input id="hero-query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Company, recruiter email, phone number…" />
        <button aria-label="Search reports" type="submit"><Search size={18}/></button>
      </motion.form>
      <p className="hero-note"><span className="note-dot"/> Search community reports. Verify independently.</p>
    </div>
    <div className="hero-art" aria-label="A neatly arranged collection of suspicious recruitment documents">
      <div className="sun-disc"/>
      <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
      <div className="desk"/>
      <div className="paper-stack" aria-hidden="true"><i/><i/><i/></div>
      <div className="evidence-note" aria-hidden="true">
        <span>FIELD NOTE / 01</span>
        <strong>Check the sender before replying.</strong>
        <i>Upfront fees are a warning sign.</i>
      </div>
      {papers.map((paper,i)=><motion.div key={paper.className} className={`paper ${paper.className}`} initial={reduced ? false : { opacity:0, y:-12, rotate:i===0?-3:3 }} animate={reduced ? {opacity:1} : { opacity:1, y:[0,-2,0], rotate:i===0?-3:3, x:0 }} transition={reduced ? {duration:.2} : { opacity:{duration:.6,delay:.15+i*.12}, y:{duration:6+i,repeat:Infinity,ease:'easeInOut',delay:i*.3} }} aria-hidden="true">
        <div className="paper-topline"><span>PRIVATE & CONFIDENTIAL</span><span>№ 0{i+1}</span></div>
        <strong>{paper.label}</strong><small>{paper.sub}</small><div className="paper-lines"><i/><i/><i/><i/></div>
        {paper.stamp && <span className="paper-stamp">{paper.stamp}</span>}
      </motion.div>)}
      <motion.div className="landing-letter" initial={reduced ? false : {y:-120,rotate:13,opacity:0}} animate={{y:0,rotate:-4,opacity:1}} transition={{duration:1.1,delay:.6,type:'spring',stiffness:75,damping:14}}>
        <div className="landing-kicker"><FileWarning size={13}/> PLEASE REVIEW</div>
        <h3>Congratulations!</h3><p>Your offer is ready. To confirm your position, please pay a registration fee.</p>
        <div className="landing-stamp">VERIFY FIRST</div>
      </motion.div>
      <motion.div className="art-caption" initial={reduced ? false : {opacity:0}} animate={{opacity:1}} transition={{delay:1.3}}>Not every promise is an opportunity.</motion.div>
    </div>
  </section>
}