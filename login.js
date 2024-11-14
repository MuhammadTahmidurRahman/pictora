import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistence set to local");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Function to handle Google login and check if user exists
window.loginWithGoogle = async function () {
  try {
    // Initiate Google Sign-In
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      // If user exists, proceed to the next step
      alert("Google sign-in successful");

      // Redirect to the create or join room page
      window.location.href = 'join_event.html';
    } else {
      // If user does not exist, sign out and redirect to signup page
      await signOut(auth);
      alert("User not registered. Redirecting to sign-up page.");
      window.location.href = 'signup.html';
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google. Redirecting to sign-up page.");
    window.location.href = 'signup.html';
  }
};

// Single onAuthStateChanged listener
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. Checking user status...");
  console.log("Current path:", window.location.pathname);
  if (user) {
    console.log("User is logged in:", user);
    // Redirect to join_event if logged in and not already there
    if (window.location.pathname === '/login.html') {
      window.location.href = 'join_event.html';
    }
  } else {
    console.log("User is not logged in.");
    // Redirect to signup if user is not logged in and not on login or signup pages
    if (window.location.pathname !== '/signup.html' && window.location.pathname !== '/login.html') {
      window.location.href = 'signup.html';
    }
  }
});
