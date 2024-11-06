import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, fetchSignInMethodsForEmail, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// Function to handle Google login with direct email verification
window.loginWithGoogle = async function () {
  try {
    // Initiate Google sign-in
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const googleUserEmail = result.user.email; // Retrieve email from signed-in Google user

    // Check if this email is registered in Firebase
    const signInMethods = await fetchSignInMethodsForEmail(auth, googleUserEmail);

    if (signInMethods.length === 0) {
      // If no sign-in methods exist, the user is not registered
      await signOut(auth); // Sign out the user to prevent unintended account creation
      alert("You are not registered. Please sign up first.");
      window.location.href = 'signup.html'; // Redirect to sign-up page
    } else {
      // The user is registered, redirect to the homepage
      alert("Google sign-in successful");
      window.location.href = 'homepage.html'; // Replace with your desired homepage URL
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google.");
  }
};
