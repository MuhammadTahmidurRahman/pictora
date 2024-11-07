import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// Function to handle Google login and check if user exists
window.loginWithGoogle = async function () {
  try {
    // Initiate Google Sign-In
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user email is registered in Firebase Authentication
    const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);

    // If no sign-in methods exist for this email, the user is not registered
    if (signInMethods.length === 0) {
      alert("You are not registered. Please sign up first.");
      window.location.href = 'signup.html'; // Redirect to the sign-up page
      return;
    }

    // If email is registered, proceed to the create or join room page
    alert("Google sign-in successful");
    window.location.href = 'createorjoinroom.html'; // Redirect to create or join room page
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google.");
  }
};

// Handle user authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user);
  } else {
    // User is not signed in
    console.log("No user is signed in.");
  }
});
