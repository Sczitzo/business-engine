-- Business Engine Database Schema
-- Multi-tenant, data-driven business platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TENANT LAYER: Organizations and Users
-- ============================================================================

-- Organizations (top-level tenant isolation)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Supabase Auth handles authentication, this table stores profile data)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members (many-to-many: users ↔ organizations)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- BUSINESS LAYER: Business Profiles (configurable business definitions)
-- ============================================================================

-- Business profiles (configurable: market, platforms, risk level, compliance flags)
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    market TEXT, -- e.g., "B2B SaaS", "E-commerce", "Content Creator"
    platforms TEXT[], -- e.g., ["YouTube", "TikTok", "Instagram"]
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    compliance_flags TEXT[], -- e.g., ["GDPR", "COPPA", "HIPAA"]
    config JSONB DEFAULT '{}'::jsonb, -- Flexible configuration storage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONTENT LAYER: Content Packs (draft outputs with approval state)
-- ============================================================================

-- Content packs (draft outputs: scripts, hooks, metadata, status)
CREATE TABLE content_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('script', 'hook', 'post', 'video', 'other')),
    content_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible content storage
    metadata JSONB DEFAULT '{}'::jsonb, -- Tags, categories, etc.
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- WORKFLOW LAYER: Approval Workflows (state machine for approvals)
-- ============================================================================

-- Approval workflows (state machine: draft → pending → approved)
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_pack_id UUID NOT NULL REFERENCES content_packs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    current_state TEXT NOT NULL DEFAULT 'draft' CHECK (current_state IN ('draft', 'pending_approval', 'approved', 'rejected')),
    previous_state TEXT,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================================================================
-- BUDGET LAYER: Budget Ledger (monthly caps, actual spend, approval gates)
-- ============================================================================

-- Budget ledger (monthly caps, actual spend, approval gates)
CREATE TABLE budget_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of the month (YYYY-MM-01)
    monthly_cap DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_cap >= 0),
    actual_spend DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (actual_spend >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    is_approved BOOLEAN DEFAULT false, -- Budget cap changes require approval
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_profile_id, month)
);

-- Budget transactions (detailed spend tracking)
CREATE TABLE budget_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_ledger_id UUID NOT NULL REFERENCES budget_ledger(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT, -- e.g., "ai_api_call", "export", "integration"
    provider TEXT, -- e.g., "openai", "anthropic", "google_docs"
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES: Performance optimization
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Organization members
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- Business profiles
CREATE INDEX idx_business_profiles_org_id ON business_profiles(organization_id);
CREATE INDEX idx_business_profiles_active ON business_profiles(is_active) WHERE is_active = true;

-- Content packs
CREATE INDEX idx_content_packs_business_profile_id ON content_packs(business_profile_id);
CREATE INDEX idx_content_packs_created_by ON content_packs(created_by);
CREATE INDEX idx_content_packs_status ON content_packs(status);
CREATE INDEX idx_content_packs_business_status ON content_packs(business_profile_id, status);

-- Approval workflows
CREATE INDEX idx_approval_workflows_content_pack_id ON approval_workflows(content_pack_id);
CREATE INDEX idx_approval_workflows_org_id ON approval_workflows(organization_id);
CREATE INDEX idx_approval_workflows_state ON approval_workflows(current_state);

-- Budget ledger
CREATE INDEX idx_budget_ledger_business_profile_id ON budget_ledger(business_profile_id);
CREATE INDEX idx_budget_ledger_org_id ON budget_ledger(organization_id);
CREATE INDEX idx_budget_ledger_month ON budget_ledger(month);
CREATE INDEX idx_budget_ledger_business_month ON budget_ledger(business_profile_id, month);

-- Budget transactions
CREATE INDEX idx_budget_transactions_ledger_id ON budget_transactions(budget_ledger_id);
CREATE INDEX idx_budget_transactions_created_at ON budget_transactions(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS): Multi-tenant isolation
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
    SELECT organization_id
    FROM organization_members
    WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: Check if user is organization admin
CREATE OR REPLACE FUNCTION is_org_admin(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM organization_members
        WHERE user_id = user_uuid
          AND organization_id = org_uuid
          AND role IN ('admin', 'owner')
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: Users can only see organizations they belong to
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (SELECT get_user_organization_ids(auth.uid()))
    );

-- Organization creation requires service role (no RLS policy)
-- This ensures only application-level logic with elevated privileges can create organizations

CREATE POLICY "Admins can update their organizations"
    ON organizations FOR UPDATE
    USING (
        id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), id)
    );

-- Users: Users can view their own profile and profiles of users in their orgs
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organizations"
    ON users FOR SELECT
    USING (
        id IN (
            SELECT user_id
            FROM organization_members
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Organization members: Users can view members of their organizations
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Admins can manage organization members"
    ON organization_members FOR ALL
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), organization_id)
    );

-- Business profiles: Users can view business profiles in their organizations
CREATE POLICY "Users can view business profiles in their organizations"
    ON business_profiles FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Users can create business profiles in their organizations"
    ON business_profiles FOR INSERT
    WITH CHECK (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Admins can update business profiles in their organizations"
    ON business_profiles FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Admins can delete business profiles"
    ON business_profiles FOR DELETE
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), organization_id)
    );

-- Content packs: Users can view content packs for business profiles in their orgs
CREATE POLICY "Users can view content packs in their organizations"
    ON content_packs FOR SELECT
    USING (
        business_profile_id IN (
            SELECT id
            FROM business_profiles
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can create content packs"
    ON content_packs FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND business_profile_id IN (
            SELECT id
            FROM business_profiles
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can update their own content packs"
    ON content_packs FOR UPDATE
    USING (
        created_by = auth.uid()
        AND business_profile_id IN (
            SELECT id
            FROM business_profiles
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        )
    );

CREATE POLICY "Admins can update any content pack in their organizations"
    ON content_packs FOR UPDATE
    USING (
        business_profile_id IN (
            SELECT id
            FROM business_profiles
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
            AND is_org_admin(auth.uid(), organization_id)
        )
    );

-- Approval workflows: Users can view workflows in their organizations
CREATE POLICY "Users can view approval workflows in their organizations"
    ON approval_workflows FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Users can create approval workflows"
    ON approval_workflows FOR INSERT
    WITH CHECK (
        requested_by = auth.uid()
        AND organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Admins can update approval workflows"
    ON approval_workflows FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), organization_id)
    );

-- Budget ledger: Users can view budgets for business profiles in their orgs
CREATE POLICY "Users can view budget ledger in their organizations"
    ON budget_ledger FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
    );

CREATE POLICY "Admins can manage budget ledger"
    ON budget_ledger FOR ALL
    USING (
        organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        AND is_org_admin(auth.uid(), organization_id)
    );

-- Budget transactions: Users can view transactions in their organizations
CREATE POLICY "Users can view budget transactions in their organizations"
    ON budget_transactions FOR SELECT
    USING (
        budget_ledger_id IN (
            SELECT id
            FROM budget_ledger
            WHERE organization_id IN (SELECT get_user_organization_ids(auth.uid()))
        )
    );

-- Budget transactions can only be created by service role (no RLS policy)
-- This ensures only system-level logic with elevated privileges can create budget transactions
-- Application code must use service role client for budget transaction inserts

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_packs_updated_at
    BEFORE UPDATE ON content_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_ledger_updated_at
    BEFORE UPDATE ON budget_ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS: Approval workflow state synchronization
-- ============================================================================

-- Function to sync content pack status with approval workflow
CREATE OR REPLACE FUNCTION sync_content_pack_approval_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content_pack status when approval_workflow state changes
    IF NEW.current_state != OLD.current_state THEN
        UPDATE content_packs
        SET 
            status = NEW.current_state,
            -- Only set approved_at and approved_by when transitioning TO approved state
            -- Never clear these fields to preserve audit trail
            approved_at = CASE 
                WHEN NEW.current_state = 'approved' AND OLD.current_state != 'approved' 
                THEN NOW() 
                ELSE approved_at 
            END,
            approved_by = CASE 
                WHEN NEW.current_state = 'approved' AND OLD.current_state != 'approved' 
                THEN NEW.reviewed_by 
                ELSE approved_by 
            END
        WHERE id = NEW.content_pack_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_approval_status
    AFTER UPDATE ON approval_workflows
    FOR EACH ROW
    WHEN (NEW.current_state IS DISTINCT FROM OLD.current_state)
    EXECUTE FUNCTION sync_content_pack_approval_status();

-- ============================================================================
-- TRIGGERS: Budget transaction spend tracking
-- ============================================================================

-- Function to update budget ledger actual_spend when transaction is created
CREATE OR REPLACE FUNCTION update_budget_spend()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE budget_ledger
    SET actual_spend = actual_spend + NEW.amount
    WHERE id = NEW.budget_ledger_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_on_transaction
    AFTER INSERT ON budget_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spend();

