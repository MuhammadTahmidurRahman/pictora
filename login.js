import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. Checking user status...");
  if (user) {
    console.log("User is logged in:", user);
    // If user is logged in, we should be redirected to join_event
    if (window.location.pathname === '/login.html') {
      console.log("Redirecting to join_event...");
      window.location.href = 'join_event.html'; // Redirect to event page
    }
  } else {
    console.log("User is not logged in. Staying on login page.");
    // If the user is not logged in, do not redirect.
  }
});


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
//const auth = getAuth(app);
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

onAuthStateChanged(auth, (user) => {
  console.log("Current path:", window.location.pathname);
  console.log("User object:", user);

  if (user) {
    console.log("User is signed in:", user);
    if (window.location.pathname !== '/join_event.html') {
      window.location.href = 'join_event.html';
    }
  } else {
    console.log("User is signed out");
    if (window.location.pathname !== '/signup.html' && window.location.pathname !== '/login.html') {
      window.location.href = 'signup.html';
    }
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user);

    // Only redirect if not already on 'join_event.html'
    if (window.location.pathname !== '/join_event.html') {
      window.location.href = 'join_event.html';
    }
  } else {
    // User is signed out
    console.log("User is signed out");

    // Redirect to 'signup.html' only if not on 'signup.html' or 'login.html'
    if (window.location.pathname !== '/signup.html' && window.location.pathname !== '/login.html') {
      window.location.href = 'signup.html';
    }
  }
});
