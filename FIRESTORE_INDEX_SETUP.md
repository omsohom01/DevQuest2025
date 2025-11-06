# Firestore Index Setup

## Required Composite Index

The hackathon feature requires a composite index on the `hackathons` collection to enable efficient querying.

## How to Create the Index

### Option 1: Click the Auto-Generated Link (Easiest)

When you see the error in your console, it includes a link. Click this link:

```
https://console.firebase.google.com/v1/r/project/votum-e304f/firestore/indexes?create_composite=Ck5wcm9qZWN0cy92b3R1bS1lMzA0Zi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvaGFja2F0aG9ucy9pbmRleGVzL18QARoPCgtvcmdhbml6ZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
```

This will take you directly to Firebase Console with the index configuration pre-filled. Just click **"Create Index"**.

### Option 2: Manual Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **votum-e304f**
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **"Create Index"**
5. Configure the index as follows:

**Collection ID:** `hackathons`

**Fields to index:**
- `organizerId` - Ascending
- `createdAt` - Descending

6. Click **"Create Index"**

## What This Index Does

This composite index enables the query in `OrganizerDashboardScreen` that fetches the latest 3 hackathons created by the current organizer:

```typescript
query(
  collection(db, 'hackathons'),
  where('organizerId', '==', user?.uid),
  orderBy('createdAt', 'desc'),
  limit(3)
)
```

## Index Build Time

- The index typically takes **a few minutes** to build
- For larger datasets, it may take longer
- You can check the status in the Firebase Console → Firestore → Indexes tab
- The status will show: **Building** → **Enabled**

## After Index is Created

1. Wait for the index status to show **"Enabled"**
2. Restart your Expo development server:
   ```powershell
   npx expo start --clear
   ```
3. The error should no longer appear
4. The hackathon dashboard will load successfully

## Troubleshooting

### Error Still Appears
- Verify the index is **Enabled** (not Building)
- Check you're using the correct Firebase project
- Clear Expo cache: `npx expo start --clear`
- Restart your app completely

### Wrong Project
If the link opens a different Firebase project:
1. Make sure you're logged into the correct Google account
2. Manually navigate to your project in Firebase Console
3. Create the index using Option 2 (Manual Setup)

## Additional Indexes You May Need

If you expand the hackathon feature further, you might need additional indexes for queries like:

### Query by Status and Date
```
Collection: hackathons
Fields:
  - status (Ascending)
  - eventStart (Descending)
```

### Query by Mode
```
Collection: hackathons
Fields:
  - mode (Ascending)
  - eventStart (Descending)
```

Firebase will show error messages with auto-generated links when these are needed.
