# Business Engine

Multi-tenant, cloud-hosted meta-platform where businesses are treated strictly as configuration + data.

## Phase 1 Implementation

### Completed Components

1. **Database Schema** (`supabase/schema.sql`)
   - Multi-tenant isolation with RLS
   - Business profiles, content packs, approval workflows
   - Budget ledger and transaction tracking

2. **Core Business Logic** (`lib/core/`)
   - Budget enforcement and tracking
   - Approval workflow state machine
   - Content pack orchestration

3. **API Routes** (`app/api/`)
   - Content packs CRUD
   - Approval workflow operations
   - Budget checking
   - Google Docs export

4. **Dashboard UI** (`components/dashboard/`)
   - Business context switching
   - Content pack list and filtering
   - Content pack review and approval

5. **Export Adapter** (`lib/exporters/google-docs.ts`)
   - Google Docs export with approval and budget gates

## Setup

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Set up database:
   - Run `supabase/schema.sql` in your Supabase SQL editor
   - This creates all tables, RLS policies, triggers, and functions

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Architecture

See `docs/architecture.md` for detailed system design.

## Key Features

- **Multi-Tenant Isolation**: Organization-level data scoping with RLS
- **Approval Workflows**: State machine for content pack approval
- **Budget Enforcement**: Monthly caps with real-time tracking
- **Business Context Switching**: Seamless switching between business profiles
- **Export Adapters**: Pluggable export system with approval gates

## Phase 1 Scope

All Phase 1 deliverables are complete:
- ✅ Schema & core workflows
- ✅ API / backend logic
- ✅ Minimal UI for business context switching and content pack review/approval
- ✅ Google Docs export implementation

