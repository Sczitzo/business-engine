# Business Engine Architecture

## System Overview

The Business Engine is a multi-tenant, cloud-hosted meta-platform where businesses are treated strictly as configuration + data. All business logic is data-driven, with zero hard-coded business ideas, niches, or examples.

## Core Principles

1. **Data-Driven Design**: Businesses = configuration + data, never hard-coded logic
2. **Multi-Tenancy**: Complete isolation at the organization level
3. **Approval Gates**: All content and spend requires explicit approval
4. **Budget Enforcement**: Configurable monthly caps with real-time tracking
5. **Context Switching**: Users can seamlessly switch between business contexts

## System Architecture

### Data Flow

```
User Action
  ↓
API Layer (Next.js App Router)
  ↓
Core Business Logic (lib/core/)
  ↓
Budget Check (lib/core/budget.ts)
  ↓
Approval Gate (lib/core/approval.ts)
  ↓
Content Pack Orchestration (lib/core/content-pack.ts)
  ↓
Database (Supabase PostgreSQL)
  ↓
Export Adapters (lib/exporters/)
```

### Multi-Tenant Isolation

- **Organization-level isolation**: All data is scoped to `organizations.id`
- **Row Level Security (RLS)**: PostgreSQL policies enforce tenant boundaries
- **User-Organization mapping**: Users belong to one or more organizations via `organization_members`
- **Business context switching**: Users select active `business_profile_id` per session

### Data Model Layers

1. **Tenant Layer**: `organizations`, `users`, `organization_members`
2. **Business Layer**: `business_profiles` (configurable business definitions)
3. **Content Layer**: `content_packs` (draft outputs with approval state)
4. **Workflow Layer**: `approval_workflows` (state machine for approvals)
5. **Budget Layer**: `budget_ledger` (spend tracking and caps)

## Adapter Boundaries

### Export Adapters (`lib/exporters/`)

- **Google Docs Exporter**: `lib/exporters/google-docs.ts`
- **Adapter Pattern**: All external integrations isolated behind adapters
- **Budget Integration**: Each adapter checks budget before execution
- **Approval Requirement**: Exports require approved content packs

### AI Provider Adapters (Future)

- **Isolation**: All AI calls go through adapters in `lib/adapters/ai/`
- **Budget Tracking**: Each API call logged to `budget_ledger`
- **Default Disabled**: No paid integrations enabled without approval

## Approval and Budget Enforcement Model

### Approval Workflow State Machine

```
draft → pending_approval → approved | rejected
```

**States:**
- `draft`: Content pack created, not yet submitted
- `pending_approval`: Submitted for review
- `approved`: Approved for use/export
- `rejected`: Rejected, can be revised and resubmitted

### Budget Enforcement

**Monthly Budget Caps:**
- Defined per `business_profile` in `budget_ledger.monthly_cap`
- Tracked per month in `budget_ledger.actual_spend`
- Enforced at API layer before any paid operation

**Budget Check Flow:**
1. User action triggers paid operation
2. System checks `budget_ledger` for current month spend
3. If `actual_spend + operation_cost > monthly_cap`: Block operation
4. If within cap: Proceed, log to `budget_ledger`

**Approval Gates:**
- Content pack export: Requires `approved` status
- Paid API calls: Requires budget approval (if enabled)
- Budget cap changes: Requires organization admin approval

## Business Context Switching

### Session Context

- User selects active `business_profile_id` per session
- All operations scoped to active business profile
- Context stored in session/cookie, not database
- UI displays current business context clearly

### Data Scoping

- All queries filtered by `business_profile_id`
- RLS policies enforce organization membership
- Content packs belong to specific business profiles
- Budget tracking per business profile

## Security Model

### Row Level Security (RLS)

**Policies:**
- Users can only access data from their organizations
- Organization admins can manage all business profiles in their org
- Business profile owners can manage their own content packs
- Approval workflows visible to approvers within organization

### Authentication

- Supabase Auth handles user authentication
- JWT tokens contain `organization_id` and `user_id`
- API routes verify organization membership

## Phase 1 Scope

### Implemented

1. **Schema**: Complete PostgreSQL schema with RLS
2. **Core Logic**: Content pack orchestration, approval gating, budget checks
3. **Minimal UI**: Business context switching, content pack review/approval
4. **Google Docs Export**: Basic export implementation

### Not Implemented (Phase 2+)

- Advanced AI integrations
- Multiple export formats
- Advanced analytics
- Custom approval workflows
- Budget forecasting

## Technical Stack

- **Framework**: Next.js 14+ (App Router)
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Background Jobs**: In-repo jobs or Supabase Edge Functions
- **Language**: TypeScript (end-to-end)
- **Integrations**: Adapter pattern for all external APIs

