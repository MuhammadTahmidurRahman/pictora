// Firebase configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:155732133141:web:c5646717494a496a6dd51c"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

let user = auth.currentUser;

window.onload = function() {
  // Check if user is logged in
  user = auth.currentUser;  // Always re-fetch current user on load
  if (!user) {
    window.location.href = "login.html"; // Redirect to login page if not logged in
  } else {
    // Display user profile data
    fetchUserProfile();
  }

  // Event listeners for buttons
  document.getElementById('edit-name-btn').addEventListener('click', showEditNameDialog);
  document.getElementById('delete-account-btn').addEventListener('click', showDeleteAccountDialog);
  document.getElementById('logout-btn').addEventListener('click', logout);
};

async function fetchUserProfile() {
  const userRef = database.ref('users/' + user.uid);
  const snapshot = await userRef.get();

  if (snapshot.exists()) {
    const userData = snapshot.val();
    
    // Display profile name
    document.getElementById('profile-name').textContent = userData.name || 'No Name';

    // Display email
    document.getElementById('profile-email').textContent = user.email || 'No Email';
    
    // Display profile picture if exists
    const profilePicture = document.getElementById('profile-picture');
    if (userData.photo) {
      profilePicture.src = userData.photo; // Set profile picture from Firebase
    } else {
      profilePicture.src = 'default-profile-pic.jpg'; // Default picture if none exists
    }
  } else {
    console.log('User data not found in database');
  }
}

async function updateDisplayName(newName) {
  try {
    await user.updateProfile({ displayName: newName });
    const userRef = database.ref('users/' + user.uid);
    await userRef.update({ name: newName });
  } catch (error) {
    alert('Error updating display name: ' + error.message);
  }
}

function showEditNameDialog() {
  const newName = prompt('Enter your new name:', user.displayName || '');
  if (newName && newName !== user.displayName) {
    updateDisplayName(newName);
  }
}

async function deleteAccount() {
  try {
    // Delete profile image from Firebase Storage if exists
    const userRef = database.ref('users/' + user.uid);
    const userData = (await userRef.get()).val();
    if (userData.photo) {
      const storageRef = storage.refFromURL(userData.photo);
      await storageRef.delete();
    }

    // Delete user data from Realtime Database
    await userRef.remove();

    // Delete user from Firebase Authentication
    await user.delete();
    alert('Your account has been deleted.');
    window.location.href = 'login.html'; // Redirect to login page
  } catch (error) {
    alert('Error deleting account: ' + error.message);
  }
}

function showDeleteAccountDialog() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    deleteAccount();
  }
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html'; // Redirect to login page
  });
}