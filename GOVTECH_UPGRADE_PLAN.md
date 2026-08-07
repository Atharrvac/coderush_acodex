# 🏛️ NagrikSeva → GovTech CRM Upgrade Plan

## 🎯 Transformation Overview

**From:** Citizen-to-Citizen Help Platform  
**To:** Multilingual Government Complaint & Governance CRM

**Key Addition:** Government department integration while keeping existing citizen features

---

## 📊 Architecture Extension

```
┌─────────────────────────────────────────────────────────┐
│                    EXISTING SYSTEM                       │
│  Citizens → Post Problems → Help Each Other             │
└─────────────────────────────────────────────────────────┘
                            +
┌─────────────────────────────────────────────────────────┐
│                    NEW GOVTECH LAYER                     │
│  Citizens → Submit Complaints → Auto-Translate →        │
│  Assign to Department → Officer Resolves → Track        │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Extensions

### New Tables to Add

1. **departments** - Government departments
2. **officers** - Government officials
3. **complaint_assignments** - Assignment tracking
4. **complaint_status_history** - Status timeline
5. **translations** - Translation cache
6. **notifications** - Real-time alerts
7. **analytics_cache** - Performance optimization

### Extended Tables

**problems** table gets new fields:
- `complaint_text_original`
- `complaint_text_translated`
- `language_code`
- `department_id`
- `assigned_officer_id`
- `complaint_status` (extends existing status)
- `priority_level`
- `resolution_notes`
- `resolution_images`
- `resolved_by`
- `resolved_at`

---

## 🌐 Supported Languages

1. **English** (en)
2. **Hindi** (hi)
3. **Marathi** (mr)

---

## 🔧 Implementation Modules

### Module 1: Multilingual System ✅
### Module 2: AI Translation (Grok API) ✅
### Module 3: Department Assignment ✅
### Module 4: Citizen Tracking Dashboard ✅
### Module 5: Officer Dashboard (Web) ✅
### Module 6: Analytics System ✅
### Module 7: Real-Time Map ✅
### Module 8: Notification System ✅

---

## 📁 File Structure

```
nagrikseva/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── translation.controller.js (NEW)
│   │   │   ├── department.controller.js (NEW)
│   │   │   ├── officer.controller.js (NEW)
│   │   │   ├── complaint.controller.js (NEW)
│   │   │   └── analytics.controller.js (NEW)
│   │   ├── services/
│   │   │   ├── grok.service.js (NEW)
│   │   │   ├── translation.service.js (NEW)
│   │   │   └── assignment.service.js (NEW)
│   │   └── routes/
│   │       └── govtech.routes.js (NEW)
│   └── database/
│       └── migrations/
│           └── add_govtech_system.sql (NEW)
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── post.tsx (EXTEND)
│   │   │   └── tracking.tsx (NEW)
│   │   └── complaint-details.tsx (NEW)
│   └── src/
│       ├── services/
│       │   ├── translation.service.ts (NEW)
│       │   └── complaint.service.ts (EXTEND)
│       └── components/
│           ├── LanguageSelector.tsx (NEW)
│           ├── ComplaintTimeline.tsx (NEW)
│           └── StatusBadge.tsx (NEW)
└── officer-dashboard/ (NEW)
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Complaints.tsx
    │   │   ├── Map.tsx
    │   │   └── Analytics.tsx
    │   └── components/
    │       ├── ComplaintCard.tsx
    │       ├── AssignmentModal.tsx
    │       └── Charts/
    └── package.json
```

---

## 🎨 Design System (Following SKILL.md)

### Aesthetic Direction: **Government Trust + Modern Efficiency**

**Typography:**
- Display: Poppins Bold (distinctive, authoritative)
- Body: Inter (readable, professional)
- Monospace: JetBrains Mono (for IDs, codes)

**Color Palette:**
```css
/* Primary - Government Authority */
--gov-primary: #1E40AF;      /* Deep Blue */
--gov-secondary: #059669;    /* Green (keep existing) */
--gov-accent: #DC2626;       /* Red for urgent */

/* Status Colors */
--status-submitted: #F59E0B;  /* Amber */
--status-assigned: #3B82F6;   /* Blue */
--status-progress: #8B5CF6;   /* Purple */
--status-resolved: #10B981;   /* Green */
--status-rejected: #EF4444;   /* Red */

/* Language Indicators */
--lang-en: #2563EB;
--lang-hi: #F97316;
--lang-mr: #8B5CF6;
```

**Visual Style:**
- Card-based with subtle shadows
- Gradient accents for headers
- Smooth transitions (300ms ease)
- Micro-interactions on status changes
- Badge system for priorities

---

## 🚀 Implementation Priority

### Phase 1: Database & Backend (Day 1)
1. Create database schema
2. Add translation service (Grok API)
3. Create department assignment logic
4. Build API endpoints

### Phase 2: Mobile Extensions (Day 2)
1. Add language selector
2. Extend post form
3. Create tracking screen
4. Add complaint timeline

### Phase 3: Officer Dashboard (Day 3)
1. Setup React dashboard
2. Create complaint management
3. Add map integration
4. Build analytics

### Phase 4: Real-time & Polish (Day 4)
1. Implement notifications
2. Add realtime updates
3. Testing & bug fixes
4. Demo preparation

---

Ready to implement! Starting with database schema...
