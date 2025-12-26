-- Migration: Add custom approval workflow support
-- Allows organizations to define multi-step approval processes

-- Approval workflow templates (defines the workflow structure)
CREATE TABLE approval_workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- Array of approval steps with approver requirements
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow step approvals (tracks individual step approvals in multi-step workflows)
CREATE TABLE workflow_step_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL, -- Which step in the workflow (0-indexed)
    step_name TEXT NOT NULL,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(approval_workflow_id, step_index, approver_id)
);

-- Add workflow_template_id to approval_workflows
ALTER TABLE approval_workflows
ADD COLUMN workflow_template_id UUID REFERENCES approval_workflow_templates(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_approval_workflow_templates_org_id ON approval_workflow_templates(organization_id);
CREATE INDEX idx_approval_workflow_templates_active ON approval_workflow_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_workflow_step_approvals_workflow_id ON workflow_step_approvals(approval_workflow_id);
CREATE INDEX idx_workflow_step_approvals_approver_id ON workflow_step_approvals(approver_id);
CREATE INDEX idx_workflow_step_approvals_status ON workflow_step_approvals(status);

-- RLS Policies
ALTER TABLE approval_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_approvals ENABLE ROW LEVEL SECURITY;

-- Approval workflow templates: Users can view templates in their organizations
CREATE POLICY "Users can view workflow templates in their organizations"
    ON approval_workflow_templates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Admins can manage workflow templates
CREATE POLICY "Admins can manage workflow templates"
    ON approval_workflow_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- Workflow step approvals: Users can view their own approvals
CREATE POLICY "Users can view their workflow step approvals"
    ON workflow_step_approvals FOR SELECT
    USING (
        approver_id = auth.uid()
        OR approval_workflow_id IN (
            SELECT id
            FROM approval_workflows
            WHERE organization_id IN (
                SELECT organization_id
                FROM organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update their own pending approvals
CREATE POLICY "Users can update their pending approvals"
    ON workflow_step_approvals FOR UPDATE
    USING (
        approver_id = auth.uid()
        AND status = 'pending'
    );

-- Trigger to update updated_at
CREATE TRIGGER update_approval_workflow_templates_updated_at
    BEFORE UPDATE ON approval_workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

