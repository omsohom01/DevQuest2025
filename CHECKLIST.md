# ✅ Votum Setup Checklist

Use this checklist to ensure everything is configured correctly before running the app.

---

## 📋 Pre-flight Checklist

### System Requirements
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (optional, `git --version`)
- [ ] Expo CLI installed globally (`npm install -g expo-cli`)
- [ ] Internet connection active

### Mobile Device (Choose One)
- [ ] **Option A**: Expo Go app installed on phone (iPhone/Android)
- [ ] **Option B**: Android Studio with emulator configured
- [ ] **Option C**: Xcode with iOS Simulator (Mac only)

---

## 🔧 Project Setup

### Installation
- [ ] Navigated to project folder in terminal
- [ ] Ran `npm install` successfully
- [ ] All dependencies installed without errors

### Environment
- [ ] `.env` file exists in project root
- [ ] `.env` contains all Firebase credentials
- [ ] `app.config.js` exists and configured

### Firebase Console
- [ ] Accessed Firebase Console (console.firebase.google.com)
- [ ] Project "votum-e304f" visible
- [ ] Logged in with correct Google account

---

## 🔥 Firebase Configuration

### Authentication
- [ ] Opened Authentication section
- [ ] Clicked "Get Started" (if needed)
- [ ] Enabled Email/Password sign-in method
- [ ] Saved authentication settings

### Firestore Database
- [ ] Created Firestore database
- [ ] Selected "Start in test mode"
- [ ] Chose database location/region
- [ ] Database shows "Active" status

### Security Rules
- [ ] Opened Firestore Rules tab
- [ ] Copied rules from FIREBASE_SETUP.md
- [ ] Pasted rules into editor
- [ ] Published rules successfully

---

## 🚀 Running the App

### First Run
- [ ] Opened terminal in project directory
- [ ] Ran `npm start`
- [ ] Metro bundler started successfully
- [ ] QR code displayed in terminal
- [ ] No error messages in terminal

### Device Connection
**If using phone:**
- [ ] Phone and computer on same WiFi network
- [ ] Expo Go app opened
- [ ] QR code scanned successfully
- [ ] App loading on phone

**If using emulator:**
- [ ] Emulator started and running
- [ ] Ran `npm run android` or `npm run ios`
- [ ] App building successfully
- [ ] App installed on emulator

---

## 🧪 Testing

### Authentication Test
- [ ] App shows login screen
- [ ] Clicked "Sign Up"
- [ ] Filled registration form
- [ ] Selected a role (Participant/Judge/Organizer)
- [ ] Successfully registered
- [ ] User appears in Firebase Console → Authentication

### Participant Test
- [ ] Logged in as Participant
- [ ] Opened drawer menu (hamburger icon ☰)
- [ ] Saw "New Submission" and "My Submissions"
- [ ] Submitted a test problem statement
- [ ] Submission appears in Firebase Console → Firestore → submissions

### Judge Test (needs Organizer to assign)
- [ ] Created Judge account
- [ ] Logged in as Judge
- [ ] Drawer shows "Review Submissions" and "My Evaluations"

### Organizer Test
- [ ] Created Organizer account
- [ ] Logged in as Organizer
- [ ] Saw Dashboard with statistics
- [ ] Viewed all submissions
- [ ] Successfully assigned judge to submission
- [ ] Changed submission status

### Complete Flow Test
- [ ] Participant submitted statement
- [ ] Organizer assigned judge
- [ ] Judge evaluated submission
- [ ] Organizer saw evaluation
- [ ] Participant saw updated status

---

## 🎨 UI Verification

### Visual Check
- [ ] Login screen shows Votum logo
- [ ] Colors are Deep Teal/Bright Blue
- [ ] Submit buttons are Vibrant Green
- [ ] Gradients visible on headers
- [ ] Icons display correctly
- [ ] Drawer menu slides smoothly

### Navigation Check
- [ ] Hamburger menu (☰) at top-left
- [ ] Drawer opens on tap
- [ ] Menu items visible
- [ ] User profile shows in drawer
- [ ] Back button works on detail screens
- [ ] Logout button in drawer footer

### Interaction Check
- [ ] Forms accept input
- [ ] Buttons respond to tap
- [ ] Scroll works smoothly
- [ ] Pull-to-refresh works
- [ ] Status badges show colors
- [ ] Loading indicators appear

---

## 📱 Platform Verification

### Test Each Platform (Optional)
- [ ] Works on iOS device/simulator
- [ ] Works on Android device/emulator
- [ ] Works in web browser (`npm run web`)
- [ ] Responsive on different screen sizes

---

## 🔍 Common Issue Checks

### If App Won't Start
- [ ] Terminal shows no errors
- [ ] Port 8081 is not blocked
- [ ] Firewall allows connection
- [ ] Antivirus not blocking

### If Can't Connect
- [ ] Phone and computer same network
- [ ] WiFi (not mobile data) on phone
- [ ] VPN disabled
- [ ] Terminal still running

### If Firebase Errors
- [ ] Internet connection working
- [ ] Firebase Console accessible
- [ ] `.env` file has correct values
- [ ] Authentication enabled
- [ ] Firestore created
- [ ] Security rules published

### If TypeScript Errors
- [ ] Ran `npm install`
- [ ] No missing dependencies
- [ ] `node_modules` folder exists
- [ ] Terminal restarted

---

## 📚 Documentation Check

### Files Exist
- [ ] README.md (main readme)
- [ ] HOW_TO_RUN.md
- [ ] QUICK_START.md
- [ ] FIREBASE_SETUP.md
- [ ] FEATURES.md
- [ ] PROJECT_SUMMARY.md
- [ ] This file (CHECKLIST.md)

### Files Read
- [ ] Read README.md
- [ ] Read HOW_TO_RUN.md
- [ ] Skimmed QUICK_START.md
- [ ] Reviewed FIREBASE_SETUP.md

---

## 🎯 Feature Verification

### Core Features Working
- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Drawer navigation
- [ ] Submission creation
- [ ] Submission listing
- [ ] Evaluation submission
- [ ] Status updates
- [ ] Judge assignment
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Real-time updates

---

## 🎉 Final Verification

### Ready for Demo
- [ ] All three user roles tested
- [ ] Complete flow tested
- [ ] UI looks professional
- [ ] No critical errors
- [ ] Firebase connected
- [ ] Real-time updates working

### Ready for Development
- [ ] Environment configured
- [ ] Development server runs
- [ ] Hot reload working
- [ ] Terminal shows logs
- [ ] Firebase Console accessible

---

## 📊 Status Summary

Count your checkmarks:

- **0-20**: Just getting started - keep going!
- **21-40**: Good progress - almost there!
- **41-60**: Excellent - nearly complete!
- **61-80**: Outstanding - ready to use!
- **81+**: Perfect - everything working!

---

## 🚨 If Issues Found

### Step 1: Check Error Messages
- Look at terminal output
- Check Firebase Console
- Review browser console (if web)

### Step 2: Review Documentation
- Re-read relevant section
- Check troubleshooting guides
- Verify all steps completed

### Step 3: Common Fixes
```powershell
# Clear cache and restart
npx expo start --clear

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# Check Firebase status
# Visit: console.firebase.google.com
```

### Step 4: Verify Setup
- Firebase project exists
- Authentication enabled
- Firestore created
- Security rules published
- `.env` file correct

---

## ✅ Completion

When ALL essential items are checked:

🎉 **Congratulations!** Your Votum app is fully configured and ready to use!

**Next Steps:**
1. Follow QUICK_START.md for testing
2. Create test accounts for all roles
3. Test complete workflow
4. Show off your app!

---

## 📝 Notes

Use this space for your own notes:

```
Date completed: _______________

Issues encountered:


Solutions found:


Custom modifications:


```

---

## 🔄 Quick Reference

**Start App**: `npm start`  
**Stop App**: `Ctrl+C` in terminal  
**Reload**: Press `r` in terminal  
**Clear Cache**: `npx expo start --clear`

**Firebase Console**: https://console.firebase.google.com/  
**Project**: votum-e304f

---

## ✨ You're All Set!

When this checklist is complete, you have a fully functional event management platform ready to use!

**Happy Testing!** 🚀
