# Business Engine

Multi-tenant, cloud-hosted meta-platform where businesses are treated strictly as configuration + data.

## Features

### Core Functionality
- **Multi-Tenant Isolation**: Organization-level data scoping with Row Level Security (RLS)
- **Business Context Switching**: Seamless switching between multiple business profiles
- **Content Pack Management**: Create, edit, and manage content packs with approval workflows
- **Approval Workflows**: State machine for content pack approval (simple and custom multi-step)
- **Budget Enforcement**: Monthly caps with real-time tracking and forecasting
- **Export System**: Multiple export formats with approval gates

### AI Integration
- **AI-Powered Content Generation**: Generate content packs using OpenAI or Anthropic
- **Provider Adapters**: Pluggable AI provider system with budget tracking
- **Automatic Cost Calculation**: Real-time token usage and cost tracking

### Analytics & Reporting
- **Content Pack Analytics**: Statistics by status, type, approval rates
- **Budget Analytics**: Current spend, projections, spending trends
- **Time-to-Approval Metrics**: Track approval efficiency

### Export Formats
- **Google Docs**: Direct export to Google Docs
- **PDF**: PDF export (placeholder implementation)
- **Markdown**: Markdown format export
- **JSON**: Structured data export

## Phase 1 & 2 Implementation

### Completed Components

1. **Database Schema** (`supabase/schema.sql`)
   - Multi-tenant isolation with RLS
   - Business profiles, content packs, approval workflows
   - Budget ledger and transaction tracking
   - Custom approval workflow templates

2. **Core Business Logic** (`lib/core/`)
   - Budget enforcement and tracking
   - Approval workflow state machine (simple and custom)
   - Content pack orchestration
   - AI-powered content generation
   - Analytics and forecasting

3. **API Routes** (`app/api/`)
   - Content packs CRUD and AI generation
   - Approval workflow operations (simple and custom)
   - Budget checking, management, and forecasting
   - Multiple export formats
   - Analytics endpoints

4. **Dashboard UI** (`components/dashboard/`)
   - Business context switching
   - Content pack list and filtering
   - Content pack review and approval
   - AI content generation interface
   - Budget management
   - Analytics dashboard

5. **AI Provider Adapters** (`lib/adapters/ai/`)
   - OpenAI adapter with budget tracking
   - Anthropic adapter with budget tracking
   - Base adapter with approval and budget gates

6. **Export Adapters** (`lib/exporters/`)
   - Google Docs export
   - PDF export
   - Markdown export
   - JSON export

## Setup

### Prerequisites

- Node.js 18+
- Supabase account and project
- (Optional) OpenAI or Anthropic API keys for AI features

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For AI features
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. **Set up database:**
   - Run `supabase/schema.sql` in your Supabase SQL editor
   - Run `supabase/migrations/001_custom_approval_workflows.sql` for custom workflows
   - This creates all tables, RLS policies, triggers, and functions

4. **Run development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Configuration

### AI Provider Setup

To enable AI content generation, configure AI providers in your business profile's `config` field:

```json
{
  "ai_providers": {
    "openai": {
      "enabled": true,
      "apiKey": "your-key",
      "model": "gpt-3.5-turbo"
    },
    "anthropic": {
      "enabled": true,
      "apiKey": "your-key",
      "model": "claude-3-haiku"
    }
  }
}
```

### Custom Approval Workflows

Create approval workflow templates via the database or API:

```sql
INSERT INTO approval_workflow_templates (organization_id, name, steps)
VALUES (
  'org-id',
  'Two-Step Approval',
  '[
    {
      "stepIndex": 0,
      "stepName": "Manager Review",
      "approverIds": ["user-id-1"],
      "requireAll": false
    },
    {
      "stepIndex": 1,
      "stepName": "Director Approval",
      "approverIds": ["user-id-2"],
      "requireAll": false
    }
  ]'::jsonb
);
```

## Architecture

See `docs/architecture.md` for detailed system design.

## Key Features

- **Multi-Tenant Isolation**: Organization-level data scoping with RLS
- **Approval Workflows**: Simple state machine and custom multi-step workflows
- **Budget Enforcement**: Monthly caps with real-time tracking and forecasting
- **Business Context Switching**: Seamless switching between business profiles
- **AI Integration**: OpenAI and Anthropic adapters with budget tracking
- **Export Adapters**: Pluggable export system with approval gates
- **Analytics**: Comprehensive reporting and forecasting

## API Documentation

### Content Packs
- `GET /api/content-packs` - List content packs
- `POST /api/content-packs` - Create content pack
- `POST /api/content-packs/generate` - Generate with AI
- `PATCH /api/content-packs` - Update content pack
- `DELETE /api/content-packs` - Delete content pack

### Approval
- `POST /api/approval` - Submit/approve/reject (simple workflow)
- `POST /api/approval/workflow` - Custom workflow operations
- `GET /api/approval/workflow` - Get workflow step approvals

### Budget
- `GET /api/budget` - Get budget ledger
- `PATCH /api/budget` - Update monthly cap
- `GET /api/budget/forecast` - Get budget forecast

### Export
- `POST /api/export` - Export content pack (format: google-docs, pdf, markdown, json)

### Analytics
- `GET /api/analytics` - Get business profile analytics

## Development

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   └── dashboard/         # Dashboard components
├── lib/
│   ├── adapters/          # External service adapters
│   │   └── ai/            # AI provider adapters
│   ├── core/              # Core business logic
│   ├── exporters/         # Export adapters
│   └── supabase/          # Supabase clients
├── supabase/
│   ├── schema.sql         # Main database schema
│   └── migrations/        # Database migrations
└── docs/                  # Documentation
```

## License

Private - All rights reserved
