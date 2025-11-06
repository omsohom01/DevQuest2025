# Profile Management Setup Guide

## Overview
The profile management system allows users to customize their profiles with pictures, names, and bio information. This resolves the "username not provided" error when creating hackathons.

## Features Implemented

### 1. Profile Screen
- **Location**: `screens/ProfileScreen.tsx`
- **Features**:
  - Upload profile picture from camera or gallery
  - Edit display name (required, min 2 characters)
  - Add bio (optional)
  - View email (read-only)
  - View role (read-only)
- **Validation**:
  - Name is required and must be at least 2 characters
  - Shows clear error messages
  - Prevents saving invalid data

### 2. Dynamic Drawer Menu
- **Location**: `navigation/CustomDrawerContent.tsx`
- **Features**:
  - Shows user's profile picture if uploaded
  - Displays dynamic user name
  - Falls back to role icon if no profile picture
  - Shows email and role badge
  - Gradient header with user info

### 3. Navigation Integration
- **Profile screen added to**:
  - Participant Drawer (hamburger menu)
  - Judge Drawer (hamburger menu)
  - Organizer Drawer (hamburger menu)
- **Access**: Tap hamburger menu → "My Profile"

### 4. Auth Context Enhancement
- **Location**: `contexts/AuthContext.tsx`
- **New Function**: `refreshUser()`
  - Fetches latest user data from Firestore
  - Updates local state
  - Persists to AsyncStorage
  - Called after profile updates

## How to Use

### Setting Up Your Profile

1. **Login to the app**
2. **Open the hamburger menu** (tap top-left icon)
3. **Tap "My Profile"**
4. **Add Profile Picture**:
   - Tap the camera icon
   - Choose "Take Photo" or "Choose from Gallery"
   - Picture uploads automatically
5. **Edit Your Name**:
   - Tap the name field
   - Enter your full name (min 2 characters)
6. **Add Bio** (optional):
   - Tap the bio field
   - Write a short description about yourself
7. **Tap "Save Profile"**

### Profile Updates in Real-Time
- After saving your profile, your name and picture appear in the drawer menu
- All screens that use your name will show the updated information
- No need to logout/login - changes apply immediately

## Technical Details

### Data Structure
```typescript
interface User {
    uid: string;
    email: string;
    role: UserRole;
    name: string;              // Required, min 2 chars
    profilePicUrl?: string;    // Optional, uploaded via expo-image-picker
    bio?: string;              // Optional
    createdAt: Date;
    updatedAt?: Date;
}
```

### Storage
- **User data**: Firestore `users` collection
- **Profile pictures**: Firebase Storage at `profile-pictures/{userId}`
- **Local cache**: AsyncStorage with key `@votum_user`

### Image Upload Process
1. User selects image using expo-image-picker
2. Image is uploaded to Firebase Storage
3. Download URL is stored in Firestore
4. URL is cached in AsyncStorage
5. Image loads from URL in all screens

### Validation Rules
- **Name**: 
  - Required field
  - Minimum 2 characters
  - Maximum 50 characters
- **Bio**: 
  - Optional
  - Maximum 500 characters
- **Profile Picture**: 
  - Optional
  - Accepts JPG, PNG formats

## Integration with Hackathon Creation

### Before (Error)
```
Error: "username not provided please update your profile"
```

### After (Fixed)
- Profile name is validated before hackathon creation
- If name exists, it's used as organizer name
- If missing, user is prompted to update profile
- Fallback to email if needed

### Validation in AddHackathonScreen
```typescript
if (!user?.name) {
    Alert.alert('Profile Required', 
        'Please update your profile with your name before creating a hackathon.');
    return;
}
```

## Common Issues & Solutions

### Issue: "Username not provided"
**Solution**: 
1. Open Profile screen
2. Add your name (required)
3. Save profile
4. Try creating hackathon again

### Issue: Profile picture not showing in drawer
**Solution**:
1. Check if image uploaded successfully
2. Close and reopen drawer
3. If still not showing, re-upload image

### Issue: Name not updating after save
**Solution**:
1. Check internet connection
2. Verify name is at least 2 characters
3. Check for error messages
4. Try saving again

## File Structure
```
DevQuest/
├── screens/
│   └── ProfileScreen.tsx          # Profile editing screen
├── contexts/
│   └── AuthContext.tsx            # Auth with refreshUser()
├── navigation/
│   ├── AppNavigator.tsx           # Profile added to all drawers
│   └── CustomDrawerContent.tsx   # Shows profile pic & name
└── types/
    └── index.ts                   # User interface with profile fields
```

## Testing Checklist

- [ ] Can open Profile screen from all three role drawers
- [ ] Can upload profile picture from camera
- [ ] Can upload profile picture from gallery
- [ ] Profile picture appears in drawer menu
- [ ] Name updates in drawer menu after save
- [ ] Name validation works (min 2 chars)
- [ ] Bio saves correctly
- [ ] Can create hackathon after setting name
- [ ] Profile persists after app restart
- [ ] Profile updates work offline (pending sync)

## Next Steps

### Potential Enhancements
1. **Image compression**: Reduce upload size for faster loading
2. **Crop/resize**: Allow users to crop profile pictures
3. **Bio formatting**: Add rich text support
4. **Social links**: Add fields for GitHub, LinkedIn, etc.
5. **Profile preview**: Show how profile looks to others
6. **Achievement badges**: Display user achievements
7. **Statistics**: Show submission count, ratings, etc.

## Support
If you encounter issues with profile management:
1. Check this guide first
2. Verify Firebase Storage rules allow uploads
3. Check Firestore security rules allow user document updates
4. Review console logs for detailed error messages
