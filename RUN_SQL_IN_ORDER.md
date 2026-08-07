# 🗄️ Run SQL Files in Supabase (In Order)

## ⚠️ IMPORTANT: Run These 6 Files ONE BY ONE

The original file was too large and had syntax issues. I've split it into 6 smaller files.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar

---

### Step 2: Run Files in Order

#### File 1: Create Tables
**File:** `GOVTECH_PART1_TABLES.sql`
- Creates 7 new tables
- Click "New Query" → Copy/Paste → Run

#### File 2: Extend Problems Table
**File:** `GOVTECH_PART2_EXTEND.sql`
- Adds new columns to problems table
- Inserts 8 departments
- Click "New Query" → Copy/Paste → Run

#### File 3: Create Indexes
**File:** `GOVTECH_PART3_INDEXES.sql`
- Creates performance indexes
- Click "New Query" → Copy/Paste → Run

#### File 4: Functions & Triggers
**File:** `GOVTECH_PART4_FUNCTIONS.sql`
- Creates auto-assignment function
- Creates status tracking
- Click "New Query" → Copy/Paste → Run

#### File 5: Row Level Security
**File:** `GOVTECH_PART5_RLS.sql`
- Enables RLS on all tables
- Creates security policies
- Click "New Query" → Copy/Paste → Run

#### File 6: Realtime & Views (FINAL)
**File:** `GOVTECH_PART6_REALTIME.sql`
- Enables realtime updates
- Creates analytics views
- Shows success message
- Click "New Query" → Copy/Paste → Run

---

## ✅ Success Message

After running File 6, you should see:

```
========================================
GOVTECH CRM SYSTEM INSTALLED!
========================================
✓ All tables created
✓ Problems table extended
✓ 8 departments added
✓ Triggers active
✓ RLS policies configured
✓ Realtime enabled
✓ Views created
========================================
```

---

## 🔍 Verify Installation

Run this query to check:

```sql
-- Check departments
SELECT code, name FROM departments ORDER BY name;
```

You should see 8 departments:
- ELEC - Electricity Board
- MC - Municipal Corporation
- OTHER - Other
- PARKS - Parks Department
- PWD - Public Works Department
- TRAFFIC - Traffic Police
- URBAN - Urban Development
- WATER - Water Department

---

## ⚠️ If You Get Errors

### "relation already exists"
- Safe to ignore, table already created
- Or drop table first: `DROP TABLE table_name CASCADE;`

### "column already exists"
- Safe to ignore, column already added

### "function already exists"
- Safe to ignore, function will be replaced

---

## 🎯 Quick Checklist

- [ ] Run GOVTECH_PART1_TABLES.sql
- [ ] Run GOVTECH_PART2_EXTEND.sql
- [ ] Run GOVTECH_PART3_INDEXES.sql
- [ ] Run GOVTECH_PART4_FUNCTIONS.sql
- [ ] Run GOVTECH_PART5_RLS.sql
- [ ] Run GOVTECH_PART6_REALTIME.sql
- [ ] Verify departments created
- [ ] Add GROK_API_KEY to backend/.env

---

## 📝 Next Steps After SQL

1. Add to `backend/.env`:
   ```
   GROK_API_KEY=your_grok_api_key_here
   ```

2. Create backend files from `COMPLETE_GOVTECH_CODE.md`

3. Create mobile components

4. Test the system!

---

**Total Time: ~5 minutes**

**Ready? Start with File 1! 🚀**
