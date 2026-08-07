# 🧪 GOVTECH CRM TEST PLAN

## STEP 1: Database Setup
1. Open Supabase SQL Editor
2. Copy entire `FINAL_WORKING_GOVTECH.sql` content
3. Run it - should see "✅ GOVTECH CRM SYSTEM INSTALLED!" message

## STEP 2: Start Backend
```bash
cd backend
npm start
```
Should see: "🏛️ NagrikSeva API running on port 3000"

## STEP 3: Test Government Dashboard
1. Open `government-dashboard/index.html` in browser
2. Login with: officer.pwd@gov.in / password123
3. Should see empty complaints table (normal - no complaints yet)

## STEP 4: Start Mobile App
```bash
cd mobile
npx expo start
```

## STEP 5: Test Complete Workflow

### A. CITIZEN REGISTRATION
1. Open mobile app
2. Go to Register
3. Select "Citizen" role ✅
4. Fill details and register
5. Should see GovTech branding ✅

### B. SUBMIT COMPLAINT
1. Go to Post tab
2. Select language (English/Hindi/Marathi) ✅
3. Select priority (Low/Medium/High) ✅
4. Choose category (Road/Water/etc)
5. Add description
6. Add location
7. Submit complaint ✅

### C. AUTO-ASSIGNMENT
1. Complaint should auto-assign to department ✅
2. Check government dashboard - complaint appears ✅

### D. OFFICER ACTION
1. In government dashboard
2. Click "View" on complaint
3. Click "Start Work" → status becomes "In Progress"
4. Click "Mark Resolved" → status becomes "Resolved" ✅

### E. CITIZEN TRACKING
1. In mobile app, go to Activity tab
2. Should see complaint with updated status ✅

## SUCCESS CRITERIA:
✅ Role-based registration works
✅ GovTech branding visible
✅ Multilingual complaint form
✅ Auto-assignment to departments
✅ Government dashboard shows complaints
✅ Status updates work
✅ Real-time tracking

## DEMO READY! 🎉

If any step fails, check:
1. Database schema applied correctly
2. Backend running on port 3000
3. Mobile app connected to correct Supabase project
4. Government dashboard pointing to localhost:3000