export type ReportStatus =
  | 'Community Report'
  | 'Submitted'
  | 'Under Review'
  | 'Needs Information'
  | 'Approved'
  | 'Corroborated Reports'
  | 'Disputed'
  | 'Verified'
  | 'Rejected'

export type ReviewStatus = 'submitted' | 'under_review' | 'needs_information' | 'approved' | 'rejected'
export type ReviewDecision = 'needs_information' | 'approved' | 'rejected'
export type UploadStage = 'preparing' | 'uploading' | 'submitting'

export type Report = {
  id: string
  companyName: string
  title: string
  category: string
  summary: string
  date: string
  status: ReportStatus
  reviewStatus?: ReviewStatus
  isRedacted?: boolean
  identifier?: string
  submittedBy?: string
  relatedCount?: number
  illustrative?: boolean
  paymentRequested?: boolean
  jobTitle?: string
  jobUrl?: string
}

export type SearchResponse = {
  items: Report[]
  total: number
  page: number
  pageSize: number
  isSample?: boolean
}

export type SubmitReportInput = {
  submitterName: string
  submitterEmail: string
  isAnonymous: boolean
  companyName: string
  recruiterContact: string
  jobTitle: string
  jobUrl: string
  category: string
  description: string
  paymentRequested: boolean
  evidence: File[]
}

export type SubmissionStatus = {
  id: string
  companyName: string
  submittedBy: string
  status: ReportStatus
  reviewStatus: ReviewStatus
  reviewNote?: string
  submittedAt: string
  reviewedAt?: string
  isPublic: boolean
}

export type AdminEvidence = {
  id: string
  name: string
  contentType: string
  sizeBytes: number
}

export type AdminReport = Report & {
  reviewStatus: ReviewStatus
  reviewNote?: string
  reviewedAt?: string
  submitterName: string
  submitterEmail: string
  isAnonymous: boolean
  recruiterContact?: string
  description: string
  evidence: AdminEvidence[]
}

export type AdminLoginResponse = {
  accessToken: string
  expiresAt: number
}

type PresignedUpload = {
  uploadId: string
  uploadUrl: string
  method: string
  headers: Record<string,string>
  expiresAt?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const ADMIN_LOGIN_MOCK = import.meta.env.VITE_ADMIN_LOGIN_MOCK !== 'false'
const SAMPLE_REPORT_ENABLED = import.meta.env.VITE_SHOW_SAMPLE_REPORT !== 'false'

function sampleSearch(query: string, page: number, pageSize: number): SearchResponse {
  const normalizedQuery = query.trim().toLowerCase()
  const matches = !normalizedQuery || [
    sampleReport.companyName,
    sampleReport.title,
    sampleReport.category,
    sampleReport.summary,
    sampleReport.identifier,
  ].some(value=>value?.toLowerCase().includes(normalizedQuery))
    ? [sampleReport]
    : []
  const offset = (page - 1) * pageSize
  return {
    items:matches.slice(offset,offset + pageSize),
    total:matches.length,
    page,
    pageSize,
    isSample:true,
  }
}

async function errorMessage(response: Response): Promise<string> {
  const body = await response.text().catch(() => '')
  if (!body) return `API request failed (${response.status})`
  try {
    const parsed = JSON.parse(body)
    if (typeof parsed.detail === 'string') return parsed.detail
    if (Array.isArray(parsed.detail)) {
      return parsed.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(' ')
    }
  } catch {
    // The API returned plain text rather than JSON.
  }
  return body
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('API base URL is not configured.')
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) throw new Error(await errorMessage(response))
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function authHeaders(token: string, includeJson = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  }
}

function normalizeReport(raw: any): Report {
  const category = raw.category ?? raw.incident_category ?? 'Other'
  const reviewStatus = raw.reviewStatus ?? raw.review_status
  const isRedacted = Boolean(raw.isRedacted ?? raw.is_redacted ?? (reviewStatus && reviewStatus !== 'approved'))
  return {
    id: String(raw.id ?? raw.report_id),
    companyName: raw.companyName ?? raw.company_name ?? 'Unspecified organization',
    title: isRedacted ? `${category} community submission` : (raw.title ?? raw.incident_title ?? 'Recruitment report'),
    category,
    summary: isRedacted ? '' : (raw.summary ?? raw.description ?? ''),
    date: raw.date ?? raw.created_at ?? new Date().toISOString(),
    status: raw.status ?? 'Community Report',
    reviewStatus,
    isRedacted,
    identifier: isRedacted ? undefined : (raw.identifier ?? raw.recruiter_contact ?? raw.email_domain),
    submittedBy: raw.submittedBy ?? raw.submitted_by,
    relatedCount: raw.relatedCount ?? raw.related_count ?? 0,
    illustrative: Boolean(raw.illustrative),
    paymentRequested: raw.paymentRequested ?? raw.payment_requested,
    jobTitle: raw.jobTitle ?? raw.job_title,
    jobUrl: raw.jobUrl ?? raw.job_url,
  }
}

function normalizeSubmissionStatus(raw: any): SubmissionStatus {
  return {
    id: String(raw.id),
    companyName: raw.companyName ?? raw.company_name,
    submittedBy: raw.submittedBy ?? raw.submitted_by ?? 'Anonymous',
    status: raw.status ?? 'Under Review',
    reviewStatus: raw.reviewStatus ?? raw.review_status ?? 'submitted',
    reviewNote: raw.reviewNote ?? raw.review_note,
    submittedAt: raw.submittedAt ?? raw.submitted_at,
    reviewedAt: raw.reviewedAt ?? raw.reviewed_at,
    isPublic: Boolean(raw.isPublic ?? raw.is_public),
  }
}

function normalizeAdminReport(raw: any): AdminReport {
  return {
    ...normalizeReport(raw),
    isRedacted:false,
    reviewStatus: raw.reviewStatus ?? raw.review_status,
    reviewNote: raw.reviewNote ?? raw.review_note,
    reviewedAt: raw.reviewedAt ?? raw.reviewed_at,
    submitterName: raw.submitterName ?? raw.submitter_name,
    submitterEmail: raw.submitterEmail ?? raw.submitter_email,
    isAnonymous: Boolean(raw.isAnonymous ?? raw.is_anonymous),
    recruiterContact: raw.recruiterContact ?? raw.recruiter_contact,
    description: raw.description ?? raw.summary ?? '',
    evidence: (raw.evidence ?? []).map((item: any) => ({
      id: String(item.id),
      name: item.name ?? item.original_name,
      contentType: item.contentType ?? item.content_type ?? 'application/octet-stream',
      sizeBytes: item.sizeBytes ?? item.size_bytes ?? 0,
    })),
  }
}

export const api = {
  async searchReports(query = '', page = 1, pageSize = 10): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams({ query, page: String(page), page_size: String(pageSize) })
      const raw = await request<any>(`/reports?${params}`)
      const items = Array.isArray(raw) ? raw : (raw.items ?? raw.results ?? raw.data ?? [])
      return { items: items.map(normalizeReport), total: raw.total ?? items.length, page: raw.page ?? page, pageSize: raw.pageSize ?? raw.page_size ?? pageSize }
    } catch (error) {
      if (SAMPLE_REPORT_ENABLED) return sampleSearch(query,page,pageSize)
      throw error
    }
  },

  async getReport(id: string): Promise<Report> {
    if (SAMPLE_REPORT_ENABLED && id === sampleReport.id) return sampleReport
    return normalizeReport(await request<any>(`/reports/${encodeURIComponent(id)}`))
  },

  async getReportStatus(id: string): Promise<SubmissionStatus> {
    return normalizeSubmissionStatus(await request<any>(`/reports/${encodeURIComponent(id)}/status`))
  },

  async submitReport(input: SubmitReportInput, onStage?: (stage: UploadStage) => void): Promise<{ id?: string; message?: string; status?: ReportStatus }> {
    let evidenceUploadIds: string[] = []

    if (input.evidence.length) {
      onStage?.('preparing')
      const raw = await request<any>('/uploads/presign', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          files:input.evidence.map(file=>({
            filename:file.name,
            content_type:file.type || 'application/octet-stream',
            size_bytes:file.size,
          })),
        }),
      })
      const uploads: PresignedUpload[] = (raw.uploads ?? []).map((upload: any) => ({
        uploadId:String(upload.uploadId ?? upload.upload_id),
        uploadUrl:upload.uploadUrl ?? upload.upload_url,
        method:upload.method ?? 'PUT',
        headers:upload.headers ?? {},
        expiresAt:upload.expiresAt ?? upload.expires_at,
      }))
      if (uploads.length !== input.evidence.length || uploads.some(upload=>!upload.uploadId || !upload.uploadUrl)) {
        throw new Error('The upload service returned an incomplete presigned-upload response.')
      }

      onStage?.('uploading')
      await Promise.all(uploads.map(async (upload,index) => {
        const response = await fetch(upload.uploadUrl,{
          method:upload.method,
          headers:upload.headers,
          body:input.evidence[index],
        })
        if (!response.ok) throw new Error(`Unable to upload ${input.evidence[index].name}.`)
      }))
      evidenceUploadIds = uploads.map(upload=>upload.uploadId)
    }

    onStage?.('submitting')
    return request('/reports', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        contributor_username:input.submitterName.trim(),
        contributor_email:input.submitterEmail.trim(),
        anonymous_attribution:input.isAnonymous,
        company_name:input.companyName.trim(),
        recruiter_contact:input.recruiterContact.trim() || null,
        job_title:input.jobTitle.trim() || null,
        job_url:input.jobUrl.trim() || null,
        category:input.category,
        description:input.description.trim(),
        payment_requested:input.paymentRequested,
        evidence_upload_ids:evidenceUploadIds,
      }),
    })
  },

  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    if (ADMIN_LOGIN_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 250))
      return {
        accessToken: `mock-admin-${username || 'reviewer'}-${password.length}`,
        expiresAt: Math.floor(Date.now()/1000) + 8 * 60 * 60,
      }
    }
    const raw = await request<any>('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    return { accessToken: raw.access_token, expiresAt: raw.expires_at }
  },

  async getAdminReports(token: string, status?: ReviewStatus, query = ''): Promise<AdminReport[]> {
    const params = new URLSearchParams()
    if (status) params.set('status',status)
    if (query.trim()) params.set('query',query.trim())
    const encodedParams = params.toString()
    const suffix = encodedParams ? `?${encodedParams}` : ''
    const raw = await request<any>(`/admin/reports${suffix}`, { headers: authHeaders(token) })
    const items = Array.isArray(raw) ? raw : (raw.items ?? [])
    return items.map(normalizeAdminReport)
  },

  async reviewReport(token: string, id: string, status: ReviewDecision, reviewNote?: string): Promise<AdminReport> {
    const raw = await request<any>(`/admin/reports/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: authHeaders(token, true),
      body: JSON.stringify({ status, review_note: reviewNote?.trim() || null }),
    })
    return normalizeAdminReport(raw)
  },

  async downloadEvidence(token: string, evidence: AdminEvidence): Promise<void> {
    if (!API_BASE) throw new Error('API base URL is not configured.')
    const response = await fetch(`${API_BASE}/admin/evidence/${encodeURIComponent(evidence.id)}`, {
      headers: authHeaders(token),
    })
    if (!response.ok) throw new Error(await errorMessage(response))
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = evidence.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}

export const adminSession = {
  get(): string | null {
    try { return window.sessionStorage.getItem('offertrap-admin-token') } catch { return null }
  },
  set(token: string): void {
    try { window.sessionStorage.setItem('offertrap-admin-token', token) } catch { /* Storage can be disabled. */ }
  },
  clear(): void {
    try { window.sessionStorage.removeItem('offertrap-admin-token') } catch { /* Storage can be disabled. */ }
  },
}

export const adminLoginMockMode = ADMIN_LOGIN_MOCK
import { sampleReport } from '../data/sampleReport'

