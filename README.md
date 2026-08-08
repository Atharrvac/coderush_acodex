# 🏛️ JanMitra - Citizen Civic Reporting Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-Latest-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-black.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

> **Empowering citizens to report civic issues with AI-powered assistance and government dashboard monitoring**

JanMitra (meaning "People's Friend" in Hindi) is a comprehensive civic engagement platform that enables citizens to report local infrastructure problems through a mobile app, while providing government officials with an intelligent dashboard for real-time monitoring, SMS notifications, and AI-assisted problem resolution.

---

## 📱 System Architecture

```
┌──────────────────┐
│   Mobile App     │
│  (React Native)  │
│   + Expo + AI    │
└────────┬─────────┘
         │
         │ Real-time Sync
         ▼
┌──────────────────┐        ┌──────────────────┐
│    Supabase      │◄──────►│  Government      │
│   PostgreSQL     │        │   Dashboard      │
│  + Auth + RLS    │        │   (Web Portal)   │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│   AI Services    │        │   SMS Gateway    │
│  Image Analysis  │        │  Fast2SMS/       │
│  Auto-Translate  │        │  TextLocal       │
└──────────────────┘        └──────────────────┘
```

---

## ✨ Key Features

### 🎯 For Citizens (Mobile App)

#### Problem Reporting
- 📸 **Multi-Image Upload** - Capture up to 5 photos with auto-compression
- 📍 **GPS Location** - Automatic location detection with manual search fallback
- 🏷️ **Smart Categories** - 15+ civic issue types (roads, water, electricity, etc.)
- 🗣️ **Multi-language** - Hindi, English, Marathi support with auto-translation
- 🤖 **AI Image Analysis** - Automatic problem severity and category detection

#### Tracking & Communication
- 🔔 **Real-time Notifications** - Get updates when issues are being addressed
- 📊 **Status Tracking** - Monitor: Posted → Being Helped → Solved
- 💬 **In-app Comments** - Communicate with field officers
- � **Personal Dashboard** - Track all your reported issues

#### Community Features
- 🗺️ **Map View** - See all nearby civic problems
- 🔍 **Filter & Search** - By category, status, location, date
- 👍 **Upvote Issues** - Support important problems
- 📱 **Offline Support** - Queue reports when offline

---

### 🏛️ For Government (Web Dashboard)

#### Real-time Intelligence
- � **Analytics Dashboard** - Visual statistics and trends
- 🗺️ **Geospatial Intelligence** - Interactive map with hotspot clustering
- 🎯 **Triage Queue** - Prioritized issue management
- 📈 **SLA Monitoring** - Track response times and breaches

#### Field Operations
- 📱 **SMS Integration** - Send real SMS to field officers (Fast2SMS/TextLocal)
- 🚨 **Auto-escalation** - Escalate unresolved issues automatically
- 👮 **Officer Assignment** - Assign issues to specific departments/officers
- ✅ **Resolution Workflow** - Mark issues as solved with documentation

#### AI-Powered Features
- 🤖 **AI Recommendations** - Suggested action plans for each issue
- 📸 **Image Analysis** - Auto-detect problem type and severity
- 🔄 **Duplicate Detection** - Identify similar nearby reports
- 📊 **Predictive Analytics** - Forecast problem hotspots

#### Professional Design
- 🎨 **Premium Typography** - Crimson Text, IBM Plex Sans, JetBrains Mono
- 🏛️ **Government Aesthetic** - Official tricolor, clean professional interface
- 📱 **Responsive Design** - Works on desktop and tablets
- 🔒 **Secure Authentication** - Officer-level access control

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for government dashboard server)
- Expo CLI
- Supabase account (free tier works)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/janmitra.git
cd janmitra
```

### 2. Set Up Supabase Database
```bash
# 1. Create project at https://supabase.com
# 2. Go to SQL Editor
# 3. Run: backend/database/nagrikseva_citizen_v2.sql
# 4. Get API keys from Settings → API
```

### 3. Configure Mobile App
```bash
cd mobile
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npx expo start
# Scan QR code with Expo Go app
```

### 4. Set Up Backend API (Optional - for SMS)
```bash
cd backend
npm install
# Edit src/config/supabase.js with your credentials
npm start
# Runs on http://localhost:3000
```

### 5. Launch Government Dashboard
```bash
cd government-dashboard
python3 -m http.server 3001
# Access at http://localhost:3001
# Login: officer.demo@gov.in / password123
```

---

## 🏗️ Project Structure

```
janmitra/
├── mobile/                          # React Native mobile app
│   ├── app/                        # Expo Router screens
│   │   ├── (tabs)/                # Tab navigation
│   │   │   ├── index.tsx          # Feed screen
│   │   │   ├── post.tsx           # Post problem
│   │   │   ├── activity.tsx       # User activity
│   │   │   ├── map.tsx            # Map view
│   │   │   └── profile.tsx        # User profile
│   │   ├── login.tsx              # Login screen
│   │   ├── register.tsx           # Registration
│   │   └── problem-details.tsx    # Problem details
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── config/                # API & Supabase config
│   │   ├── constants/             # Categories, statuses
│   │   ├── contexts/              # Auth & Language context
│   │   ├── services/              # API services
│   │   ├── types/                 # TypeScript types
│   │   └── utils/                 # Helper functions
│   ├── .env                       # Environment variables
│   ├── app.json                   # Expo configuration
│   └── package.json               # Dependencies
│
├── backend/                        # Node.js backend API
│   ├── src/
│   │   ├── config/                # Supabase configuration
│   │   ├── controllers/           # Request handlers
│   │   ├── routes/                # API routes
│   │   │   ├── sms.js            # SMS notification routes
│   │   │   └── ai.routes.js      # AI analysis routes
│   │   ├── services/
│   │   │   └── sms.service.js    # SMS integration (Fast2SMS/TextLocal)
│   │   └── server.js              # Express server
│   ├── database/
│   │   └── nagrikseva_citizen_v2.sql  # Database schema
│   └── package.json
│
├── government-dashboard/           # Government web portal
│   ├── index.html                 # Main dashboard (single-page app)
│   ├── supabase.js               # Supabase client
│   ├── index-backup.html          # Backup version
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── build.yml              # CI/CD pipeline
│
├── GOVERNMENT_DASHBOARD_REDESIGN_COMPLETE.md
├── SMS_SYSTEM_COMPLETE.md
├── PRIVACY_POLICY.md
├── TERMS_OF_SERVICE.md
└── README.md                       # This file
```

---

## 🔧 Tech Stack

### Mobile App
- **React Native** - Cross-platform mobile framework
- **Expo SDK 54** - Development tooling & services
- **TypeScript** - Type-safe development
- **NativeWind** - Tailwind CSS for React Native
- **Expo Router** - File-based navigation
- **Expo Location** - GPS & location services
- **Expo Image Picker** - Camera & gallery access

### Backend API
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase Client** - Database & auth SDK
- **Fast2SMS / TextLocal** - SMS gateway integration

### Database & Auth
- **Supabase (PostgreSQL)** - Primary database
- **Row-Level Security (RLS)** - Database-level security
- **JWT Authentication** - Secure token-based auth
- **Supabase Storage** - Image hosting

### Government Dashboard
- **HTML5 / CSS3 / JavaScript** - Single-page application
- **Tailwind CSS** - Utility-first styling
- **Leaflet.js** - Interactive maps
- **Leaflet MarkerCluster** - Hotspot visualization
- **Chart.js** - Analytics charts (planned)

### External Services
- **OpenStreetMap** - Location search (FREE)
- **Fast2SMS** - SMS notifications (India)
- **TextLocal** - Alternative SMS provider
- **Expo Application Services** - App builds

---

## 🎨 Design System

### Typography
- **Headings**: Crimson Text (serif) - 18-36px, Bold
- **Body**: IBM Plex Sans (sans-serif) - 14-16px, Regular
- **Technical**: JetBrains Mono (monospace) - 12-14px, Medium
- **Hindi**: Noto Sans Devanagari

### Colors
- **Government Primary**: Navy Blue (#0F4A85)
- **Government Accent**: Saffron (#FF9933)
- **Success/Solved**: Green (#16A34A)
- **Warning/Pending**: Amber (#F59E0B)
- **Danger/Breached**: Red (#DC2626)
- **In Progress**: Blue (#3B82F6)

### UI Patterns
- Card-based layouts with subtle shadows
- Rounded corners (8-16px)
- Gradient headers (tricolor for government)
- SVG icons (no emojis in dashboard)
- Clean white backgrounds
- Color-coded status badges

---

## 🔒 Security Features

### Database Security
- **Row-Level Security (RLS)** - User can only see their own data
- **JWT Authentication** - Secure token-based sessions
- **API Key Protection** - Environment variables for secrets
- **SQL Injection Prevention** - Parameterized queries

### Application Security
- **Input Sanitization** - XSS prevention
- **Content Moderation** - Banned words filtering
- **Rate Limiting** - Prevent API abuse (planned)
- **HTTPS Only** - Encrypted data transmission
- **Secure Storage** - Encrypted local storage

### Privacy
- **Minimal Data Collection** - Only essential information
- **No Third-party Tracking** - Privacy-focused
- **Data Retention Policy** - Clear deletion rules
- **User Consent** - Explicit permission for location/camera

---

## 📊 Database Schema

### Main Tables

#### `users`
- User profiles and authentication
- Activity statistics (problems posted, helping, solved)
- Contact information

#### `problems`
- Civic issue reports
- Images, location, category, description
- Status tracking (posted → being_helped → solved)
- AI analysis results

#### `problem_helpers`
- Help offers from citizens/officers
- Assignment tracking

#### `alerts`
- In-app notifications
- SMS delivery status

#### `problem_comments`
- Communication between citizens and officers

### Key Features
- Automatic profile creation on signup
- Trigger-based notification system
- Real-time subscriptions
- Public image storage buckets
- Automatic stats updates

---

## 📱 SMS Integration

### Supported Providers
1. **Fast2SMS** (Recommended for India)
   - Website: https://www.fast2sms.com
   - Cost: ~₹0.15-0.20 per SMS
   - API: REST

2. **TextLocal** (Alternative)
   - Website: https://www.textlocal.in
   - Cost: Similar pricing
   - API: REST

### Configuration
```javascript
// backend/src/services/sms.service.js
this.isDemoMode = true;  // Set to false for production
this.apiKey = process.env.FAST2SMS_API_KEY;
```

### Environment Variables
```bash
FAST2SMS_API_KEY=your-api-key-here
TEXTLOCAL_API_KEY=your-backup-key
```

### SMS Features
- Officer assignment notifications
- Escalation alerts
- Bulk messaging
- Delivery status tracking
- Automatic retry on failure

---

## 🚀 Deployment

### Mobile App (Expo)
```bash
cd mobile

# Development build
npx expo start

# Production build
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Backend API (Node.js)
```bash
# Deploy to any Node.js hosting:
# - Heroku
# - Railway.app
# - Render.com
# - DigitalOcean App Platform

cd backend
npm install
npm start
```

### Government Dashboard
```bash
# Deploy to any static hosting:
# - Vercel
# - Netlify
# - GitHub Pages
# - Firebase Hosting

cd government-dashboard
# Upload index.html + supabase.js
```

---

## 💰 Cost Breakdown

### Free Tier (0-50K users)
- Supabase: $0/month
- Expo: $0/month
- Backend Hosting: $0-5/month (Railway/Render)
- **Total: $0-5/month**

### Production (50K+ users)
- Supabase Pro: $25/month
- Expo: $0/month
- Backend Hosting: $7-25/month
- SMS: ~$20-100/month (usage-based)
- **Total: $52-150/month**

### One-time Costs
- Google Play Console: $25 (lifetime)
- Apple Developer Program: $99/year
- Domain name: $10-15/year

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration & login
- [ ] Post problem with photos
- [ ] GPS location detection
- [ ] Manual location search
- [ ] View problem feed
- [ ] Filter and sort issues
- [ ] Offer help
- [ ] Mark as solved
- [ ] Notifications
- [ ] Profile editing
- [ ] Government dashboard login
- [ ] Map view with pins
- [ ] SMS sending (demo mode)
- [ ] Officer assignment
- [ ] AI recommendations

### Device Testing
- [ ] Android 10+
- [ ] iOS 13+
- [ ] Different screen sizes
- [ ] Low-end devices
- [ ] Slow network (3G)

---

## 📈 Roadmap

### ✅ Phase 1: MVP (Current)
- User authentication
- Post problems with images
- GPS location
- Government dashboard
- SMS notifications
- Real-time updates
- Map view
- AI image analysis

### 🚧 Phase 2: Enhanced Features
- [ ] Comments on problems
- [ ] Upvoting/downvoting
- [ ] Badges and leaderboards
- [ ] Verified helpers
- [ ] Advanced AI recommendations
- [ ] Dark mode
- [ ] Offline mode improvements

### 📅 Phase 3: Scale & Integration
- [ ] Government API integration
- [ ] Analytics & reporting
- [ ] Multi-city customization
- [ ] Admin panel
- [ ] Moderation tools
- [ ] Third-party API

### � Phase 4: Advanced Features
- [ ] Video uploads
- [ ] Live streaming for urgent issues
- [ ] Chatbot support
- [ ] Voice commands
- [ ] Augmented reality for problem visualization

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Test on real devices before submitting
- Update documentation
- Add comments for complex logic
- Follow security best practices

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Lead Developer**: [Your Name]
- **UI/UX Design**: [Designer Name]
- **Support**: support@janmitra.app

---

## 🙏 Acknowledgments

- **Supabase** - Excellent backend-as-a-service platform
- **Expo** - Simplified React Native development
- **OpenStreetMap** - Free geolocation services
- **Fast2SMS** - Reliable SMS gateway for India
- **Community** - All citizens and officials making their communities better

---

## 📞 Contact

- **Email**: support@janmitra.app
- **Website**: https://janmitra.app
- **GitHub**: https://github.com/yourusername/janmitra
- **Twitter**: @janmitra
- **LinkedIn**: /company/janmitra

---

## 🌟 Show Your Support

If you find this project helpful:
- ⭐ Star this repository
- 🐛 Report bugs via Issues
- 💡 Suggest features
- 📢 Share with others
- 🤝 Contribute code
- 📝 Improve documentation

---

## 🎯 Mission

**"Empowering citizens to report civic issues efficiently, enabling governments to respond effectively, building smarter and more livable communities."**

JanMitra bridges the gap between citizens and government through technology, creating transparent, accountable, and responsive civic infrastructure.

---

## 📸 Screenshots

### Mobile App
![Feed Screen](screenshots/feed.png)
![Post Problem](screenshots/post.png)
![Problem Details](screenshots/details.png)
![Map View](screenshots/map.png)

### Government Dashboard
![Analytics Dashboard](screenshots/dashboard-analytics.png)
![Geospatial Intelligence](screenshots/dashboard-map.png)
![Triage Queue](screenshots/dashboard-queue.png)

---

## 🔗 Important Links

- [Government Dashboard Documentation](GOVERNMENT_DASHBOARD_REDESIGN_COMPLETE.md)
- [SMS System Documentation](SMS_SYSTEM_COMPLETE.md)
- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)
- [API Documentation](API_DOCS.md) *(coming soon)*

---

**Made with ❤️ for citizens and governments**

**Ready to transform civic engagement? Let's build smarter communities together! 🚀**

---

*© 2024 JanMitra - All Rights Reserved*
