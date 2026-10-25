import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ArrowUpRight, Moon, Sun } from 'lucide-react'

type SiteHeaderProps={theme:'light'|'dark';onToggleTheme:()=>void}

export default function SiteHeader({theme,onToggleTheme}:SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const sectionIsActive = (section: string) =>
    location.pathname === '/' && location.hash === section

  return <header className="site-header">
    <Link to="/" className="wordmark" aria-label="OfferTrap home">Offer<span>Trap</span><i>.</i></Link>
    <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
      <NavLink to="/reports" onClick={() => setOpen(false)}>Explore reports</NavLink>
      <a href="/#how-it-works" className={sectionIsActive('#how-it-works') ? 'active' : undefined} aria-current={sectionIsActive('#how-it-works') ? 'page' : undefined} onClick={() => setOpen(false)}>How it works</a>
      <a href="/#safety" className={sectionIsActive('#safety') ? 'active' : undefined} aria-current={sectionIsActive('#safety') ? 'page' : undefined} onClick={() => setOpen(false)}>Safety guide</a>
      <NavLink to="/submit" className={({isActive}) => `nav-report${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>Report an alert <ArrowUpRight size={15}/></NavLink>
    </nav>
    <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
    <button className="mobile-menu icon-button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? <X/> : <Menu/>}</button>
  </header>
}