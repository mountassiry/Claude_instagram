/**
 * Script to create the first invite code for bootstrapping the app
 *
 * This script should be run once to create the initial invite code
 * that allows the first user (admin) to register.
 *
 * Usage:
 * 1. Set up your Firebase project and update the config in src/config/firebase.ts
 * 2. Install dependencies: npm install
 * 3. Run this script: node scripts/createFirstInvite.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration - UPDATE THESE VALUES
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Generate a random invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createFirstInvite() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Generate invite code
    const code = generateInviteCode();

    // Set expiry to 30 days for the first invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create the invite document
    const inviteData = {
      code,
      createdBy: 'system', // System-generated for bootstrap
      createdAt: new Date(),
      isUsed: false,
      expiresAt,
    };

    await addDoc(collection(db, 'invites'), inviteData);

    console.log('\n========================================');
    console.log('First invite code created successfully!');
    console.log('========================================\n');
    console.log(`Invite Code: ${code}`);
    console.log(`Expires: ${expiresAt.toLocaleDateString()}`);
    console.log('\nUse this code to register the first user.');
    console.log('The first user will automatically become an admin.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating invite:', error);
    process.exit(1);
  }
}

createFirstInvite();
