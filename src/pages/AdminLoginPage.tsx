import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLoginMockMode, adminSession, api } from '../lib/api'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username,setUsername] = useState('')
  const [password,setPassword] = useState('')
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [validation,setValidation] = useState<{username?:string;password?:string}>({})

  useEffect(()=>{ if (adminSession.get()) navigate('/admin',{replace:true}) },[navigate])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextValidation: {username?:string;password?:string} = {}
    if (!username.trim()) nextValidation.username = 'Username is required.'
    else if (username.trim().length < 3) nextValidation.username = 'Username must contain at least 3 characters.'
    if (!password) nextValidation.password = 'Password is required.'
    else if (password.length < 6) nextValidation.password = 'Password must contain at least 6 characters.'
    setValidation(nextValidation)
    if (Object.keys(nextValidation).length) return
    setBusy(true)
    setError('')
    try {
      const session = await api.adminLogin(username,password)
      adminSession.set(session.accessToken)
      navigate('/admin',{replace:true})
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="inner-page admin-login-page">
    <Link className="text-link" to="/"><ArrowLeft size={16}/> Return to site</Link>
    <div className="admin-login-layout">
      <div className="admin-login-copy">
        <span className="admin-lock"><LockKeyhole size={26}/></span>
        <p className="eyebrow">Restricted access</p>
        <h1>Evidence review<br/><em>desk.</em></h1>
        <p>Sign in to review submissions, see private submitter contact details, and approve or reject evidence.</p>
        <div className="admin-letterfall" aria-hidden="true">
          <span className="admin-letter admin-letter-one"><small>CASE 01</small><strong>O</strong><i>OFFER</i></span>
          <span className="admin-letter admin-letter-two"><small>REVIEW</small><strong>T</strong><i>TRACE</i></span>
          <span className="admin-letter admin-letter-three"><small>VERIFY</small><strong>?</strong><i>CHECK</i></span>
          <div className="admin-letter-seal"><b>Offer<em>Trap</em><i>.</i></b><span>EVIDENCE IN MOTION</span></div>
        </div>
      </div>
      <form className="submission-form admin-login-form" onSubmit={submit} noValidate>
        <div className="form-heading"><span>Administrator login</span><p>Authorized reviewers only.</p></div>
        {adminLoginMockMode && <p className="demo-notice">Temporary frontend-only login is active. Use any username with at least 3 characters and any password with at least 6 characters. Dashboard data still comes from your backend API.</p>}
        <label>Username<input required minLength={3} autoComplete="username" value={username} aria-invalid={Boolean(validation.username)} aria-describedby={validation.username?'admin-username-error':undefined} onChange={event=>{setUsername(event.target.value);setValidation(previous=>({...previous,username:undefined}))}}/>{validation.username&&<span className="field-error" id="admin-username-error">{validation.username}</span>}</label>
        <label>Password<input required minLength={6} type="password" autoComplete="current-password" value={password} aria-invalid={Boolean(validation.password)} aria-describedby={validation.password?'admin-password-error':undefined} onChange={event=>{setPassword(event.target.value);setValidation(previous=>({...previous,password:undefined}))}}/>{validation.password&&<span className="field-error" id="admin-password-error">{validation.password}</span>}</label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary submit-button" type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'} <ArrowUpRight size={16}/></button>
      </form>
    </div>
  </main>
}
