# 🚨 URGENT: Apply This Fix Now

## Current Issues
1. ❌ Cannot post problems (RLS error)
2. ❌ Email confirmation required for new users
3. ❌ Realtime updates not working

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/cqkdvdawrfipbecvvrlq

### Step 2: Run SQL Fix
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open file: `COMPLETE_STABILITY_FIX.sql`
4. Copy ALL content
5. Paste in SQL Editor
6. Click **RUN** button
7. Wait for success message

### Step 3: Disable Email Confirmation
1. Click **Authentication** (left sidebar)
2. Click **Providers** tab
3. Click **Email** row
4. Find "Confirm email" toggle
5. Turn it **OFF**
6. Click **Save**

### Step 4: Restart App
Press Ctrl+C in both terminals, then:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Mobile
cd mobile && npm start
```

## ✅ Done!
Test by:
- Register new user
- Post a problem
- See it appear in feed

All errors should be gone!
