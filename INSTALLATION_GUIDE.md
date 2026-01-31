# Family Circle - Complete Installation Guide

This guide will walk you through every step to get the Family Circle app running on your Android and iPhone devices.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Install Development Tools](#2-install-development-tools)
3. [Set Up Firebase](#3-set-up-firebase)
4. [Configure the App](#4-configure-the-app)
5. [Install Dependencies](#5-install-dependencies)
6. [Create Your First Invite Code](#6-create-your-first-invite-code)
7. [Run on Your Devices](#7-run-on-your-devices)
8. [Build for Production](#8-build-for-production)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### On Your Computer
- [ ] **Operating System**: Windows 10+, macOS 10.15+, or Linux
- [ ] **Internet connection**: Required for downloads and Firebase

### On Your Phone
- [ ] **Android**: Version 6.0 (API 23) or higher
- [ ] **iPhone**: iOS 13.0 or higher

---

## 2. Install Development Tools

### Step 2.1: Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS version** (recommended)
3. Run the installer and follow the prompts
4. Verify installation by opening Terminal/Command Prompt:
   ```bash
   node --version    # Should show v18.x.x or higher
   npm --version     # Should show 9.x.x or higher
   ```

### Step 2.2: Install Expo CLI
Open Terminal/Command Prompt and run:
```bash
npm install -g expo-cli eas-cli
```

### Step 2.3: Create an Expo Account
1. Go to https://expo.dev/signup
2. Create a free account
3. Remember your username and password

### Step 2.4: Install Expo Go on Your Phones

#### Android:
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the app by Expo Project
4. Open the app and sign in with your Expo account

#### iPhone:
1. Open App Store
2. Search for "Expo Go"
3. Install the app by Expo Project
4. Open the app and sign in with your Expo account

---

## 3. Set Up Firebase

### Step 3.1: Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `family-circle` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional, not needed)
6. Click **Create project**
7. Wait for project creation, then click **Continue**

### Step 3.2: Enable Authentication
1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Click on **Email/Password** provider
4. Toggle **Enable** to ON
5. Click **Save**

### Step 3.3: Create Firestore Database
1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode**
4. Choose a location closest to you (e.g., `us-central1`)
5. Click **Enable**

### Step 3.4: Set Up Firestore Security Rules
1. In Firestore Database, click the **Rules** tab
2. Delete the existing rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isActive() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }

    match /posts/{postId} {
      allow read: if isActive();
      allow create: if isActive();
      allow update: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    match /comments/{commentId} {
      allow read: if isActive();
      allow create: if isActive();
      allow delete: if isActive() && (resource.data.userId == request.auth.uid || isAdmin());
    }

    match /invites/{inviteId} {
      allow read: if isAdmin() || !resource.data.isUsed;
      allow create: if isAdmin();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }
  }
}
```

3. Click **Publish**

### Step 3.5: Set Up Firebase Storage
1. Click **Storage** in the left sidebar
2. Click **Get started**
3. Click **Start in production mode**
4. Click **Next**, then **Done**

### Step 3.6: Set Up Storage Security Rules
1. In Storage, click the **Rules** tab
2. Replace with:

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

3. Click **Publish**

### Step 3.7: Get Your Firebase Configuration
1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll down to "Your apps" section
4. Click the **Web icon** (`</>`)
5. Enter app nickname: `family-circle-web`
6. Click **Register app**
7. You'll see a code block with `firebaseConfig`. **Copy these values**:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

---

## 4. Configure the App

### Step 4.1: Navigate to Project Directory
```bash
cd /path/to/Claude_instagram
```

### Step 4.2: Update Firebase Configuration
1. Open the file `src/config/firebase.ts` in a text editor
2. Replace the placeholder values with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

---

## 5. Install Dependencies

### Step 5.1: Install Node Packages
Open Terminal in the project directory and run:
```bash
npm install
```

This will take a few minutes to download all required packages.

### Step 5.2: Verify Installation
```bash
npx expo doctor
```

Fix any issues that are reported.

---

## 6. Create Your First Invite Code

### Step 6.1: Update the Script Configuration
1. Open `scripts/createFirstInvite.js`
2. Update the Firebase config with your values (same as Step 4.2)
3. Save the file

### Step 6.2: Run the Script
```bash
node scripts/createFirstInvite.js
```

### Step 6.3: Save the Invite Code
- The script will output an invite code like: `ABC12DEF`
- **Write this down!** You'll need it to register as the first admin user

---

## 7. Run on Your Devices

### Step 7.1: Start the Development Server
```bash
npm start
```

This will display a QR code in your terminal and open Expo DevTools.

### Step 7.2: Connect Your Android Phone
1. Make sure your phone is on the **same WiFi network** as your computer
2. Open the **Expo Go** app on your Android
3. Tap **"Scan QR code"**
4. Scan the QR code from your terminal
5. Wait for the app to load (first time takes longer)

### Step 7.3: Connect Your iPhone
1. Make sure your phone is on the **same WiFi network** as your computer
2. Open your iPhone's **Camera app**
3. Point it at the QR code in your terminal
4. Tap the notification that appears to open in Expo Go
5. Wait for the app to load

### Step 7.4: Register Your Account
1. On the app's welcome screen, tap **"Create Account"**
2. Enter the invite code you saved from Step 6.3
3. Fill in your name, email, and password
4. Tap **"Create Account"**
5. You are now the admin!

### Step 7.5: Invite Family Members
1. Go to **Settings** (gear icon)
2. Tap **"Invite Codes"**
3. Tap **"Create New Invite Code"**
4. Share the code with your family member
5. They install Expo Go and scan your QR code
6. They register using the invite code you gave them

---

## 8. Build for Production

When you're ready to distribute the app without Expo Go:

### Option A: Build with EAS (Recommended)

#### Step 8.1: Login to Expo
```bash
eas login
```

#### Step 8.2: Configure Build
```bash
eas build:configure
```

#### Step 8.3: Build for Android
```bash
eas build --platform android --profile production
```

This creates an APK/AAB file you can install directly or publish to Play Store.

#### Step 8.4: Build for iOS
```bash
eas build --platform ios --profile production
```

Note: iOS builds require an Apple Developer account ($99/year).

### Option B: Development Build (Testing)

For a standalone app that doesn't need Expo Go:

```bash
# Android
eas build --platform android --profile development

# iOS
eas build --platform ios --profile development
```

---

## 9. Troubleshooting

### Problem: "Network request failed" or can't connect
**Solutions:**
- Ensure phone and computer are on the same WiFi
- Try pressing `w` to open web version first to test
- Restart the Expo server: `npm start -- --clear`

### Problem: "Firebase: Error (auth/configuration-not-found)"
**Solutions:**
- Double-check your Firebase config values
- Ensure Authentication is enabled in Firebase Console

### Problem: "Permission denied" in Firestore
**Solutions:**
- Verify security rules are published correctly
- Check that the user is authenticated

### Problem: App crashes on startup
**Solutions:**
```bash
# Clear cache and restart
npm start -- --clear

# Or reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### Problem: Camera not working
**Solutions:**
- Grant camera permissions when prompted
- On iOS, check Settings > Privacy > Camera
- On Android, check Settings > Apps > Expo Go > Permissions

### Problem: Invite code not working
**Solutions:**
- Codes are case-sensitive (use uppercase)
- Check if code has expired (7 days by default)
- Verify the code hasn't been used already

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm start -- --clear` | Start with cache cleared |
| `npm start -- --android` | Start and open on Android |
| `npm start -- --ios` | Start and open on iOS |
| `eas build --platform android` | Build Android APK |
| `eas build --platform ios` | Build iOS app |
| `eas submit` | Submit to app stores |

---

## Support

If you encounter issues:
1. Check the [Expo documentation](https://docs.expo.dev)
2. Check the [Firebase documentation](https://firebase.google.com/docs)
3. Search for error messages on Stack Overflow

---

Happy sharing with your family! 📸👨‍👩‍👧‍👦
