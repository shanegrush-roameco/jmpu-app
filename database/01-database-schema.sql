-- ============================================================================
-- JMPU App - Sprint 8: Database Schema
-- Construction Project Management System
-- ============================================================================
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- Execute each section in order
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUM TYPES
-- ============================================================================

-- Project status options
CREATE TYPE project_status AS ENUM (
  'planning',
  'in_progress', 
  'on_hold',
  'completed',
  'cancelled'
);

-- Project type categories (aligned with Junk Monkey Pickup services)
CREATE TYPE project_type AS ENUM (
  'renovation',
  'insurance_repair',
  'fire_rehabilitation',
  'water_damage',
  'mold_remediation',
  'general_construction',
  'demolition',
  'other'
);

-- Task status options
CREATE TYPE task_status AS ENUM (
  'not_started',
  'in_progress',
  'blocked',
  'completed',
  'cancelled'
);

-- Task priority levels
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- User role in the system
CREATE TYPE user_role AS ENUM (
  'admin',
  'project_manager',
  'contractor',
  'client',
  'viewer'
);

-- Profile status
CREATE TYPE profile_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- Contractor status for project assignments
CREATE TYPE contractor_status AS ENUM (
  'pending',
  'approved',
  'active',
  'completed',
  'terminated'
);

-- Permit status
CREATE TYPE permit_status AS ENUM (
  'not_applied',
  'pending',
  'approved',
  'denied',
  'expired'
);

-- Draw request status (for Freddie Mac financial tracking)
CREATE TYPE draw_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid'
);

-- ============================================================================
-- SECTION 3: CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles table (extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  ) STORED,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  role user_role DEFAULT 'viewer',
  status profile_status DEFAULT 'active',
  
  -- Company association
  company_id UUID,
  
  -- Notification preferences (JSON for flexibility)
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "project_updates": true,
    "task_assignments": true,
    "draw_approvals": true,
    "permit_updates": true,
    "weekly_digest": true
  }'::jsonb,
  
  -- Metadata
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Companies table
-- ----------------------------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  
  -- Contact info
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  
  -- Business details
  license_number TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  
  -- Branding
  logo_url TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key after companies table exists
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_company 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- Projects table (core entity)
-- ----------------------------------------------------------------------------
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  project_number TEXT UNIQUE, -- Auto-generated: JMPU-2024-001
  
  -- Classification
  project_type project_type DEFAULT 'general_construction',
  status project_status DEFAULT 'planning',
  
  -- Property address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Timeline
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  
  -- Financial (for Freddie Mac reporting)
  budget_total DECIMAL(12, 2) DEFAULT 0,
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  budget_remaining DECIMAL(12, 2) GENERATED ALWAYS AS (budget_total - budget_spent) STORED,
  
  -- Insurance/claim info (for insurance repair projects)
  claim_number TEXT,
  insurance_company TEXT,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  
  -- Relationships
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for project_number generation
CREATE INDEX idx_projects_number ON projects(project_number);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_company ON projects(company_id);

-- ----------------------------------------------------------------------------
-- Tasks table
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status and priority
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  
  -- Timeline
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Subtask support (self-referencing)
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Ordering within project
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- ----------------------------------------------------------------------------
-- Project Contractors (junction table)
-- ----------------------------------------------------------------------------
CREATE TABLE project_contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role on this project
  role TEXT, -- e.g., "Plumber", "Electrician", "General"
  status contractor_status DEFAULT 'pending',
  
  -- Contract details
  hourly_rate DECIMAL(10, 2),
  flat_rate DECIMAL(12, 2),
  start_date DATE,
  end_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, contractor_id)
);

CREATE INDEX idx_project_contractors_project ON project_contractors(project_id);
CREATE INDEX idx_project_contractors_contractor ON project_contractors(contractor_id);

-- ----------------------------------------------------------------------------
-- Project Contacts (clients, inspectors, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE project_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  role TEXT, -- e.g., "Property Owner", "Inspector", "HOA Contact"
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Notes
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_contacts_project ON project_contacts(project_id);

-- ----------------------------------------------------------------------------
-- Permits table
-- ----------------------------------------------------------------------------
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Permit details
  permit_type TEXT NOT NULL, -- e.g., "Building", "Electrical", "Plumbing"
  permit_number TEXT,
  status permit_status DEFAULT 'not_applied',
  
  -- Dates
  application_date DATE,
  approval_date DATE,
  expiration_date DATE,
  
  -- Issuing authority
  issuing_authority TEXT,
  inspector_name TEXT,
  inspector_phone TEXT,
  
  -- Costs
  fee_amount DECIMAL(10, 2),
  
  -- Documents
  document_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permits_project ON permits(project_id);
CREATE INDEX idx_permits_status ON permits(status);

-- ----------------------------------------------------------------------------
-- Draw Requests (Financial - critical for Freddie Mac)
-- ----------------------------------------------------------------------------
CREATE TABLE draw_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Draw details
  draw_number INTEGER NOT NULL, -- Sequential per project
  title TEXT NOT NULL,
  description TEXT,
  
  -- Amount
  amount_requested DECIMAL(12, 2) NOT NULL,
  amount_approved DECIMAL(12, 2),
  
  -- Status
  status draw_status DEFAULT 'draft',
  
  -- Dates
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Reviewer/Approver
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Supporting documents
  documentation_url TEXT,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, draw_number)
);

CREATE INDEX idx_draw_requests_project ON draw_requests(project_id);
CREATE INDEX idx_draw_requests_status ON draw_requests(status);

-- ----------------------------------------------------------------------------
-- Messages (Project communication)
-- ----------------------------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Sender
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Reply support
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Read tracking (JSON array of user IDs who have read)
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ----------------------------------------------------------------------------
-- Files (Project documents)
-- ----------------------------------------------------------------------------
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- File info
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_type TEXT, -- MIME type
  file_size INTEGER, -- bytes
  
  -- Organization
  folder TEXT DEFAULT 'general', -- e.g., "permits", "photos", "contracts"
  
  -- Metadata
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_folder ON files(folder);

-- ----------------------------------------------------------------------------
-- Notes (Project notes - separate from messages)
-- ----------------------------------------------------------------------------
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Note content
  title TEXT,
  content TEXT NOT NULL,
  
  -- Visibility
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes not visible to clients
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_project ON notes(project_id);

-- ============================================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Auto-generate project numbers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(project_number, '^JMPU-' || year_part || '-', ''), '')::INTEGER
  ), 0) + 1
  INTO seq_num
  FROM projects
  WHERE project_number LIKE 'JMPU-' || year_part || '-%';
  
  new_number := 'JMPU-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
  NEW.project_number := new_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_project_number
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.project_number IS NULL)
  EXECUTE FUNCTION generate_project_number();

-- ----------------------------------------------------------------------------
-- Auto-update updated_at timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_contractors_updated_at
  BEFORE UPDATE ON project_contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_contacts_updated_at
  BEFORE UPDATE ON project_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_permits_updated_at
  BEFORE UPDATE ON permits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_draw_requests_updated_at
  BEFORE UPDATE ON draw_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-generate draw numbers per project
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_draw_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.draw_number IS NULL THEN
    SELECT COALESCE(MAX(draw_number), 0) + 1
    INTO NEW.draw_number
    FROM draw_requests
    WHERE project_id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_draw_number
  BEFORE INSERT ON draw_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_draw_number();

-- ----------------------------------------------------------------------------
-- Update project budget_spent when draws are approved
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_project_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Update when a draw is marked as paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE projects
    SET budget_spent = budget_spent + COALESCE(NEW.amount_approved, NEW.amount_requested)
    WHERE id = NEW.project_id;
  END IF;
  
  -- Reverse if unpaid (edge case)
  IF OLD.status = 'paid' AND NEW.status != 'paid' THEN
    UPDATE projects
    SET budget_spent = budget_spent - COALESCE(OLD.amount_approved, OLD.amount_requested)
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_budget
  AFTER UPDATE ON draw_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_project_budget_spent();

-- ----------------------------------------------------------------------------
-- Create profile on user signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Profiles policies
-- ----------------------------------------------------------------------------
-- Users can view all profiles (for assignments, contacts, etc.)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- Companies policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Companies viewable by authenticated users"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON companies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- Projects policies
-- ----------------------------------------------------------------------------
-- Helper function to check project access
CREATE OR REPLACE FUNCTION has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
  user_company UUID;
BEGIN
  -- Get current user's role and company
  SELECT role, company_id INTO user_role, user_company
  FROM profiles WHERE id = auth.uid();
  
  -- Admins and project managers see all
  IF user_role IN ('admin', 'project_manager') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is client, PM, or contractor on the project
  RETURN EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_uuid
    AND (
      p.client_id = auth.uid()
      OR p.project_manager_id = auth.uid()
      OR p.company_id = user_company
      OR EXISTS (
        SELECT 1 FROM project_contractors pc
        WHERE pc.project_id = p.id AND pc.contractor_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  TO authenticated
  USING (has_project_access(id) OR NOT is_archived);

CREATE POLICY "Admins and PMs can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admins and PMs can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
    OR project_manager_id = auth.uid()
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- Tasks policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view tasks on accessible projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Users can create tasks on accessible projects"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (has_project_access(project_id));

CREATE POLICY "Users can update tasks they created or are assigned"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    has_project_access(project_id)
    AND (
      created_by = auth.uid()
      OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
      )
    )
  );

CREATE POLICY "Admins and creators can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ----------------------------------------------------------------------------
-- Project contractors policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view contractors on accessible projects"
  ON project_contractors FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Admins and PMs can manage contractors"
  ON project_contractors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ----------------------------------------------------------------------------
-- Project contacts policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view contacts on accessible projects"
  ON project_contacts FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Users can manage contacts on accessible projects"
  ON project_contacts FOR ALL
  TO authenticated
  USING (has_project_access(project_id));

-- ----------------------------------------------------------------------------
-- Permits policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view permits on accessible projects"
  ON permits FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Admins and PMs can manage permits"
  ON permits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ----------------------------------------------------------------------------
-- Draw requests policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view draws on accessible projects"
  ON draw_requests FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Admins and PMs can manage draws"
  ON draw_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ----------------------------------------------------------------------------
-- Messages policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view messages on accessible projects"
  ON messages FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Users can send messages on accessible projects"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (has_project_access(project_id));

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Files policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view files on accessible projects"
  ON files FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Users can upload files to accessible projects"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (has_project_access(project_id));

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ----------------------------------------------------------------------------
-- Notes policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view non-internal notes"
  ON notes FOR SELECT
  TO authenticated
  USING (
    has_project_access(project_id)
    AND (
      NOT is_internal
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
      )
    )
  );

CREATE POLICY "Admins and PMs can manage notes"
  ON notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
    )
  );

-- ============================================================================
-- SECTION 6: SEED DATA (Optional - for demo/testing)
-- ============================================================================

-- Uncomment and run separately if needed for Freddie Mac demo

/*
-- Create demo company
INSERT INTO companies (id, name, legal_name, email, phone, city, state)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Junk Monkey Pickup',
  'Junk Monkey Pickup LLC',
  'info@junkmonkeypickup.com',
  '(555) 123-4567',
  'Auburn Hills',
  'Michigan'
);

-- Note: Demo users would be created through Supabase Auth
-- The trigger will auto-create their profile records
*/

-- ============================================================================
-- SECTION 7: USEFUL VIEWS (Optional)
-- ============================================================================

-- Project summary view with task counts
CREATE OR REPLACE VIEW project_summary AS
SELECT 
  p.id,
  p.project_number,
  p.name,
  p.status,
  p.project_type,
  p.city,
  p.state,
  p.budget_total,
  p.budget_spent,
  p.budget_remaining,
  p.start_date,
  p.estimated_end_date,
  pm.full_name as project_manager_name,
  c.name as company_name,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM draw_requests d WHERE d.project_id = p.id) as total_draws,
  (SELECT COALESCE(SUM(amount_approved), 0) FROM draw_requests d WHERE d.project_id = p.id AND d.status = 'paid') as total_paid
FROM projects p
LEFT JOIN profiles pm ON p.project_manager_id = pm.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_archived = FALSE;

-- Task dashboard view
CREATE OR REPLACE VIEW task_dashboard AS
SELECT 
  t.id,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  t.project_id,
  p.name as project_name,
  p.project_number,
  a.full_name as assigned_to_name,
  t.created_at
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN profiles a ON t.assigned_to = a.id
WHERE t.status != 'cancelled'
ORDER BY 
  CASE t.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END,
  t.due_date NULLS LAST;

-- ============================================================================
-- DONE! Schema is ready for Sprint 8 CRUD operations
-- ============================================================================
