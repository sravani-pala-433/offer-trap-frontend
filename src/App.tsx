import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import HomePage from './pages/HomePage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import SubmitReportPage from './pages/SubmitReportPage'

export default function App(){
  const [theme,setTheme]=useState<'light'|'dark'>(()=>document.documentElement.dataset.theme==='dark'?'dark':'light')
  function toggleTheme(){
    const next=theme==='dark'?'light':'dark'
    document.documentElement.dataset.theme=next
    const themeColor=document.querySelector('meta[name="theme-color"]')
    if(themeColor)themeColor.setAttribute('content',next==='dark'?'#191a1e':'#f8f5ef')
    setTheme(next)
    try{window.localStorage.setItem('offertrap-theme-v2',next)}catch(error){console.error('Unable to save the OfferTrap theme preference.',error)}
  }
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader theme={theme} onToggleTheme={toggleTheme}/><div id="main-content"><Routes><Route path="/" element={<HomePage/>}/><Route path="/reports" element={<ReportsPage/>}/><Route path="/reports/:id" element={<ReportDetailPage/>}/><Route path="/submit" element={<SubmitReportPage/>}/><Route path="*" element={<main className="inner-page"><h1>Page not found.</h1><a href="/">Return home</a></main>}/></Routes></div><SiteFooter/></div>
}