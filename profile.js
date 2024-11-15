// Import necessary Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  signOut,
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import {
  getDatabase,
  ref as dbRef,
  get,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
    authDomain: "pictora-7f0ad.firebaseapp.com",
    projectId: "pictora-7f0ad",
    storageBucket: "pictora-7f0ad.appspot.com",
    messagingSenderId: "155732133141",
    databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app/",
    appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();
const storage = getStorage();

// DOM elements
const profileImage = document.getElementById("profileImage");
const nameField = document.getElementById("profileName");
const emailField = document.getElementById("profileEmail");
const editButton = document.getElementById("editButton");
const deleteButton = document.getElementById("deleteButton");
const logoutButton = document.getElementById("logoutButton");

// Fetch user profile data
function fetchUserProfile() {
  const user = auth.currentUser;
  if (user) {
    const userRef = dbRef(database, `users/${user.uid}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          profileImage.src = userData.photo || 'default_profile.png'; // Use a default image if not available
          nameField.textContent = userData.name || 'No Name';
          emailField.textContent = user.email || 'No Email';
        } else {
          console.error("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
      });
  } else {
    console.error("User not authenticated");
  }
}

// Listen for auth state changes and fetch profile data if logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchUserProfile();
  } else {
    console.error("User not logged in");
    window.location.href = "login.html"; // Redirect to login if not authenticated
  }
});

// Edit name logic
editButton.addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated");
    return;
  }

  const newName = prompt("Enter your new name:");
  if (newName) {
    updateProfile(user, { displayName: newName })
      .then(() => {
        const userRef = dbRef(database, `users/${user.uid}`);
        update(userRef, { name: newName })
          .then(() => {
            fetchUserProfile(); // Refresh profile data
          })
          .catch((error) => {
            console.error("Error updating database name:", error);
          });
      })
      .catch((error) => {
        console.error("Error updating profile:", error);
      });
  }
});

// Logout logic
logoutButton.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html"; // Redirect to login
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});
