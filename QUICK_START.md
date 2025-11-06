# 🚀 Votum - Quick Start Guide

## Step 1: Start the Development Server

Open your terminal and run:

```powershell
cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"
npm start
```

This will start the Expo development server. You'll see a QR code and several options.

## Step 2: Run the App

### Option A: On Your Phone (Easiest)
1. Install **Expo Go** app from:
   - iOS: App Store
   - Android: Google Play Store
2. Scan the QR code from your terminal with:
   - iOS: Camera app
   - Android: Expo Go app
3. The app will load on your phone!

### Option B: On Android Emulator
```powershell
npm run android
```
Make sure Android Studio is installed with an emulator configured.

### Option C: On iOS Simulator (Mac Only)
```powershell
npm run ios
```

## Step 3: Test the App

### Create Test Accounts

1. **First User - Organizer**
   - Tap "Sign Up"
   - Name: Admin User
   - Email: admin@votum.com
   - Password: admin123
   - Role: Organizer/Admin
   - Tap "Sign Up"

2. **Second User - Judge**
   - Sign out (open drawer → Logout)
   - Tap "Sign Up"
   - Name: Judge User
   - Email: judge@votum.com
   - Password: judge123
   - Role: Judge/Mentor
   - Tap "Sign Up"

3. **Third User - Participant**
   - Sign out
   - Tap "Sign Up"
   - Name: Team Leader
   - Email: team@votum.com
   - Password: team123
   - Role: Participant/Team
   - Tap "Sign Up"

### Test Participant Flow

1. **As Participant (team@votum.com)**:
   - Open hamburger menu (☰) at top left
   - Tap "New Submission"
   - Fill in:
     - Title: "Smart Campus Parking System"
     - Description: "A system to find and reserve parking spots in real-time"
     - Significance: "Reduces time wasted searching for parking"
     - Highlights: "Uses IoT sensors and AI prediction"
   - Tap green "Submit" button
   - Open drawer → "My Submissions" to see your submission

### Test Organizer Flow

2. **As Organizer (admin@votum.com)**:
   - Sign out and login as admin@votum.com
   - View Dashboard - see 1 total submission
   - Open drawer → "All Submissions"
   - Tap on the submission
   - In "Assign Judge" section:
     - Select "Judge User" from dropdown
     - Tap "Assign Judge" button
   - Change status to "Under Review" if desired

### Test Judge Flow

3. **As Judge (judge@votum.com)**:
   - Sign out and login as judge@votum.com
   - You'll see 1 submission in "Review Submissions"
   - Tap on the submission
   - Scroll down to evaluation form:
     - Score: Slide to 8
     - Feedback: "Excellent idea with practical implementation"
     - Shortlist: Toggle to YES
   - Tap green "Submit Evaluation" button
   - Open drawer → "My Evaluations" to see your completed review

### Verify Complete Flow

4. **Back to Organizer**:
   - Sign out and login as admin@votum.com
   - Dashboard now shows 1 reviewed
   - Go to All Submissions → tap submission
   - See the judge's evaluation
   - Change status to "Shortlisted"

5. **Back to Participant**:
   - Sign out and login as team@votum.com
   - Go to "My Submissions"
   - See updated status: "Shortlisted" ✓

## Navigation Guide

### Hamburger Menu (☰)
Located at top-left corner. Opens drawer with all sections:

**Participant**:
- 📝 New Submission
- 📄 My Submissions

**Judge**:
- 📋 Review Submissions
- ✅ My Evaluations

**Organizer**:
- 📊 Dashboard
- 📚 All Submissions

### Status Colors
- 🟡 **Yellow**: Pending Review
- 🔵 **Blue**: Under Review
- 🟣 **Purple**: Shortlisted
- 🟢 **Green**: Selected
- 🔴 **Red**: Not Selected

## Troubleshooting

### "Cannot connect to server"
- Make sure `npm start` is running
- Check your WiFi connection
- On phone, ensure you're on same network as computer

### "Firebase error"
- Verify `.env` file exists with credentials
- Check internet connection
- Ensure Firebase project is active

### App won't start
```powershell
# Clear cache
npx expo start --clear

# Or reset completely
rm -rf node_modules
npm install
npm start
```

### White screen on app
- Wait 30 seconds for initial load
- Check terminal for error messages
- Restart with `npm start --clear`

## Firebase Setup (First Time Only)

If you haven't set up Firebase yet:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. The project "votum-e304f" should already exist
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Create Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in test mode
   - Choose your region
5. Security Rules are needed - see VOTUM_README.md

## Tips for Best Experience

✅ **Do's**:
- Keep terminal window open while testing
- Test on actual device for best performance
- Fill all form fields (they're all required)
- Use the drawer menu to navigate

❌ **Don'ts**:
- Don't close terminal while app is running
- Don't use special characters in emails
- Don't submit empty forms
- Don't expect instant updates (pull to refresh)

## Next Steps

1. ✅ Start the app
2. ✅ Create test accounts
3. ✅ Test all three user roles
4. ✅ Submit a problem statement
5. ✅ Assign and evaluate
6. ✅ Check status updates

## Need Help?

- Check VOTUM_README.md for detailed documentation
- Review Firebase Console for database issues
- Check terminal for error messages
- Ensure all dependencies are installed

---

🎉 **You're all set!** Open that hamburger menu and start exploring Votum!
