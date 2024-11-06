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

// Function to handle Google login with email check
window.loginWithGoogle = async function () {
  try {
    // Prompt user for their email first to check registration status
    const email = prompt("Please enter your email to proceed with Google Sign-In:");

    if (!email) {
      alert("Email is required for Google Sign-In.");
      return;
    }

    // Check if the email is registered
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods.length === 0) {
      // If no sign-in methods exist, the user is not registered
      alert("You are not registered. Please sign up first.");
      window.location.href = 'signup.html';
    } else {
      // If the user is registered, proceed with Google sign-in
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Verify that the signed-in user's email matches the entered email
      if (result.user.email === email) {
        alert("Google sign-in successful");
        window.location.href = 'homepage.html'; // Replace with your desired homepage URL
      } else {
        // Sign out if the emails don't match, to prevent unintended account creation
        await signOut(auth);
        alert("Email mismatch. Please use the registered email.");
      }
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google.");
  }
};
