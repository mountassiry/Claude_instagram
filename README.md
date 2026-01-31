# Family Circle

A secure, invite-only family photo and video sharing app built with React Native and Firebase. Share precious moments with your loved ones in a private, controlled environment.

## Features

### Core Features
- **Photo & Video Sharing**: Share photos and videos with your family
- **Instagram-like Feed**: Beautiful, familiar interface for viewing shared content
- **Likes & Comments**: Interact with family posts
- **Camera Integration**: Take photos/videos directly or choose from gallery

### Security & Privacy
- **Invite-Only Access**: No one can join without a valid invite code
- **Admin Controls**: Full control over who can access the family circle
- **User Management**: Activate/deactivate members, promote admins
- **Private by Design**: All content stays within your family

### Admin Features
- **Invite Code Management**: Generate and manage invite codes
- **Member Management**: View all members, change roles, remove users
- **Content Moderation**: Delete any inappropriate posts

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Platforms**: iOS, Android

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Expo Go app on your phone (for testing)

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - **Authentication**: Enable Email/Password sign-in
   - **Firestore Database**: Create in production mode
   - **Storage**: Set up Cloud Storage

4. Get your Firebase config:
   - Go to Project Settings > General > Your apps
   - Click "Add app" and select Web
   - Copy the firebaseConfig object

5. Update `src/config/firebase.ts` with your config:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Firestore Security Rules

Add these security rules to your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Helper function to check if user is active
    function isActive() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if isActive();
      allow create: if isActive();
      allow update: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    // Comments collection
    match /comments/{commentId} {
      allow read: if isActive();
      allow create: if isActive();
      allow delete: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    // Invites collection
    match /invites/{inviteId} {
      allow read: if isAdmin() || !resource.data.isUsed;
      allow create: if isAdmin();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }
  }
}
```

### Storage Security Rules

Add these rules to your Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null;
    }
  }
}
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd family-circle
```

2. Install dependencies:
```bash
npm install
```

3. Create the first invite code:
```bash
# Update the Firebase config in scripts/createFirstInvite.js first
node scripts/createFirstInvite.js
```

4. Start the development server:
```bash
npm start
# or
expo start
```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Building for Production

#### Android
```bash
expo build:android
# or with EAS Build
eas build --platform android
```

#### iOS
```bash
expo build:ios
# or with EAS Build
eas build --platform ios
```

## Project Structure

```
├── App.tsx                 # App entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── PostCard.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── EmptyState.tsx
│   ├── config/
│   │   ├── firebase.ts     # Firebase configuration
│   │   └── constants.ts    # App constants and theme
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/
│   │   ├── usePosts.ts     # Posts and comments hooks
│   │   ├── useInvites.ts   # Invite management hook
│   │   └── useUsers.ts     # User management hook
│   ├── navigation/
│   │   └── AppNavigator.tsx # Navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── main/
│   │   │   ├── FeedScreen.tsx
│   │   │   ├── CreatePostScreen.tsx
│   │   │   ├── CommentsScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── admin/
│   │       ├── ManageUsersScreen.tsx
│   │       └── InviteCodesScreen.tsx
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   └── utils/
│       └── helpers.ts      # Utility functions
├── scripts/
│   └── createFirstInvite.js # Bootstrap script
└── assets/                 # App icons and splash screen
```

## Usage Guide

### First-Time Setup

1. Run the `createFirstInvite.js` script to generate the first invite code
2. Register using the invite code - you'll automatically become an admin
3. Generate invite codes for family members from Settings > Invite Codes

### For Admins

- **Generate Invites**: Settings > Invite Codes > Create New Invite Code
- **Manage Members**: Settings > Manage Members
- **Deactivate Users**: Tap on a user > Deactivate User
- **Promote to Admin**: Tap on a user > Make Admin
- **Remove Users**: Tap on a user > Remove User (permanent)

### For All Members

- **View Feed**: Home tab shows all family posts
- **Create Post**: Tap the + tab, select photo/video, add caption
- **Like Posts**: Tap the heart icon on any post
- **Comment**: Tap the comment icon, type your comment
- **Delete Own Posts**: Tap the trash icon on your posts

## Security Considerations

- All data is stored in Firebase with security rules enforcing access control
- Only invited members can join the family circle
- Admins can deactivate or remove members at any time
- Deactivated users cannot log in or access any content
- Media is stored securely in Firebase Storage with access rules

## Customization

### Theming

Edit `src/config/constants.ts` to customize:
- Colors
- Spacing
- Font sizes
- Border radius
- Other UI constants

### App Name and Icons

1. Update `app.json` with your app name
2. Replace images in `assets/` folder:
   - `icon.png` (1024x1024)
   - `splash.png` (1284x2778)
   - `adaptive-icon.png` (1024x1024)

## Troubleshooting

### Common Issues

1. **"Invalid or expired invite code"**
   - Check that the code hasn't been used
   - Check that the code hasn't expired (7 days by default)

2. **"Account deactivated"**
   - Contact the admin to reactivate your account

3. **Images not loading**
   - Check Firebase Storage rules
   - Ensure the user is authenticated

4. **Push notifications not working**
   - Push notifications require additional setup with Firebase Cloud Messaging

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

## License

This project is private and intended for family use.
