# NagrikSeva Mobile App

A citizen-centric mobile application for reporting, tracking, and prioritizing local civic issues.

## Features

### Citizen Features
- 📸 Capture photo/video of issues
- 🏷️ Choose category and add description
- 📍 Auto location via GPS
- ⚡ Prioritize urgent issues
- 📊 Track complaint status in real-time
- 🗺️ View nearby government offices
- 👍 Upvote issues
- 🔔 Push notifications on updates

### Screens
- **Home**: Dashboard with quick actions and service categories
- **Raise Complaint**: Submit new service requests with photos, location, and priority
- **Track Status**: Monitor all your requests with timeline view
- **Nearby Offices**: Find government offices near you with directions
- **Alerts**: Notifications for status updates
- **Profile**: User profile and settings

## Tech Stack
- React Native with Expo
- Expo Router for navigation
- NativeWind (Tailwind CSS) for styling
- TypeScript for type safety
- Axios for API calls
- Expo Location for GPS
- Expo Image Picker for photos

## Getting Started

```bash
# Install dependencies
npm install

# Start the app
npx expo start
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── requests.tsx   # Track status
│   │   ├── alerts.tsx     # Notifications
│   │   └── profile.tsx    # User profile
│   ├── raise-complaint.tsx
│   ├── nearby-offices.tsx
│   ├── complaint-details.tsx
│   ├── login.tsx
│   └── register.tsx
├── src/
│   ├── components/ui/     # Reusable UI components
│   ├── config/           # API configuration
│   ├── constants/        # Categories, priorities
│   ├── contexts/         # Auth context
│   ├── services/         # API services
│   └── types/            # TypeScript types
└── assets/               # Images and fonts
```

## Color Theme
- Primary: Green (#16A34A)
- Background: Gray (#F9FAFB)
- Text: Dark Gray (#111827)
