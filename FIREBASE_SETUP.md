# 🔥 Firebase Setup Guide for Votum

## Current Status

Your Firebase project **votum-e304f** is already created and configured in the app. This guide explains what needs to be set up in Firebase Console.

---

## Step 1: Access Firebase Console

1. Go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. You should see project: **votum-e304f**
4. Click on the project to open it

---

## Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in left sidebar
2. Click **Get Started** (if first time)
3. Click **Sign-in method** tab
4. Find **Email/Password** in the list
5. Click on it → Toggle **Enable** → Click **Save**

✅ **Email/Password authentication is now enabled!**

---

## Step 3: Create Firestore Database

1. Click **Firestore Database** in left sidebar
2. Click **Create database** button
3. Select **Start in test mode** (for development)
4. Choose your **location** (e.g., us-central)
5. Click **Enable**

✅ **Firestore database created!**

### Collections Will Auto-Create

The app will automatically create these collections:
- `users` - When first user registers
- `submissions` - When first submission is made
- `evaluations` - When first evaluation is submitted

**You don't need to create them manually!**

---

## Step 4: Set Up Security Rules (IMPORTANT!)

1. In **Firestore Database**, click **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if isSignedIn();
      // Users can only write their own profile
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      // Anyone authenticated can read submissions
      allow read: if isSignedIn();
      
      // Participants can create submissions
      allow create: if isSignedIn();
      
      // Participants can update their own submissions
      // Organizers can update any submission
      allow update: if isSignedIn() && (
        request.auth.uid == resource.data.teamId || 
        getUserRole() == 'organizer'
      );
      
      // Only organizers can delete
      allow delete: if isSignedIn() && getUserRole() == 'organizer';
    }
    
    // Evaluations collection
    match /evaluations/{evaluationId} {
      // Anyone authenticated can read evaluations
      allow read: if isSignedIn();
      
      // Only judges can create evaluations
      allow create: if isSignedIn() && getUserRole() == 'judge';
      
      // Judges can update their own evaluations
      allow update: if isSignedIn() && request.auth.uid == resource.data.judgeId;
      
      // Only organizers can delete
      allow delete: if isSignedIn() && getUserRole() == 'organizer';
    }
  }
}
```

3. Click **Publish** button

✅ **Security rules are now set!**

---

## Step 5: Verify Configuration

### Check Environment Variables

Your `.env` file should contain:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDQoemiFVZylMc8DVbVOakUu3cQL7hv3E8
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=votum-e304f.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=votum-e304f
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=votum-e304f.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=735283844617
EXPO_PUBLIC_FIREBASE_APP_ID=1:735283844617:web:b5dc8d19800dafe9388ad8
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-LWGWCB921G
```

✅ **Already configured in your project!**

---

## Step 6: Test the Connection

1. Start your app: `npm start`
2. Try to register a new user
3. Check Firebase Console → Authentication
4. You should see the new user appear!

✅ **If you see the user, Firebase is working!**

---

## Firebase Console Quick Reference

### Viewing Users
1. Go to **Authentication** → **Users** tab
2. See all registered users with their email and creation date

### Viewing Submissions
1. Go to **Firestore Database** → **Data** tab
2. Click on `submissions` collection
3. See all problem statements

### Viewing Evaluations
1. Go to **Firestore Database** → **Data** tab
2. Click on `evaluations` collection
3. See all judge evaluations

---

## Common Firebase Issues & Solutions

### Issue: "Firebase: Error (auth/network-request-failed)"
**Solution**: Check your internet connection

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Verify `.env` file has correct API key

### Issue: "Insufficient permissions"
**Solution**: 
1. Check Firestore Rules are published
2. Ensure user is authenticated
3. Verify user has correct role

### Issue: "Users can't register"
**Solution**:
1. Check Authentication is enabled
2. Verify Email/Password is enabled
3. Check internet connection

### Issue: "Data not appearing in Firestore"
**Solution**:
1. Check Firestore database is created
2. Verify security rules allow writes
3. Check app is connected to internet

---

## Security Best Practices

### ✅ Do:
- Keep `.env` file private (already in `.gitignore`)
- Use the provided security rules
- Regularly check Firebase Console for suspicious activity
- Enable email verification for production (optional)

### ❌ Don't:
- Share Firebase credentials publicly
- Use "test mode" rules in production
- Allow unauthenticated access

---

## Production Deployment Checklist

When ready for production:

1. [ ] Switch Firestore from test mode to production mode
2. [ ] Review and update security rules if needed
3. [ ] Enable email verification (optional)
4. [ ] Set up Firebase Hosting for admin panel (optional)
5. [ ] Configure Firebase Analytics (optional)
6. [ ] Set up Cloud Functions for notifications (optional)
7. [ ] Enable Firebase Performance Monitoring (optional)

---

## Firebase Pricing

**Current Setup**: FREE tier ✅

The free tier includes:
- ✅ Unlimited authentication
- ✅ 50,000 reads/day (Firestore)
- ✅ 20,000 writes/day (Firestore)
- ✅ 1 GB storage
- ✅ 10 GB/month data transfer

**This is MORE than enough for a college event!**

---

## Monitoring Usage

### Check Firebase Usage:
1. Go to Firebase Console
2. Click **Usage and billing** in left sidebar
3. See your usage statistics

### What to Monitor:
- **Reads**: Each time data is fetched
- **Writes**: Each time data is saved
- **Storage**: Total data stored

---

## Backup & Export

### Export Data (Optional):
1. Go to **Firestore Database** → **Import/Export** tab
2. Click **Export**
3. Choose a Cloud Storage bucket
4. Select collections to export

---

## Additional Firebase Features (Optional)

### For Future Enhancement:

1. **Cloud Functions**: Automated backend tasks
   - Send email notifications
   - Auto-assign judges based on workload
   - Generate reports

2. **Cloud Storage**: File uploads
   - Store problem statement attachments
   - Store user profile pictures

3. **Firebase Analytics**: Track usage
   - User engagement
   - Popular features
   - App performance

4. **Cloud Messaging**: Push notifications
   - Notify on new assignments
   - Status change alerts
   - Evaluation reminders

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Guide**: https://firebase.google.com/docs/firestore
- **Auth Guide**: https://firebase.google.com/docs/auth
- **Console**: https://console.firebase.google.com

---

## Quick Troubleshooting Commands

### Check if Firebase is accessible:
```javascript
// In your browser console on Firebase Console
console.log('Firebase accessible!');
```

### Test authentication in app:
1. Try to register a new user
2. Check Firebase Console → Authentication
3. User should appear

### Test Firestore in app:
1. Register and login
2. Submit a problem statement
3. Check Firebase Console → Firestore Database
4. Submission should appear

---

## ✅ Setup Complete!

Once you've completed Steps 1-4, your Firebase backend is fully configured and ready to use!

**Your checklist**:
- [x] Firebase project created (votum-e304f)
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules published
- [ ] Test user registered successfully

**When all checkboxes are marked, you're ready to go!** 🚀

---

## Need Help?

If you encounter issues:
1. Check this guide first
2. Review error messages in app terminal
3. Check Firebase Console for errors
4. Verify internet connection
5. Ensure all steps were completed

**Firebase is now ready for Votum!** 🎉
