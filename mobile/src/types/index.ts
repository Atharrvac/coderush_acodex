/**
 * JanMitra - Multilingual Citizen Complaint & Governance CRM
 * GovTech Platform Types
 */

// User
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  preferred_language?: string;
  role?: 'citizen' | 'officer' | 'department_head' | 'admin';
  department_id?: string;
  employee_id?: string;
  problems_posted: number;
  problems_solved: number;
  is_active: boolean;
  created_at: string;
  officers?: {
    id: string;
    department_id: string;
    designation: string;
    is_available: boolean;
  }[];
}

// Complaint Status lifecycle: submitted → assigned → in_progress → resolved / rejected
export type ComplaintStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';

// Problem Status (legacy): posted → being_helped → solved
export type ProblemStatus = 'posted' | 'being_helped' | 'solved';

// Problem Categories
export type Category = 'road' | 'water' | 'electricity' | 'cleanliness' | 'safety' | 'help' | 'emergency' | 'other';

// Supported Languages
export type LanguageCode = 'en' | 'hi' | 'mr';

// Problem (Public Post / Complaint)
export interface Problem {
  id: string;
  user_id: string;
  category: Category;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  images: string[];
  status: ProblemStatus;
  // GovTech CRM fields
  complaint_status?: ComplaintStatus;
  language_code?: LanguageCode;
  complaint_text_original?: string;
  complaint_text_translated?: string;
  department_id?: string;
  assigned_officer_id?: string;
  priority_level?: 'low' | 'medium' | 'high' | 'critical';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  // Helper fields (legacy)
  helper_id?: string;
  helper_name?: string;
  solved_image?: string;
  solved_note?: string;
  solved_at?: string;
  created_at: string;
  updated_at: string;
  // Viral features
  upvotes?: number;
  downvotes?: number;
  views?: number;
  trending_score?: number;
  impact_score?: number;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  affected_people?: number;
  // AI Cost Analysis
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  cost_analysis?: {
    estimatedCost: { min: number; max: number; currency: string };
    severity: string;
    urgency: string;
    timeToComplete: string;
    materialsNeeded: string[];
    laborRequired: string;
    equipmentNeeded: string[];
    breakdown: { materials: number; labor: number; equipment: number };
    factors: string[];
    recommendations: string;
  };
  severity_level?: string;
  estimated_completion_time?: string;
  forwarded_to_gov?: boolean;
  escalation_time?: string;
  // Joined data
  user?: User;
  helper?: User;
  department?: Department;
  officer?: Officer;
  distance?: number;
}

// Government Department
export interface Department {
  id: string;
  name: string;
  name_hi?: string;
  name_mr?: string;
  description?: string;
  category?: string;
  is_active: boolean;
}

// Government Officer
export interface Officer {
  id: string;
  name: string;
  designation?: string;
  department_id: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_available: boolean;
}

// Status History Entry (for tracking timeline)
export interface StatusHistoryEntry {
  id: string;
  problem_id: string;
  status: string;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

// Analytics Data
export interface AnalyticsData {
  total: number;
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  byLanguage: { name: string; value: number }[];
  byMonth: { name: string; value: number }[];
  departments?: any[];
}

// Help Offer
export interface HelpOffer {
  id: string;
  problem_id: string;
  user_id: string;
  message?: string;
  status: 'offered' | 'accepted' | 'completed';
  created_at: string;
  user?: User;
}

// Comment
export interface Comment {
  id: string;
  problem_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

// Alert/Notification
export interface Alert {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'help_offer' | 'being_helped' | 'solved' | 'comment' | 'new_problem' | 'status_update' | 'assigned';
  problem_id?: string;
  from_user_id?: string;
  read: boolean;
  created_at: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// Legacy type alias for backward compatibility
export type Complaint = Problem;
