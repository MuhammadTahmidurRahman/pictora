// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase config
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Check if the user is logged in using onAuthStateChanged
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. User:", user); // Debugging
  if (user) {
    // User is logged in, fetch and display profile data
    fetchUserProfile(user);
  } else {
    // No user is logged in, redirect to login page
    window.location.href = "login.html";
  }
});

// Fetch and display user profile data from Firebase
async function fetchUserProfile(user) {
  console.log("Fetching user profile for:", user.uid); // Debugging
  const userRef = ref(database, 'users/' + user.uid);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();
    console.log("User data fetched:", userData); // Debugging

    // Display profile name
    document.getElementById('profile-name').textContent = userData.name || 'No Name';
    document.getElementById('profile-email').textContent = user.email || 'No Email';

    // Display the profile picture if it exists
    const profilePicture = document.getElementById('profile-picture');
    if (userData.photo) {
      // If a photo URL exists in Firebase, set it as the profile picture
      profilePicture.src = userData.photo;
    } else {
      // Otherwise, show a default profile picture
      profilePicture.src = 'default-profile-pic.jpg';
    }

    // Show the profile container after fetching data
    document.getElementById('profile-container').style.display = 'block';
  } else {
    console.log('User data not found in database');
  }
}

// Update the user's display name
async function updateDisplayName(newName) {
  try {
    await auth.currentUser.updateProfile({ displayName: newName });

    const userRef = ref(database, 'users/' + auth.currentUser.uid);
    await update(userRef, { name: newName });
  } catch (error) {
    alert('Error updating display name: ' + error.message);
  }
}

// Event listeners for buttons
document.getElementById('edit-name-btn').addEventListener('click', showEditNameDialog);
document.getElementById('delete-account-btn').addEventListener('click', showDeleteAccountDialog);
document.getElementById('logout-btn').addEventListener('click', logout);

// Show dialog to edit name
function showEditNameDialog() {
  const newName = prompt('Enter your new name:', auth.currentUser.displayName || '');
  if (newName && newName !== auth.currentUser.displayName) {
    updateDisplayName(newName);
  }
}

// Delete user account
async function deleteAccount() {
  try {
    // Delete user profile image from Firebase Storage if it exists
    const userRef = ref(database, 'users/' + auth.currentUser.uid);
    const userData = (await get(userRef)).val();

    if (userData.photo) {
      const photoRef = storageRef(storage, userData.photo);
      await deleteObject(photoRef);
    }

    // Remove user data from Realtime Database
    await remove(userRef);

    // Delete the user from Firebase Authentication
    await auth.currentUser.delete();
    alert('Your account has been deleted.');

    // Redirect to login page after account deletion
    window.location.href = 'login.html';
  } catch (error) {
    alert('Error deleting account: ' + error.message);
  }
}

// Confirm and delete the account
function showDeleteAccountDialog() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    deleteAccount();
  }
}

// Log out the user
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html'; // Redirect to login page
  });
}
