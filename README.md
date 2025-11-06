# 🎯 Votum - Event Problem Statement Submission Platform

> A modern, cross-platform mobile app for managing problem statement submissions for college events and hackathons.

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

</div>

---

## 📱 What is Votum?

Votum replaces email and documents for collecting, reviewing, and shortlisting problem ideas. It provides:

- **For Participants**: Easy submission and status tracking
- **For Judges**: Streamlined evaluation workflow
- **For Organizers**: Complete platform management

---

## ✨ Key Features

🎨 **Modern UI** - Deep Teal & Bright Blue theme with Vibrant Green accents  
🔐 **Secure Auth** - Firebase authentication with role-based access  
📊 **Real-time Updates** - Live status changes and notifications  
🎯 **Three User Roles** - Participant, Judge, and Organizer workflows  
📱 **Cross-platform** - Works on iOS, Android, and Web  
🍔 **Drawer Navigation** - Hamburger menu for easy navigation  

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
```

### 2. Start the App
```powershell
npm start
```

### 3. Run on Device
- **Phone**: Scan QR code with Expo Go app
- **Android**: `npm run android`
- **iOS**: `npm run ios` (Mac only)
- **Web**: `npm run web`

📖 **Detailed Instructions**: See [HOW_TO_RUN.md](./HOW_TO_RUN.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[HOW_TO_RUN.md](./HOW_TO_RUN.md)** | 🚀 How to start and run the app |
| **[QUICK_START.md](./QUICK_START.md)** | 🎯 Step-by-step testing guide |
| **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** | 🔥 Firebase configuration guide |
| **[FEATURES.md](./FEATURES.md)** | ✅ Complete feature list (150+) |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | 📊 Project overview and stats |
| **[VOTUM_README.md](./VOTUM_README.md)** | 📖 Technical documentation |

---

## 👥 User Roles

### 1️⃣ Participant/Team
- Submit problem statements
- Track submission status
- View detailed feedback

### 2️⃣ Judge/Mentor
- Review assigned submissions
- Evaluate with scores (1-10)
- Provide feedback and recommendations

### 3️⃣ Organizer/Admin
- View master dashboard
- Manage all submissions
- Assign judges
- Update submission status

---

## 🎨 Screenshots

> Beautiful, modern UI with professional gradients and smooth animations

### Login & Dashboard
- Gradient splash screen
- Clean authentication forms
- Statistics dashboard

### Submission & Evaluation
- Easy-to-use forms
- Status badges
- Score sliders

### Management
- Search and filters
- Judge assignment
- Real-time updates

---

## 🔧 Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Firebase (Auth + Firestore)
- **Navigation**: React Navigation (Drawer + Stack)
- **Language**: TypeScript
- **UI**: Linear Gradients, Vector Icons
- **State**: Context API

---

## 📂 Project Structure

```
DevQuest/
├── config/           # Firebase configuration
├── contexts/         # Auth context
├── navigation/       # App navigation setup
├── screens/          # All app screens
│   ├── auth/        # Login, Register
│   ├── participant/ # Submission screens
│   ├── judge/       # Evaluation screens
│   └── organizer/   # Management screens
├── types/           # TypeScript definitions
└── constants/       # Theme and colors
```

---

## 🔥 Firebase Setup

### Quick Setup (5 minutes):

1. **Enable Authentication**
   - Go to Firebase Console
   - Enable Email/Password auth

2. **Create Firestore Database**
   - Start in test mode
   - Collections auto-create

3. **Add Security Rules**
   - Copy rules from [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Publish

✅ **Done!** Full guide: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

## 🧪 Testing

### Create Test Accounts:

```
Organizer:
  Email: admin@votum.com
  Password: admin123

Judge:
  Email: judge@votum.com
  Password: judge123

Participant:
  Email: team@votum.com
  Password: team123
```

📖 **Testing Guide**: [QUICK_START.md](./QUICK_START.md)

---

## 📊 Statistics

- **12 Screens** - Complete app flow
- **3 User Roles** - Distinct permissions
- **150+ Features** - Fully featured platform
- **3 Firebase Collections** - users, submissions, evaluations
- **5 Status Types** - Complete workflow
- **Cross-platform** - iOS, Android, Web

---

## 🎯 Use Cases

Perfect for:
- College Hackathons
- University Events
- Innovation Competitions
- Startup Pitch Events
- Research Proposals
- Idea Management

---

## ✅ Requirements Met

### All Specifications Implemented:
- ✅ Cross-platform (iOS/Android)
- ✅ React Native + Expo
- ✅ Firebase Auth + Firestore
- ✅ Deep Teal/Bright Blue theme
- ✅ Vibrant Green for submit
- ✅ Hamburger menu navigation
- ✅ Three user role workflows
- ✅ Real-time updates
- ✅ Professional modern UI
- ✅ Environment variable security

### Bonus Features:
- ✅ Dark mode support
- ✅ Pull-to-refresh
- ✅ Search & filter
- ✅ TypeScript type safety
- ✅ Comprehensive docs
- ✅ Professional animations

---

## 🚧 Troubleshooting

### Common Issues:

**App won't start?**
```powershell
npx expo start --clear
```

**Firebase errors?**
- Check `.env` file exists
- Verify Firebase Console setup
- Check internet connection

**TypeScript errors?**
```powershell
npm install
```

📖 **More help**: [HOW_TO_RUN.md](./HOW_TO_RUN.md#troubleshooting-)

---

## 📱 Running the App

### Development Mode:
```powershell
cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"
npm start
```

### Commands:
- `npm start` - Start development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS (Mac)
- `npm run web` - Run in browser
- `r` (in terminal) - Reload app
- `Ctrl+C` - Stop server

---

## 🔐 Security

- Firebase credentials in `.env` (not in git)
- Role-based access control
- Firestore security rules
- Input validation
- Secure authentication

---

## 📄 License

This project was created for educational purposes.

---

## 🙏 Acknowledgments

Built with:
- React Native & Expo
- Firebase
- React Navigation
- TypeScript
- Love and dedication ❤️

---

## 📞 Support

For questions or issues:
1. Check documentation files above
2. Review Firebase Console
3. Check terminal error messages
4. Verify setup steps completed

---

## 🎉 Ready to Go!

Your complete event management platform is ready!

1. **Read**: [HOW_TO_RUN.md](./HOW_TO_RUN.md) to start
2. **Follow**: [QUICK_START.md](./QUICK_START.md) to test
3. **Setup**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for backend
4. **Explore**: [FEATURES.md](./FEATURES.md) to see what's included

---

<div align="center">

### Made with ❤️ using React Native & Firebase

**Votum v1.0.0** - November 2025

[🚀 Get Started](./HOW_TO_RUN.md) • [📖 Documentation](./VOTUM_README.md) • [✨ Features](./FEATURES.md)

</div>