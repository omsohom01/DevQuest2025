# Hackathon Management Feature

## Overview
The hackathon management feature allows organizers to create, view, and manage hackathons directly within the Votum app. This feature extends the platform beyond problem statement submissions to full event management.

## Features Implemented

### 1. Create Hackathon
**Screen:** `AddHackathonScreen.tsx`
- **Poster Upload:** Upload event poster image using expo-image-picker
- **Basic Information:**
  - Title (required)
  - Description (required)
  - Total Prize Pool (required)
- **Team Configuration:**
  - Minimum team size (default: 1)
  - Maximum team size (default: 4)
- **Event Mode:**
  - Online
  - Offline (requires venue)
  - Hybrid (requires venue)
- **Schedule:**
  - Registration start date
  - Registration end date
  - Event start date
  - Event end date
- **Tracks (Optional):**
  - Add multiple tracks with:
    - Track name
    - Track description
    - Individual prize pool (optional)
  - Dynamic add/remove functionality

### 2. Your Hackathons
**Screen:** `YourHackathonsScreen.tsx`
- **Features:**
  - List view of all hackathons created by organizer
  - Real-time updates from Firestore
  - Status badges (Upcoming, Ongoing, Past)
  - Card-based UI with:
    - Poster image or gradient placeholder
    - Title and description preview
    - Event date
    - Mode indicator (online/offline/hybrid)
    - Prize pool
    - Team size
    - Track count
  - Pull-to-refresh
  - Floating Action Button (FAB) to create new hackathon
  - Empty state with "Create Hackathon" button

### 3. Hackathon Details
**Screen:** `HackathonDetailScreen.tsx`
- **Information Sections:**
  - Header with poster/gradient
  - Status badge with icon (Upcoming/Ongoing/Past)
  - Organizer name
  - About section with full description
  - Key Details:
    - Total prize pool
    - Team size range
    - Mode (online/offline/hybrid)
    - Venue (if applicable)
  - Schedule Timeline:
    - Registration opens/closes
    - Event starts/ends
  - Tracks List:
    - Numbered track cards
    - Track name, description, and prize
- **Actions:**
  - Delete hackathon with confirmation dialog
  - Navigation back to list

### 4. Dashboard Integration
**Screen:** `OrganizerDashboardScreen.tsx`
- **New Section:** "Your Hackathons"
- **Features:**
  - Shows latest 3 hackathons
  - Compact card view with poster and key info
  - Status indicators
  - "View All" link to full hackathons list
  - Tap cards to view details
  - Empty state with "Create Hackathon" button

## Navigation Structure

### Updated OrganizerDrawer
```
- Dashboard
- All Submissions
- Your Hackathons (NEW)
```

### Updated OrganizerStack
```
- OrganizerDrawer
- SubmissionManagement
- AddHackathon (NEW)
- HackathonDetail (NEW)
```

## Data Model

### Hackathon Type
```typescript
interface Hackathon {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  posterUrl?: string;
  prizePool: number;
  teamSize: {
    min: number;
    max: number;
  };
  mode: 'online' | 'offline' | 'hybrid';
  venue?: string;
  schedule: {
    registrationStart: Date;
    registrationEnd: Date;
    eventStart: Date;
    eventEnd: Date;
  };
  tracks: HackathonTrack[];
  createdAt: Date;
  updatedAt: Date;
}
```

### HackathonTrack Type
```typescript
interface HackathonTrack {
  id: string;
  name: string;
  description: string;
  prizePool?: number;
}
```

### HackathonMode Type
```typescript
type HackathonMode = 'online' | 'offline' | 'hybrid';
```

## Firestore Collection

### Collection Name
`hackathons`

### Document Structure
```javascript
{
  organizerId: string,
  organizerName: string,
  title: string,
  description: string,
  posterUrl: string | null,
  prizePool: number,
  teamSize: {
    min: number,
    max: number
  },
  mode: 'online' | 'offline' | 'hybrid',
  venue: string | null,
  schedule: {
    registrationStart: Timestamp,
    registrationEnd: Timestamp,
    eventStart: Timestamp,
    eventEnd: Timestamp
  },
  tracks: Array<{
    id: string,
    name: string,
    description: string,
    prizePool?: number
  }>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Required Firestore Index
For the dashboard query (fetch latest hackathons by organizer):
```
Collection: hackathons
Fields:
  - organizerId (Ascending)
  - createdAt (Descending)
```

## Dependencies Added
- `expo-image-picker`: For poster upload functionality

## UI/UX Highlights

### Design Consistency
- Follows existing Votum design system
- Uses Deep Teal and Bright Blue gradients
- Consistent card-based layouts
- Professional shadow and elevation effects

### User Experience
- Real-time updates across all screens
- Status indicators for event timeline
- Intuitive date formatting
- Clear visual hierarchy
- Empty states with actionable CTAs
- Confirmation dialogs for destructive actions

### Responsive Elements
- Adaptive layouts for different screen sizes
- Scrollable content areas
- Touch-optimized buttons and cards
- Proper keyboard handling in forms

## Usage Flow

### For Organizers

1. **Create Hackathon:**
   - Navigate to "Your Hackathons" from drawer
   - Tap FAB or "Create Hackathon" button
   - Fill in all required details
   - Optionally upload poster
   - Add tracks if needed
   - Submit to create

2. **View Hackathons:**
   - Access from Dashboard's "Your Hackathons" section
   - Or navigate to "Your Hackathons" from drawer
   - Pull to refresh for latest data
   - Cards show status and key info

3. **View Details:**
   - Tap any hackathon card
   - View complete information
   - See timeline and tracks
   - Access delete option

4. **Delete Hackathon:**
   - Open hackathon details
   - Tap "Delete Hackathon" button
   - Confirm deletion in dialog

## Future Enhancements (Potential)
- Edit hackathon functionality
- Participant registration system
- Team management
- Submission tracking per hackathon
- Winner announcement
- Event analytics
- Email notifications
- QR code generation for event check-in
- Live leaderboard
- Judge assignment for hackathons
- Export participant lists
- Custom registration forms

## Testing Checklist
- [ ] Create hackathon with all fields
- [ ] Create hackathon with minimal fields
- [ ] Upload poster image
- [ ] Add multiple tracks
- [ ] Remove tracks
- [ ] Test online/offline/hybrid modes
- [ ] Verify venue requirement for offline/hybrid
- [ ] Check date formatting
- [ ] Verify status badges (Upcoming/Ongoing/Past)
- [ ] Test pull-to-refresh
- [ ] Navigate from dashboard cards
- [ ] Navigate from full list
- [ ] View hackathon details
- [ ] Delete hackathon
- [ ] Test empty states
- [ ] Verify real-time updates
- [ ] Test navigation flow

## Files Modified/Created

### Created
1. `screens/organizer/AddHackathonScreen.tsx` - Create hackathon form
2. `screens/organizer/YourHackathonsScreen.tsx` - List of hackathons
3. `screens/organizer/HackathonDetailScreen.tsx` - Hackathon details view
4. `HACKATHON_FEATURE.md` - This documentation

### Modified
1. `types/index.ts` - Added Hackathon, HackathonTrack, HackathonMode types
2. `navigation/AppNavigator.tsx` - Added hackathon screens to navigation
3. `screens/organizer/OrganizerDashboardScreen.tsx` - Added hackathon section
4. `package.json` - Added expo-image-picker dependency

## Notes
- All dates are stored as Firestore Timestamps and converted to JavaScript Date objects
- Poster URLs can be optional (gradient fallback used)
- Track prizes are optional per track
- Venue is conditionally required based on mode
- Status is calculated dynamically based on current date vs event dates
- Real-time listeners ensure data stays fresh across all screens
