# 🚀 QUICK GOVTECH SETUP (2 MINUTES)

## 1. Apply Database Schema
```sql
-- Copy and paste FINAL_WORKING_GOVTECH.sql into Supabase SQL Editor
-- This creates all tables, departments, auto-assignment, etc.
```

## 2. Start Backend
```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:3000
```

## 3. Start Mobile App
```bash
cd mobile
npm install
npx expo start
```

## 4. Test Complete Workflow

### CITIZEN FLOW:
1. Register as "Citizen" 
2. Submit complaint with language/priority
3. Complaint auto-assigns to department

### OFFICER FLOW:
1. Open government-dashboard/index.html
2. Login: officer.pwd@gov.in / password123
3. See citizen complaints
4. Update status to "In Progress" → "Resolved"

## 5. Key Features Working:
✅ Role-based registration (Citizen/Officer)
✅ GovTech branding visible
✅ Multilingual complaint submission
✅ Auto-assignment to departments
✅ Government dashboard
✅ Real-time status tracking
✅ Priority levels
✅ Complete citizen → government workflow

## 6. Test Accounts:
- **Citizens**: Register normally with "Citizen" role
- **Officers**: 
  - officer.pwd@gov.in / password123 (PWD)
  - officer.water@gov.in / password123 (Water)
  - head.pwd@gov.in / password123 (Department Head)

## 7. Departments Created:
- Public Works Department (PWD) - Roads
- Water Supply Department - Water issues  
- Electricity Board - Power issues
- Municipal Corporation - Garbage/Cleanliness
- Traffic Police - Traffic issues
- Parks Department - Parks
- Urban Development - Infrastructure

## READY TO DEMO! 🎉