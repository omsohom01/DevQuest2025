# Votum - Event Problem Statement Submission Platform

A cross-platform (iOS/Android) mobile application built with React Native and Expo for collecting, reviewing, and shortlisting problem ideas for college events and hackathons.

## Features

### 🎯 Three User Roles

1. **Participant/Team** - Submit problem statements and track their status
2. **Judge/Mentor** - Review and evaluate submissions
3. **Organizer/Admin** - Manage all submissions and assign judges

### 🎨 Modern UI Design

- **Color Scheme**: Deep Teal (#0891b2) and Bright Blue (#3b82f6) as primary colors
- **Success Actions**: Vibrant Green (#10b981)
- **Drawer Navigation**: Hamburger menu for easy section navigation
- **Responsive Design**: Optimized for mobile devices

### 📱 Participant Features

- **Submission Form**: Submit new problem statements with:
  - Title
  - Detailed Problem Description
  - Significance/Impact
  - Unique Highlights
- **My Submissions**: View all submitted statements with status
- **Submission Details**: Read-only view of submission with current status

### 👨‍⚖️ Judge Features

- **Review List**: View all assigned submissions
- **Evaluation Screen**: 
  - Score submissions (1-10 scale)
  - Provide detailed feedback
  - Shortlist recommendation (YES/NO toggle)
- **Judge History**: View all completed evaluations

### 👑 Organizer Features

- **Master Dashboard**: 
  - Total submissions count
  - Total reviewed count
  - Statistics by status
- **All Submissions**: 
  - Master list with filtering by status
  - Search functionality
- **Submission Management**:
  - View full submission details
  - Set/change submission status
  - Assign judges to submissions

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication & Firestore)
- **Navigation**: React Navigation (Drawer & Stack)
- **UI Components**: 
  - Expo Linear Gradient
  - React Native Gesture Handler
  - Vector Icons
  - Slider & Picker components

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Expo Go app on your physical device (optional)

## Installation

1. **Clone the repository**
   ```bash
   cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   The `.env` file is already configured with Firebase credentials. If you need to update them:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firebase Setup**

   In your Firebase Console:
   - Enable Email/Password authentication
   - Create a Firestore database with the following collections:
     - `users` (stores user profiles with role)
     - `submissions` (stores problem statements)
     - `evaluations` (stores judge evaluations)

## Running the App

### Start the development server
```bash
npm start
```

### Run on Android
```bash
npm run android
```

### Run on iOS (Mac only)
```bash
npm run ios
```

### Run on Web
```bash
npm run web
```

## Project Structure

```
DevQuest/
├── config/
│   └── firebase.ts          # Firebase configuration
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── navigation/
│   ├── AppNavigator.tsx     # Main navigation setup
│   └── CustomDrawerContent.tsx  # Custom drawer sidebar
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── participant/
│   │   ├── SubmissionFormScreen.tsx
│   │   ├── MySubmissionsScreen.tsx
│   │   └── SubmissionDetailScreen.tsx
│   ├── judge/
│   │   ├── ReviewListScreen.tsx
│   │   ├── EvaluationScreen.tsx
│   │   └── JudgeHistoryScreen.tsx
│   └── organizer/
│       ├── OrganizerDashboardScreen.tsx
│       ├── AllSubmissionsScreen.tsx
│       └── SubmissionManagementScreen.tsx
├── types/
│   └── index.ts             # TypeScript type definitions
├── constants/
│   └── theme.ts             # Color theme configuration
├── .env                     # Environment variables
├── app.json                 # Expo configuration
└── package.json             # Project dependencies
```

## User Registration

When registering a new user:
1. Choose your role from the dropdown:
   - **Participant/Team**: For submitting problem statements
   - **Judge/Mentor**: For reviewing submissions
   - **Organizer/Admin**: For managing the entire platform

## Firestore Security Rules

Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.teamId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer');
      allow delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer';
    }
    
    // Evaluations collection
    match /evaluations/{evaluationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'judge';
      allow update, delete: if request.auth.uid == resource.data.judgeId;
    }
  }
}
```

## Features Walkthrough

### For Participants:
1. Sign up with email and password (choose "Participant/Team" role)
2. Navigate to "New Submission" from the drawer menu
3. Fill in all required fields and submit
4. View your submissions in "My Submissions"
5. Tap on any submission to see full details and status

### For Judges:
1. Sign up with email and password (choose "Judge/Mentor" role)
2. Wait for an organizer to assign submissions to you
3. View assigned submissions in "Review Submissions"
4. Tap on a submission to evaluate it
5. Provide score (1-10), feedback, and shortlist recommendation
6. Check "My Evaluations" to see your evaluation history

### For Organizers:
1. Sign up with email and password (choose "Organizer/Admin" role)
2. View overall statistics on the Dashboard
3. Browse "All Submissions" with search and filter options
4. Tap any submission to manage it:
   - Change submission status
   - Assign a judge
   - View all evaluations for that submission

## Troubleshooting

### Firebase Connection Issues
- Ensure your `.env` file has correct Firebase credentials
- Check that Firebase services are enabled in Firebase Console
- Verify internet connection

### App Won't Start
```bash
# Clear cache and restart
expo start --clear
```

### Build Issues
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Support

For issues or questions, please contact the development team.

## Version

**v1.0.0** - Initial Release

---

Built with ❤️ using React Native and Expo
