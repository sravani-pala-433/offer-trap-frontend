export type ReportStatus = 'Community Report' | 'Under Review' | 'Corroborated Reports' | 'Disputed'
export type Report = {
  id: string
  companyName: string
  title: string
  category: string
  summary: string
  date: string
  status: ReportStatus
  identifier?: string
  relatedCount?: number
  illustrative?: boolean
}
export type SearchResponse = { items: Report[]; total: number; page: number; pageSize: number }
export type SubmitReportInput = {
  companyName: string
  recruiterContact: string
  jobTitle: string
  jobUrl: string
  category: string
  description: string
  paymentRequested: boolean
  evidence: File[]
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

const demoReports: Report[] = [
  { id:'demo-101', companyName:'Northstar Careers (sample)', title:'Upfront registration fee requested after selection', category:'Advance-fee recruitment', summary:'A sample report describes a request for payment before an interview confirmation. This illustrative entry is not a real allegation.', date:'2026-10-18', status:'Under Review', identifier:'careers@example.invalid', relatedCount:2, illustrative:true },
  { id:'demo-102', companyName:'BrightPath Hiring (sample)', title:'Recruitment message used a lookalike email domain', category:'Company impersonation', summary:'An illustrative report about a recruiter email domain that differs from the company’s official domain.', date:'2026-10-15', status:'Community Report', identifier:'jobs@example.invalid', relatedCount:1, illustrative:true },
  { id:'demo-103', companyName:'RemoteFirst Talent (sample)', title:'Offer received without a clear interview process', category:'Suspicious interview process', summary:'A fictional example showing how a candidate can document an unusual hiring process for review.', date:'2026-10-12', status:'Disputed', identifier:'recruiter@example.invalid', relatedCount:0, illustrative:true },
]
const isDemo = () => DEMO_MODE && (!API_BASE || API_BASE.includes('localhost:0000'))

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('API base URL is not configured.')
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `API request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// Normalize the shape here if your FastAPI response differs from this example.
function normalizeReport(raw: any): Report {
  return {
    id: String(raw.id ?? raw.report_id),
    companyName: raw.companyName ?? raw.company_name ?? 'Unspecified organization',
    title: raw.title ?? raw.incident_title ?? 'Recruitment report',
    category: raw.category ?? raw.incident_category ?? 'Other',
    summary: raw.summary ?? raw.description ?? '',
    date: raw.date ?? raw.created_at ?? new Date().toISOString(),
    status: raw.status ?? 'Community Report',
    identifier: raw.identifier ?? raw.recruiter_contact ?? raw.email_domain,
    relatedCount: raw.relatedCount ?? raw.related_count ?? 0,
    illustrative: Boolean(raw.illustrative),
  }
}

export const api = {
  async searchReports(query = '', page = 1, pageSize = 10): Promise<SearchResponse> {
    if (isDemo()) {
      const q = query.trim().toLowerCase()
      const items = demoReports.filter(r => !q || [r.companyName,r.title,r.category,r.summary,r.identifier].some(v => v?.toLowerCase().includes(q)))
      return { items, total: items.length, page, pageSize }
    }
    const params = new URLSearchParams({ query, page: String(page), page_size: String(pageSize) })
    const raw = await request<any>(`/reports?${params}`)
    const items = Array.isArray(raw) ? raw : (raw.items ?? raw.results ?? raw.data ?? [])
    return { items: items.map(normalizeReport), total: raw.total ?? items.length, page: raw.page ?? page, pageSize: raw.page_size ?? pageSize }
  },

  async getReport(id: string): Promise<Report> {
    if (isDemo() || id.startsWith('demo-')) {
      const report = demoReports.find(r => r.id === id)
      if (!report) throw new Error('Report not found.')
      return report
    }
    return normalizeReport(await request<any>(`/reports/${encodeURIComponent(id)}`))
  },

  async submitReport(input: SubmitReportInput): Promise<{ id?: string; message?: string }> {
    if (isDemo()) {
      await new Promise(resolve => setTimeout(resolve, 700))
      return { id: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, message: 'Demo submission only. No report was sent to a server.' }
    }
    const body = new FormData()
    body.append('company_name', input.companyName)
    body.append('recruiter_contact', input.recruiterContact)
    body.append('job_title', input.jobTitle)
    body.append('job_url', input.jobUrl)
    body.append('category', input.category)
    body.append('description', input.description)
    body.append('payment_requested', String(input.paymentRequested))
    input.evidence.forEach(file => body.append('evidence', file))
    // Do not set Content-Type: browser must add the multipart boundary.
    return request('/reports', { method:'POST', body })
  },
}

export const demoMode = isDemo()