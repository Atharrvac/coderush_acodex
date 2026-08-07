# 🧪 STEP-BY-STEP TESTING GUIDE

## 🚀 SETUP (2 minutes)

### Step 1: Database Setup
1. Open **Supabase Dashboard** → SQL Editor
2. Copy entire content from `SIMPLE_DATABASE_SETUP.sql`
3. Paste and click **RUN**
4. Should see: "✅ BASIC GOVTECH SETUP COMPLETE!"

### Step 2: Start Backend
```bash
cd backend
npm install  # if first time
npm start
```
Should see: "🏛️ NagrikSeva API running on port 3000"

### Step 3: Start Mobile App
```bash
cd mobile
npm install  # if first time
npx expo start
```
Scan QR code with Expo Go app

### Step 4: Open Government Dashboard
- Open `government-dashboard/index.html` in browser
- Should see login screen

## 📱 TESTING THE COMPLETE WORKFLOW (3 minutes)

### TEST 1: Citizen Registration
1. **Mobile App** → Register
2. **Check**: Role selector shows "Citizen" vs "Officer" ✅
3. **Select**: "Citizen"
4. **Fill**: Name, email, password
5. **Check**: GovTech branding visible ✅
6. **Register** → Should login successfully

### TEST 2: Submit Complaint
1. **Go to**: Post tab
2. **Check**: Language selector (English/Hindi/Marathi) ✅
3. **Check**: Priority selector (Low/Medium/High) ✅
4. **Select**: Category "Road"
5. **Add**: Description "Large pothole on main road"
6. **Add**: Location (use GPS or search)
7. **Submit** → Should show success message ✅

### TEST 3: Government Dashboard
1. **Open**: government-dashboard/index.html
2. **Login**: officer.pwd@gov.in / password123
3. **Check**: Should see the complaint you just submitted ✅
4. **Click**: "View" on the complaint
5. **Click**: "Start Work" → Status becomes "In Progress" ✅
6. **Click**: "Mark Resolved" → Status becomes "Resolved" ✅

### TEST 4: Real-Time Tracking
1. **Back to mobile app** → Activity tab
2. **Check**: Should see your complaint with updated status ✅
3. **Navigate**: To complaint tracking (if available)
4. **Check**: Timeline shows all status changes ✅
5. **Check**: Progress bar shows 100% complete ✅

## ✅ SUCCESS CHECKLIST

### Mobile App Working:
- [ ] Role-based registration
- [ ] GovTech branding visible
- [ ] Language selector works
- [ ] Priority selector works
- [ ] Complaint submission works
- [ ] Activity tab shows complaints
- [ ] No crashes or errors

### Government Dashboard Working:
- [ ] Mock login works
- [ ] Complaints appear
- [ ] Status updates work
- [ ] Professional interface

### Complete Workflow:
- [ ] Citizen submits complaint
- [ ] Complaint appears in dashboard
- [ ] Officer can update status
- [ ] Status updates in real-time
- [ ] Timeline shows progress

## 🚨 IF SOMETHING DOESN'T WORK:

### Database Issues:
- Re-run `SIMPLE_DATABASE_SETUP.sql`
- Check Supabase connection

### Backend Issues:
- Check port 3000 is free
- Restart: `npm start`

### Mobile Issues:
- Clear cache: `npx expo start --clear`
- Check Supabase config

### Dashboard Issues:
- Check backend is running on localhost:3000
- Try different browser

## 🎯 DEMO READY WHEN:
✅ All checkboxes above are checked
✅ Complete workflow works end-to-end
✅ No crashes or errors
✅ Real-time updates working

**YOU'RE READY TO IMPRESS THE JUDGES!** 🏆