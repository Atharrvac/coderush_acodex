/**
 * Community Redressal Planner
 * Civic Issue Categories for Resident Complaints
 */

export const PROBLEM_CATEGORIES = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Broken roads, potholes, damaged bridges, footpaths',
    icon: 'construct',
    color: '#EF4444',
    emoji: '🏗️',
    isGovOnly: true,
  },
  {
    id: 'sanitation',
    name: 'Sanitation',
    description: 'Garbage, drainage, sewage, dirty areas',
    icon: 'trash',
    color: '#10B981',
    emoji: '🧹',
    isGovOnly: false,
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Water supply, electricity, gas, telephone',
    icon: 'water',
    color: '#3B82F6',
    emoji: '💧',
    isGovOnly: true,
  },
  {
    id: 'safety',
    name: 'Safety Hazard',
    description: 'Unsafe areas, broken streetlights, traffic signals',
    icon: 'shield',
    color: '#8B5CF6',
    emoji: '🛡️',
    isGovOnly: true,
  },
  {
    id: 'access',
    name: 'Access Barrier',
    description: 'Disability access, footpath blockage, ramps needed',
    icon: 'accessibility',
    color: '#EC4899',
    emoji: '♿',
    isGovOnly: true,
  },
  {
    id: 'environment',
    name: 'Environment',
    description: 'Noise, pollution, illegal parking, encroachment',
    icon: 'leaf',
    color: '#059669',
    emoji: '🌳',
    isGovOnly: false,
  },
  {
    id: 'public_health',
    name: 'Public Health',
    description: 'Mosquitoes, stagnant water, health hazards',
    icon: 'medkit',
    color: '#F59E0B',
    emoji: '🏥',
    isGovOnly: true,
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Other civic issues',
    icon: 'ellipsis-horizontal',
    color: '#64748B',
    emoji: '📌',
    isGovOnly: false,
  },
] as const;

// For backward compatibility
export const CATEGORIES = PROBLEM_CATEGORIES;

export const SERVICE_CATEGORIES = PROBLEM_CATEGORIES.slice(0, 4);

export const STATUS_CONFIG = {
  posted: {
    label: 'Submitted',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: 'time',
    description: 'Complaint submitted - awaiting review',
  },
  being_helped: {
    label: 'In Review',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: 'eye',
    description: 'Under review by department',
  },
  in_progress: {
    label: 'In Progress',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: 'construct',
    description: 'Work started on resolution',
  },
  solved: {
    label: 'Resolved',
    color: '#10B981',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'checkmark-circle',
    description: 'Issue resolved',
  },
  escalated: {
    label: 'Escalated',
    color: '#DC2626',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: 'arrow-up-circle',
    description: 'Escalated to higher authority',
  },
  appeal: {
    label: 'Under Appeal',
    color: '#F97316',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: 'chatbubble-ellipses',
    description: 'Appeal pending review',
  },
} as const;

// Legacy exports
export const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#16A34A' },
  { id: 'high', label: 'High', color: '#DC2626' },
] as const;

export const STATUS_LABELS = STATUS_CONFIG;
