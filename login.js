import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// Function to handle Google login with email pre-check
window.loginWithGoogle = async function () {
  try {
    // Prompt the user for their email
    const email = prompt("Please enter your registered email:");

    // Check if the email has existing sign-in methods
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods.length === 0) {
      // No sign-in methods exist for this email, user is not registered
      alert("You are not registered. Please sign up first.");
      window.location.href = 'signup.html'; // Redirect to sign-up page
      return;
    }

    // Email is registered, proceed with Google Sign-In
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Since the user is existing, allow access to the homepage
    alert("Google sign-in successful");
    window.location.href = 'homepage.html'; // Replace with your desired homepage URL
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google.");
  }
};
