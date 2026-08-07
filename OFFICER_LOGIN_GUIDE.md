# 🏛️ Officer Login Testing Guide

## 🚀 Quick Setup Steps

### Step 1: Create Demo Officer Account
I've already created a demo officer account through the API:
- **Email**: `officer.demo@gov.in`
- **Password**: `password123`
- **Status**: ✅ Account created

### Step 2: Update User Role (Required)
You need to run this SQL in your Supabase SQL Editor:

```sql
-- Update the demo officer role
UPDATE users 
SET role = 'officer'
WHERE email = 'officer.demo@gov.in';

-- Verify the update
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'officer.demo@gov.in';
```

### Step 3: Test Officer Login

1. **Open your mobile app** (http://localhost:8081)
2. **Go to Profile tab**
3. **Tap "Officer Portal"**
4. **Use these credentials:**
   - Email: `officer.demo@gov.in`
   - Password: `password123`

## 🎯 What You'll See

### Officer Dashboard Features:
- **Statistics Cards**: Total, Pending, In Progress, Resolved complaints
- **Recent Complaints**: Latest citizen complaints
- **Quick Actions**: Manage Complaints, View Users, Analytics, Settings
- **Tab Navigation**: Overview, Complaints, Users, Analytics

### Role-Based Access:
- **Officer**: Can view assigned complaints and dashboard overview
- **Department Head**: Can view all department complaints + user management
- **Admin**: Full system access

## 🔧 Backend API Status

The backend is running on `http://localhost:3000` with these endpoints:
- ✅ `POST /api/v1/auth/login` - Officer authentication
- ✅ `GET /api/v1/officer/dashboard` - Dashboard data
- ✅ `GET /api/v1/officer/complaints` - Complaint management
- ✅ `GET /api/v1/officer/users` - User management
- ✅ `GET /api/v1/officer/analytics` - Analytics data

## 🧪 Testing Scenarios

### 1. Basic Login Test
```
Email: officer.demo@gov.in
Password: password123
Expected: Successful login → Officer Dashboard
```

### 2. Role Validation Test
```
Try logging in with regular citizen account
Expected: "Access Denied" message
```

### 3. Dashboard Data Test
```
After login, check if:
- Statistics cards show data
- Recent complaints are displayed
- Quick actions are functional
```

## 🐛 Troubleshooting

### Issue: "Invalid email or password"
**Solution**: Run the SQL script to update the user role:
```sql
UPDATE users SET role = 'officer' WHERE email = 'officer.demo@gov.in';
```

### Issue: "Access Denied"
**Solution**: Make sure the user role is set to 'officer', 'department_head', or 'admin'

### Issue: Dashboard not loading
**Solution**: Check if backend is running on port 3000 and API endpoints are accessible

## 📱 Mobile App Status

- ✅ Mobile app running on http://localhost:8081
- ✅ Officer login screen created
- ✅ Officer dashboard implemented
- ✅ Role-based access control working
- ✅ Demo credentials integrated

## 🎉 Ready to Test!

Your officer login system is ready! Just run the SQL script to update the user role, then you can login and explore the officer dashboard.

**Quick Test Command:**
```bash
# Test the API directly
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "officer.demo@gov.in", "password": "password123"}'
```

After running the SQL script, this should return a success response with a JWT token.