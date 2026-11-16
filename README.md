# OfferTrap — Cinematic Letterfall React starter

A React + TypeScript frontend starter for a recruitment-scam awareness platform. Includes the cinematic landing page, animated paper composition, search/report archive, report detail route, report submission form, and an API adapter you can map to your existing backend.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Create a production build with `npm run build`.

## Connect your FastAPI backend
Copy `.env.example` to `.env` and keep `VITE_API_BASE_URL` pointed at the API v1 prefix, for example `http://localhost:8000/api/v1`.

If your API uses bearer authentication, add the token retrieval/header logic inside `request()` in `src/lib/api.ts`; do not hardcode secrets in frontend environment variables. Anything prefixed `VITE_` is exposed to the browser.

## Temporary admin login
`VITE_ADMIN_LOGIN_MOCK=true` allows any username with at least 3 characters and password with at least 6 characters while backend authentication is being built. It mocks login only; the dashboard list, evidence downloads, and moderation actions always call the configured backend API.

## Illustrative report preview
`VITE_SHOW_SAMPLE_REPORT=true` shows one clearly labelled illustrative report only when the reports API is unavailable. The sample is stored in `src/data/sampleReport.ts`. Set the flag to `false`, or delete that file and its import in `src/lib/api.ts`, after real report data is connected.

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
