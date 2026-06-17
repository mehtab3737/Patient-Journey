# Patient Journey — AI Patient Records Assistant

A doctor-facing AI chat application for querying, analyzing, and updating patient
medical records using natural language. A doctor searches for a patient by ID or
name, the full record is loaded as context for an LLM, and the doctor can then
ask clinical follow-up questions or issue natural-language commands to update the
record — all while the conversation keeps context across turns.

> ⚕️ **Disclaimer:** This is a demonstration/educational project. It is not a
> certified medical device and must not be used for real clinical
> decision-making. The dataset shipped with the repo is synthetic.

## What this project does

- **Patient lookup** — search 1,000+ synthetic patient records (stored in
  Supabase/PostgreSQL) by Patient ID or partial name.
- **Context-aware AI chat** — the selected patient's full record is injected into
  the system prompt so the assistant answers questions specific to that patient
  (history, conditions, treatments, billing).
- **Natural-language record updates** — the doctor can say e.g. *"add hypertension
  to this patient's conditions"*; the assistant detects the update intent and
  shows a confirmation modal before the change is written back to the database.
- **Persistent, resumable chat** — conversations are saved per doctor account.
- **Authentication** — Supabase email/password auth; all `/chat` routes are
  protected.

## Tech stack

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | Next.js (App Router), React 19              |
| Backend API  | Next.js Route Handlers                      |
| Database     | Supabase (PostgreSQL) with Row Level Security |
| Auth         | Supabase Auth (email/password)              |
| AI / LLM     | OpenAI (`openai` SDK, streaming)            |
| CSV import   | Node.js seed script (`papaparse`)           |
| Styling      | CSS variables (dark clinical theme)         |

## Repository layout

```
Patient-Journey/
├── Implementation Plan                 # Detailed design doc / build plan
├── hospital_records_*.csv              # Synthetic source data for seeding
├── supabase/schema.sql                 # Database schema + RLS policies
├── scripts/seed.mjs                    # CSV → Supabase bulk insert
└── patient-journey-app/                # The Next.js application
    ├── app/                            # Pages + API routes
    │   ├── api/chat/route.ts           # Streaming chat endpoint
    │   ├── api/patient/[id]/route.ts   # Fetch / update a patient
    │   └── api/patient/search/route.ts # Search patients
    ├── components/                     # ChatWindow, PatientCard, etc.
    └── lib/                            # Supabase + OpenAI clients, types
```

## Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Set up the database
In the Supabase dashboard → SQL Editor, run the contents of
[`supabase/schema.sql`](supabase/schema.sql) to create the `patients` table and
its Row Level Security policies.

### 2. Configure environment variables
Create `patient-journey-app/.env.local` (this file is gitignored — never commit
real keys):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key   # server only
OPENAI_API_KEY=your-openai-api-key
```

### 3. Install and seed
```bash
cd patient-journey-app
npm install

# Seed the synthetic patient records into Supabase
node ../scripts/seed.mjs   # or: node seed.mjs
```

### 4. Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000), sign up as a doctor, and
start a session.

## How it works

1. **Lookup** — `GET /api/patient/search?q=...` resolves a Patient ID or name to
   a record, displayed in the sidebar `PatientCard`.
2. **Chat** — `POST /api/chat` builds a system prompt containing the patient
   record plus the full conversation history, then streams the model's reply.
3. **Update** — when the assistant proposes a record change, the UI shows an
   `UpdateConfirmModal`; on confirm, `PATCH /api/patient/[id]` writes the change
   and stamps `updated_at` / `updated_by`.

See the [`Implementation Plan`](Implementation%20Plan) for the full design,
API contracts, and system-prompt details.

## Deployment

Deploys cleanly to **Vercel** — import the `patient-journey-app` directory and add
the same environment variables in the Vercel dashboard.
