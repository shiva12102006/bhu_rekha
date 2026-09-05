# Bhu-Rekha Frontend (Next.js 14 App Router)

## Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit:
- http://localhost:3000/dashboard — Patwari executive dashboard
- http://localhost:3000/dashboard/verify/1 — verification panel (record id 1)
- http://localhost:3000/bhulekh — citizen public search portal

Ensure the FastAPI backend is running at the URL set in `NEXT_PUBLIC_API_URL`.
