# 🗄️ Supabase SQL Setup Guide

## 📋 SQL Files to Run (In Order)

### Step 1: Run Stability Fix (If Not Done Already)

**File:** `COMPLETE_STABILITY_FIX.sql`

**Purpose:** Fixes existing app issues
- RLS policies for posting problems
- User profile creation
- Realtime updates
- Storage policies
- Voting system

**Status:** ⚠️ Run this FIRST if you haven't already

---

### Step 2: Run GovTech System Migration

**File:** `backend/database/migrations/add_govtech_system.sql`

**Purpose:** Adds all GovTech features
- 7 new tables (departments, officers, etc.)
- Extends problems table with multilingual fields
- Auto-assignment system
- Status tracking
- Analytics views

**Status:** ✅ MUST RUN for GovTech features

---

## 🚀 How to Run SQL in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `cqkdvdawrfipbecvvrlq`

2. **Open SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button

3. **Run First SQL (If needed)**
   - Open file: `COMPLETE_STABILITY_FIX.sql`
   - Copy ALL content (Ctrl+A, Ctrl+C)
   - Paste in SQL Editor
   - Click **"Run"** button (or Cmd/Ctrl + Enter)
   - Wait for success messages

4. **Run Second SQL (GovTech)**
   - Click **"New Query"** again
   - Open file: `backend/database/migrations/add_govtech_system.sql`
   - Copy ALL content
   - Paste in SQL Editor
   - Click **"Run"** button
   - Wait for success messages

---

## ✅ Expected Success Messages

### After Running add_govtech_system.sql:

```
========================================
GOVTECH CRM SYSTEM INSTALLED!
========================================
✓ 7 new tables created
✓ Problems table extended
✓ 8 departments added
✓ Auto-assignment triggers active
✓ Status tracking enabled
✓ RLS policies configured
✓ Realtime enabled
✓ Analytics views created
========================================
Next: Setup Grok API translation service
========================================
```

---

## 🔍 Verify Installation

### Check Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments',
  'officers',
  'complaint_assignments',
  'complaint_status_history',
  'translations',
  'notifications',
  'analytics_cache'
)
ORDER BY table_name;
```

**Expected Result:** 7 tables listed

---

### Check Departments Added

```sql
SELECT code, name, name_hi, name_mr 
FROM departments 
ORDER BY name;
```

**Expected Result:** 8 departments:
- Electricity Board (ELEC)
- Municipal Corporation (MC)
- Other (OTHER)
- Parks Department (PARKS)
- Public Works Department (PWD)
- Traffic Police (TRAFFIC)
- Urban Development (URBAN)
- Water Department (WATER)

---

### Check Problems Table Extended

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'problems' 
AND column_name IN (
  'complaint_text_original',
  'complaint_text_translated',
  'language_code',
  'department_id',
  'assigned_officer_id',
  'complaint_status'
)
ORDER BY column_name;
```

**Expected Result:** 6 new columns listed

---

### Check Realtime Enabled

```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN (
  'departments',
  'officers',
  'complaint_assignments',
  'notifications'
)
ORDER BY tablename;
```

**Expected Result:** 4 tables with realtime enabled

---

## ⚠️ Troubleshooting

### Error: "relation already exists"

**Cause:** Table already created  
**Solution:** Safe to ignore, or drop table first:

```sql
DROP TABLE IF EXISTS table_name CASCADE;
```

Then re-run the migration.

---

### Error: "column already exists"

**Cause:** Column already added  
**Solution:** Safe to ignore, the `IF NOT EXISTS` clause handles this.

---

### Error: "permission denied"

**Cause:** Insufficient permissions  
**Solution:** Make sure you're logged in as the project owner in Supabase Dashboard.

---

### Error: "function already exists"

**Cause:** Function was created before  
**Solution:** The script uses `CREATE OR REPLACE` so it should work. If not:

```sql
DROP FUNCTION IF EXISTS function_name CASCADE;
```

Then re-run.

---

## 📊 What Gets Created

### New Tables (7)

1. **departments** - Government departments (8 pre-loaded)
2. **officers** - Government officials
3. **complaint_assignments** - Assignment tracking
4. **complaint_status_history** - Status timeline
5. **translations** - Translation cache
6. **notifications** - Real-time alerts
7. **analytics_cache** - Performance optimization

### Extended Tables (1)

**problems** - Gets 13 new columns:
- `complaint_text_original` - Original text in user's language
- `complaint_text_translated` - English translation
- `language_code` - Language (en/hi/mr)
- `department_id` - Assigned department
- `assigned_officer_id` - Assigned officer
- `complaint_status` - Status (submitted/assigned/in_progress/resolved/rejected)
- `priority_level` - Priority (low/medium/high/urgent)
- `resolution_notes` - Officer's resolution notes
- `resolution_images` - Resolution photos
- `resolved_by` - Officer who resolved
- `resolved_at` - Resolution timestamp
- `escalated` - Escalation flag
- `escalated_at` - Escalation timestamp
- `citizen_rating` - Citizen's rating (1-5)
- `citizen_feedback` - Citizen's feedback

### Triggers (3)

1. **auto_assign_department** - Auto-assigns department based on category
2. **track_status_change** - Tracks status changes in history
3. **update_officer_stats** - Updates officer statistics

### Views (2)

1. **department_stats** - Department performance metrics
2. **officer_performance** - Officer performance metrics

### Indexes (15+)

Performance indexes on all key columns

---

## 🎯 Quick Verification Script

Run this all-in-one verification:

```sql
-- Check everything
DO $$
DECLARE
  table_count INTEGER;
  dept_count INTEGER;
  column_count INTEGER;
BEGIN
  -- Count new tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'departments', 'officers', 'complaint_assignments',
    'complaint_status_history', 'translations', 
    'notifications', 'analytics_cache'
  );
  
  -- Count departments
  SELECT COUNT(*) INTO dept_count FROM departments;
  
  -- Count new columns in problems
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'problems' 
  AND column_name IN (
    'complaint_text_original', 'complaint_text_translated',
    'language_code', 'department_id', 'assigned_officer_id',
    'complaint_status'
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New tables created: % (expected: 7)', table_count;
  RAISE NOTICE 'Departments added: % (expected: 8)', dept_count;
  RAISE NOTICE 'New columns in problems: % (expected: 6)', column_count;
  RAISE NOTICE '========================================';
  
  IF table_count = 7 AND dept_count = 8 AND column_count = 6 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED!';
  ELSE
    RAISE NOTICE '⚠️  SOME CHECKS FAILED - Review above';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
```

---

## 📝 Summary

**Files to Run:**
1. ✅ `COMPLETE_STABILITY_FIX.sql` (if not done)
2. ✅ `backend/database/migrations/add_govtech_system.sql` (required)

**Time Required:** ~2 minutes

**Next Steps After SQL:**
1. Add `GROK_API_KEY` to `backend/.env`
2. Create backend controllers
3. Create mobile components
4. Test the system

---

**Ready to run? Open Supabase Dashboard and start with the SQL files! 🚀**
