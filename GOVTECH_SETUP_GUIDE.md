# 🏛️ GovTech CRM - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Apply Database Schema
```bash
# Open Supabase Dashboard → SQL Editor
# Copy and run: GOVTECH_PRODUCTION_READY.sql
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Start Mobile App
```bash
cd mobile
npm start
```

### 4. Open Government Dashboard
```bash
# Open government-dashboard/index.html in browser
# Or serve it locally:
cd government-dashboard
python -m http.server 8080
# Then open: http://localhost:8080
```

## 🎯 Complete Workflow Demo

### Step 1: Citizen Submits Complaint (Mobile App)
1. Open mobile app (Expo)
2. Register as citizen: `citizen@test.com / password123`
3. Go to "Post" tab
4. Select category (e.g., "Road")
5. Add description: "Large pothole on Main Street"
6. Add location and submit
7. **✅ Complaint auto-assigned to PWD department**

### Step 2: Government Officer Takes Action (Web Dashboard)
1. Open `government-dashboard/index.html`
2. Login as officer: `officer.pwd@gov.in / password123`
3. See the complaint in dashboard
4. Click "View" to see details
5. Click "Start Work" → Status: In Progress
6. Click "Mark Resolved" → Status: Resolved
7. **✅ Citizen gets real-time status updates**

### Step 3: Citizen Tracks Progress (Mobile App)
1. Go to "Tracking" tab in mobile app
2. See complaint status timeline
3. View resolution details
4. **✅ Complete transparency**

## 🧪 Test Accounts

### Citizens (Mobile App)
- Any email/password for registration
- Default role: `citizen`

### Government Officers (Web Dashboard)
- **PWD Officer**: `officer.pwd@gov.in / password123`
- **Water Officer**: `officer.water@gov.in / password123`
- **Department Head**: `head.pwd@gov.in / password123`
- **Admin**: `admin@gov.in / password123`

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CITIZEN APP   │    │   BACKEND API   │    │ OFFICER DASHBOARD│
│   (Mobile)      │◄──►│   (Node.js)     │◄──►│    (Web)        │
│                 │    │                 │    │                 │
│ • Submit        │    │ • Auto-assign   │    │ • View complaints│
│ • Track status  │    │ • Real-time     │    │ • Update status │
│ • Multilingual  │    │ • Translation   │    │ • Resolve issues│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   DATABASE      │
                    │   (Supabase)    │
                    │                 │
                    │ • Problems      │
                    │ • Departments   │
                    │ • Officers      │
                    │ • Status History│
                    └─────────────────┘
```

## 🔄 Auto-Assignment Logic

```sql
-- When citizen submits complaint:
Road → Public Works Department (PWD)
Water → Water Supply Department (WSD)
Electricity → Electricity Board (EB)
Garbage → Municipal Corporation (MC)
Traffic → Traffic Police (TP)
Parks → Parks Department (PD)
Infrastructure → Urban Development (UD)
```

## 📊 Status Flow

```
Submitted → Assigned → In Progress → Resolved
    ↓           ↓           ↓           ↓
 Citizen    Auto-assign  Officer    Officer
 submits    to dept     starts     completes
```

## 🌐 Multilingual Support

- **Supported Languages**: English, Hindi, Marathi
- **Auto-translation**: Using OpenAI API (configurable)
- **Fallback**: Mock translations for demo

## 🚀 Production Deployment

### Backend (Node.js)
```bash
# Environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key (optional)
PORT=3000

# Deploy to Heroku/Railway/Vercel
npm run start
```

### Mobile App (Expo)
```bash
# Build for production
expo build:android
expo build:ios

# Or publish to Expo
expo publish
```

### Government Dashboard (Static)
```bash
# Deploy to Netlify/Vercel/GitHub Pages
# Just upload the government-dashboard folder
```

## 🔧 Troubleshooting

### Backend not starting?
```bash
# Check if all dependencies installed
npm install

# Check environment variables
cat backend/.env

# Check database connection
npm run dev
```

### Mobile app not connecting?
```bash
# Update API URL in mobile/src/config/api.ts
export const API_BASE_URL = 'http://your-backend-url/api/v1';
```

### Database errors?
```bash
# Re-run the schema
# Copy GOVTECH_PRODUCTION_READY.sql to Supabase SQL Editor
```

## 📈 Features Implemented

### ✅ Core Requirements
- [x] Multilingual complaint submission
- [x] AI translation system (with fallback)
- [x] Auto-assignment to departments
- [x] Real-time complaint tracking
- [x] Government officer dashboard
- [x] Analytics and trends
- [x] Role-based access control

### ✅ Technical Features
- [x] Real-time updates (Supabase)
- [x] Row-level security (RLS)
- [x] Auto-assignment triggers
- [x] Status history tracking
- [x] Performance indexes
- [x] Mobile + Web interfaces

### ✅ User Roles
- [x] Citizens (mobile app)
- [x] Officers (web dashboard)
- [x] Department heads (web dashboard)
- [x] System admin (web dashboard)

## 🎉 Demo Ready!

Your GovTech CRM system is now **production-ready** and **hackathon-demo-ready**!

**Workflow**: Citizen submits → Auto-assigned → Officer resolves → Real-time tracking

**Time to setup**: ~5 minutes
**Time to demo**: ~2 minutes

Perfect for showcasing a complete government complaint management system! 🏆