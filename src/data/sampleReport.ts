import type { Report } from '../lib/api'

// Frontend-only preview record. Delete this file (and its import in lib/api.ts)
// or set VITE_SHOW_SAMPLE_REPORT=false when real API data is available.
export const sampleReport: Report = {
  id:'sample-preview-001',
  companyName:'Northstar Careers — illustrative sample',
  title:'Registration fee requested before interview confirmation',
  category:'Advance-fee recruitment',
  summary:'This illustrative report shows how an approved case appears. The candidate received a polished offer message, then was asked to pay a refundable registration fee before the interview could be scheduled.',
  date:'2026-11-14T08:30:00.000Z',
  status:'Approved',
  reviewStatus:'approved',
  isRedacted:false,
  identifier:'recruiter@example.invalid',
  submittedBy:'Anonymous',
  relatedCount:2,
  illustrative:true,
  paymentRequested:true,
  jobTitle:'Junior Software Developer',
  jobUrl:'https://example.invalid/jobs/sample-role',
}
