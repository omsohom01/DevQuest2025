# 🚀 Votum - How to Run Your App

## Prerequisites Check ✅

Before starting, make sure you have:
- [ ] Node.js installed (v16+)
- [ ] npm or yarn installed
- [ ] A smartphone OR Android Studio/Xcode
- [ ] Internet connection

## Method 1: Run on Your Phone (EASIEST) 📱

### Step 1: Install Expo Go
- **iPhone**: Download "Expo Go" from App Store
- **Android**: Download "Expo Go" from Google Play Store

### Step 2: Start the Server
Open PowerShell and run:
```powershell
cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"
npm start
```

Wait for the QR code to appear in the terminal.

### Step 3: Scan QR Code
- **iPhone**: Open Camera app → Point at QR code → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR Code" → Scan

### Step 4: Wait for App to Load
The app will download and open automatically (30-60 seconds first time)

---

## Method 2: Run on Android Emulator 🤖

### Prerequisites:
1. Install Android Studio from: https://developer.android.com/studio
2. Set up an Android Virtual Device (AVD)

### Steps:
```powershell
# Navigate to project
cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"

# Start Android emulator (from Android Studio)
# Then run:
npm run android
```

The app will automatically build and install on the emulator.

---

## Method 3: Run on iOS Simulator (Mac Only) 🍎

### Prerequisites:
1. Install Xcode from Mac App Store
2. Install Xcode Command Line Tools

### Steps:
```bash
cd /path/to/DevQuest
npm run ios
```

---

## Method 4: Run in Web Browser 🌐

```powershell
cd "C:\Users\Sohom Roy\OneDrive\Desktop\DevQuest"
npm run web
```

Your default browser will open automatically.
**Note**: Some mobile features may not work in web version.

---

## Troubleshooting 🔧

### Problem: "Command not found: expo"
**Solution**:
```powershell
npm install -g expo-cli
```

### Problem: "Cannot connect to Metro bundler"
**Solution**:
```powershell
# Clear cache and restart
npx expo start --clear
```

### Problem: "Network error" on phone
**Solution**:
- Ensure phone and computer are on SAME WiFi network
- Disable VPN if active
- Try tunnel mode: `npm start --tunnel`

### Problem: App shows white screen
**Solution**:
- Wait 30-60 seconds for first load
- Check terminal for errors
- Restart: Press 'r' in terminal

### Problem: "Firebase error"
**Solution**:
- Check `.env` file exists
- Verify Firebase project is active
- Check internet connection

### Problem: Dependencies error
**Solution**:
```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

---

## Quick Commands Reference 📝

| Command | Action |
|---------|--------|
| `npm start` | Start development server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS (Mac only) |
| `npm run web` | Run in browser |
| `r` | Reload app (press in terminal) |
| `m` | Toggle menu (press in terminal) |
| `Ctrl+C` | Stop server |

---

## First Time Setup Checklist ✅

1. [ ] Node.js installed → `node --version`
2. [ ] Project dependencies installed → `npm install`
3. [ ] `.env` file exists with Firebase config
4. [ ] Firebase project created and configured
5. [ ] Expo Go app installed on phone (if using phone)
6. [ ] Terminal open in project folder
7. [ ] Internet connection active

---

## Development Mode Features 🛠️

When running `npm start`, press these keys in terminal:

- **r** - Reload app
- **m** - Toggle menu
- **d** - Open developer menu on device
- **shift+d** - Toggle dev tools
- **j** - Open debugger

---

## Testing Accounts 👥

Create these test accounts to try all features:

### Organizer
- Email: `admin@votum.com`
- Password: `admin123`
- Role: Organizer/Admin

### Judge
- Email: `judge@votum.com`
- Password: `judge123`
- Role: Judge/Mentor

### Participant
- Email: `team@votum.com`
- Password: `team123`
- Role: Participant/Team

---

## What You Should See 👀

### On Terminal:
```
› Metro waiting on exp://192.168.1.x:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)

› Press a │ open Android
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### On Phone:
1. Splash screen with Votum logo
2. Login screen with email/password fields
3. Beautiful gradient design
4. Deep teal and blue colors

---

## Performance Tips 💡

✅ **Do**:
- Use actual device for best performance
- Keep terminal window visible
- Use Metro bundler when possible (default)

❌ **Avoid**:
- Closing terminal while app is open
- Using VPN (can cause connection issues)
- Running multiple instances

---

## Need More Help? 📚

Check these files in your project:
1. `QUICK_START.md` - Step-by-step testing guide
2. `VOTUM_README.md` - Complete documentation
3. `FEATURES.md` - Feature list

---

## Success! 🎉

If you see the login screen with the Votum logo and beautiful gradient colors, YOU'RE ALL SET!

Now follow `QUICK_START.md` to test all features.

---

**Pro Tip**: Keep the terminal open and visible while developing. All logs and errors appear there!
