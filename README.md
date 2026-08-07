# 🏛️ NagrikSeva - Citizen-to-Citizen Help Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-black.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

> **Empowering citizens to solve local civic problems together**

NagrikSeva (meaning "Citizen Service" in Hindi) is a mobile application that enables community members to report local civic issues and help each other solve them through direct peer-to-peer collaboration.

---

## 📱 Features

### For Problem Posters
- 📸 **Photo Upload** - Capture and upload up to 5 images
- 📍 **GPS Location** - Auto-detect or manually search any location
- 🏷️ **8 Categories** - Road, Water, Electricity, Garbage, Parks, Traffic, Infrastructure, Other
- 🔔 **Real-time Notifications** - Get notified when someone offers help
- 📊 **Track Status** - Monitor problems from posted → being helped → solved

### For Helpers
- 🗺️ **Browse Feed** - See all nearby problems
- 🔍 **Filter & Sort** - By category, status, distance, or time
- 🤝 **Offer Help** - Click "I Can Help" to volunteer
- 💬 **Direct Contact** - Call or message problem posters
- ✅ **Mark Solved** - Document solution with before/after photos

### For Everyone
- 🏆 **Contribution Stats** - Track problems posted, helping, and solved
- 🌍 **Map View** - See all problems on an interactive map
- 🔄 **Real-time Updates** - Live feed updates via Supabase
- 🎨 **Beautiful UI** - Modern, intuitive design with smooth animations

---

## 🎯 Why NagrikSeva?

### The Problem
- Government complaint systems are slow (weeks/months)
- Citizens feel helpless about local issues
- No transparency in problem resolution
- Communities lack connection and collective action

### The Solution
- **Peer-to-peer help** - Neighbors helping neighbors directly
- **Fast resolution** - Get help in hours/days, not months
- **Public transparency** - Everyone sees what's happening
- **Community building** - Creates social bonds and trust

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
│     + Expo      │
└────────┬────────┘
         │
         │ Direct Connection
         │
         ▼
┌─────────────────┐
│    Supabase     │
│  ┌───────────┐  │
│  │PostgreSQL │  │ ← Database
│  ├───────────┤  │
│  │   Auth    │  │ ← Authentication
│  ├───────────┤  │
│  │  Storage  │  │ ← Image Storage
│  ├───────────┤  │
│  │ Real-time │  │ ← Live Updates
│  └───────────┘  │
└─────────────────┘
```

### Tech Stack

**Mobile App:**
- React Native 0.81
- Expo 54
- TypeScript
- NativeWind (Tailwind CSS)
- Expo Router (navigation)
- Expo Location (GPS)
- Expo Image Picker (camera)

**Backend:**
- Supabase (PostgreSQL)
- Supabase Auth (JWT)
- Supabase Storage (images)
- Supabase Realtime (live updates)
- Row-Level Security (RLS)

**External Services:**
- OpenStreetMap (location search - FREE!)
- Expo Application Services (builds)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account (free)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/nagrikseva.git
cd nagrikseva
```

### 2. Set Up Supabase
```bash
# 1. Create project at https://supabase.com
# 2. Run database schema:
#    - Go to SQL Editor
#    - Copy/paste backend/database/nagrikseva_citizen_v2.sql
#    - Run query
# 3. Get API keys from Settings → API
```

### 3. Configure Mobile App
```bash
cd mobile
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
```

### 4. Run App
```bash
npx expo start
# Scan QR code with Expo Go app
```

---

## 📚 Documentation

- **[User Experience Analysis](USER_EXPERIENCE_ANALYSIS.md)** - Detailed UX breakdown
- **[Production Deployment Plan](PRODUCTION_READY_PLAN.md)** - Complete deployment guide
- **[Quick Start Deployment](QUICK_START_DEPLOYMENT.md)** - Deploy in 2 hours
- **[Privacy Policy](PRIVACY_POLICY.md)** - User privacy and data handling
- **[Terms of Service](TERMS_OF_SERVICE.md)** - Legal terms and conditions

---

## 🗂️ Project Structure

```
nagrikseva/
├── mobile/                      # React Native mobile app
│   ├── app/                     # Expo Router screens
│   │   ├── (tabs)/             # Tab navigation
│   │   │   ├── index.tsx       # Feed screen
│   │   │   ├── post.tsx        # Post problem
│   │   │   ├── activity.tsx    # User activity
│   │   │   ├── map.tsx         # Map view
│   │   │   └── profile.tsx     # User profile
│   │   ├── login.tsx           # Login screen
│   │   ├── register.tsx        # Registration
│   │   └── problem-details.tsx # Problem details
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── config/            # API & Supabase config
│   │   ├── constants/         # Categories, statuses
│   │   ├── contexts/          # Auth context
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Helper functions
│   ├── assets/                # Images, fonts
│   ├── .env                   # Environment variables
│   ├── app.json              # Expo configuration
│   ├── eas.json              # EAS build config
│   └── package.json          # Dependencies
│
├── backend/                   # Backend (optional - not used currently)
│   ├── database/             # Database schemas
│   │   └── nagrikseva_citizen_v2.sql
│   └── src/                  # Express server (future use)
│
├── .github/
│   └── workflows/
│       └── build.yml         # CI/CD pipeline
│
├── PRIVACY_POLICY.md         # Privacy policy
├── TERMS_OF_SERVICE.md       # Terms of service
├── USER_EXPERIENCE_ANALYSIS.md
├── PRODUCTION_READY_PLAN.md
├── QUICK_START_DEPLOYMENT.md
└── README.md                 # This file
```

---

## 🔒 Security

- **Row-Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based auth
- **Input Sanitization** - XSS prevention
- **Content Moderation** - Banned words filtering
- **Rate Limiting** - Prevent abuse
- **HTTPS Only** - Encrypted data transmission
- **Secure Storage** - Encrypted local storage

---

## 📊 Database Schema

### Tables
- **users** - User profiles and stats
- **problems** - Civic problem posts
- **problem_helpers** - Help offers
- **problem_comments** - Comments (future)
- **alerts** - Notifications

### Key Features
- Automatic user profile creation on signup
- Trigger-based notifications
- Automatic stats updates
- Real-time subscriptions
- Public storage for images

---

## 🎨 Design System

### Colors
- **Primary**: Green (#16A34A) - Help, growth, positivity
- **Status Colors**:
  - Yellow (#F59E0B) - Posted (waiting)
  - Blue (#3B82F6) - Being Helped (in progress)
  - Green (#10B981) - Solved (completed)

### Typography
- **Headings**: 18-24px, Bold
- **Body**: 15px, Regular
- **Captions**: 12-13px, Medium

### Components
- Card-based layouts
- Rounded corners (16-24px)
- Smooth shadows
- Gradient headers
- Emoji-based categories

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration
- [ ] User login
- [ ] Post problem with photos
- [ ] GPS location detection
- [ ] Manual location search
- [ ] View problem feed
- [ ] Filter and sort
- [ ] Offer help
- [ ] Mark as solved
- [ ] Notifications
- [ ] Profile editing

### Device Testing
- [ ] Android 10+
- [ ] iOS 13+
- [ ] Different screen sizes
- [ ] Low-end devices
- [ ] Slow network (3G)

---

## 📈 Roadmap

### Phase 1: MVP (Current)
- ✅ User authentication
- ✅ Post problems
- ✅ Browse feed
- ✅ Offer help
- ✅ Mark solved
- ✅ Notifications
- ✅ Map view

### Phase 2: Enhanced Features
- [ ] Comments on problems
- [ ] Upvoting/downvoting
- [ ] Badges and leaderboards
- [ ] Verified helpers
- [ ] Multi-language support
- [ ] Dark mode

### Phase 3: Community Features
- [ ] Events (cleanup drives)
- [ ] Donations for projects
- [ ] Government integration
- [ ] Analytics dashboard
- [ ] Community challenges

### Phase 4: Scale
- [ ] City-specific customization
- [ ] Admin panel
- [ ] Moderation tools
- [ ] Advanced analytics
- [ ] API for third parties

---

## 💰 Cost Breakdown

### Development (One-time)
- Development: Free (DIY) or $5,000-10,000 (hire)
- Google Play Console: $25
- Apple Developer: $99/year
- Domain: $10-15/year

### Running Costs (Monthly)
- **Free Tier** (0-50K users):
  - Supabase: $0
  - Expo: $0
  - Total: **$0/month**

- **Pro Tier** (50K+ users):
  - Supabase Pro: $25/month
  - Expo: $0
  - Total: **$25/month**

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
- Test on real devices
- Update documentation
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer**: [Your Name]
- **Designer**: [Designer Name]
- **Support**: support@nagrikseva.app

---

## 🙏 Acknowledgments

- **Supabase** - Amazing backend platform
- **Expo** - Simplified React Native development
- **OpenStreetMap** - Free location services
- **Community** - All the citizens making their neighborhoods better

---

## 📞 Contact

- **Email**: support@nagrikseva.app
- **Website**: https://nagrikseva.app
- **Twitter**: @nagrikseva
- **Instagram**: @nagrikseva

---

## 🌟 Show Your Support

If you find this project helpful, please:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share with others
- 🤝 Contribute code

---

## 📸 Screenshots

### Feed Screen
![Feed Screen](screenshots/feed.png)

### Post Problem
![Post Problem](screenshots/post.png)

### Problem Details
![Problem Details](screenshots/details.png)

### Activity
![Activity](screenshots/activity.png)

---

## 🎯 Mission

**"Empowering citizens to solve local problems together, building stronger, more connected communities."**

NagrikSeva is more than an app - it's a movement toward community self-reliance and civic empowerment.

---

**Made with ❤️ for citizens, by citizens**

---

## 🔗 Links

- [User Experience Analysis](USER_EXPERIENCE_ANALYSIS.md)
- [Production Deployment Guide](PRODUCTION_READY_PLAN.md)
- [Quick Start Guide](QUICK_START_DEPLOYMENT.md)
- [Privacy Policy](PRIVACY_POLICY.md)
- [Terms of Service](TERMS_OF_SERVICE.md)

---

**Ready to make a difference? Let's build better communities together! 🚀**
