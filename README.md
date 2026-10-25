# OfferTrap — Cinematic Letterfall React starter

A React + TypeScript frontend starter for a recruitment-scam awareness platform. Includes the cinematic landing page, animated paper composition, search/report archive, report detail route, report submission form, and an API adapter you can map to your existing backend.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Create a production build with `npm run build`.

## Connect your FastAPI backend
Edit `src/lib/api.ts`. The current adapter uses these example endpoints:
- `GET /reports?query=&page=&page_size=` — report search/list
- `GET /reports/:id` — report details
- `POST /reports` — multipart form submission, including optional `evidence` files

These are illustrative contracts, not assumptions about your existing API. Change the paths, query names, field names, response normalization, and auth headers in `api.ts` to match your backend. Keep `VITE_API_BASE_URL` pointed at your API prefix (e.g. `http://localhost:8000/api`).

The adapter sends `FormData` for report submission. Do not manually set the multipart `Content-Type` header; the browser supplies the boundary. If your backend uses a presigned S3 upload flow, replace the file part of `submitReport` with your presign → direct upload → metadata submission sequence.

If your API uses bearer authentication, add the token retrieval/header logic inside `request()` in `src/lib/api.ts`; do not hardcode secrets in frontend environment variables. Anything prefixed `VITE_` is exposed to the browser.

## Demo mode
`VITE_DEMO_MODE=true` enables clearly labelled sample reports when API calls fail or when the API base URL is empty. Set it to `false` to avoid fallback data. Demo data is illustrative and must not be presented as verified allegations.

## Security checklist before launch
- Validate uploaded content and size on the server, not only in the browser.
- Store evidence privately and issue short-lived signed URLs only when appropriate.
- Redact personal data before public display.
- Moderate reports before publication and provide correction/dispute paths.
- Configure CORS on FastAPI for the frontend origin.
- Do not expose API keys or secrets in frontend code.
- Treat community reports as allegations, not proof of fraud.

## Main structure
- `src/components/LetterfallHero.tsx` — cinematic hero and motion.
- `src/pages/HomePage.tsx` — landing sections and archive.
- `src/pages/ReportsPage.tsx` — searchable archive.
- `src/pages/ReportDetailPage.tsx` — individual report.
- `src/pages/SubmitReportPage.tsx` — evidence submission.
- `src/lib/api.ts` — backend adapter and types.
- `src/styles.css` — visual system and responsive behavior.

The hero uses layered CSS paper objects and Framer Motion rather than a pre-rendered flat mockup. Replace the abstract job-seeker figure in `LetterfallHero.tsx` with your own licensed/commissioned image or layered character assets for a more photorealistic final treatment.