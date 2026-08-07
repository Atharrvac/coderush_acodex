-- ============================================
-- GOVTECH CRM - PART 2: EXTEND PROBLEMS TABLE
-- Run this after Part 1
-- ============================================

-- Add new columns to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_original TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_text_translated TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS language_code VARCHAR(10) DEFAULT 'en';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES officers(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS complaint_status VARCHAR(50) DEFAULT 'submitted';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolution_images TEXT[];
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES officers(id);
ALTER TABLE problems ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_rating INTEGER;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;

-- Insert default departments
INSERT INTO departments (name, name_hi, name_mr, code, description) VALUES
('Public Works Department', 'सार्वजनिक निर्माण विभाग', 'सार्वजनिक बांधकाम विभाग', 'PWD', 'Handles road repairs, infrastructure maintenance'),
('Water Department', 'जल विभाग', 'पाणी पुरवठा विभाग', 'WATER', 'Manages water supply and distribution'),
('Municipal Corporation', 'नगर निगम', 'महानगरपालिका', 'MC', 'Handles garbage collection and sanitation'),
('Electricity Board', 'विद्युत बोर्ड', 'वीज मंडळ', 'ELEC', 'Manages electricity supply and street lights'),
('Traffic Police', 'यातायात पुलिस', 'वाहतूक पोलीस', 'TRAFFIC', 'Handles traffic management and signals'),
('Parks Department', 'उद्यान विभाग', 'उद्यान विभाग', 'PARKS', 'Maintains parks and green spaces'),
('Urban Development', 'शहरी विकास', 'शहरी विकास', 'URBAN', 'Handles infrastructure and urban planning'),
('Other', 'अन्य', 'इतर', 'OTHER', 'General complaints')
ON CONFLICT (code) DO NOTHING;
