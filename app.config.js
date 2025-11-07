import 'dotenv/config';

module.exports = ({ config }) => ({
  ...config,
  name: "Votum",
  slug: "votum",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/Votum.png",
  scheme: "votum",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
  },

  android: {
    package: "com.sohom.votum", // your unique ID
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/Votum.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0891b2",
        dark: {
          backgroundColor: "#1f2937",
        },
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow DevQuest to access camera for QR code scanning.",
      },
    ],
    "expo-web-browser",
  ],

  experiments: {
    reactCompiler: true,
  },

  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    eas: {
      projectId: "b12a6dcd-0358-4a86-bfc9-a0ecbfc134cf",
    },
  },
});
