import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to reset password
window.resetPassword = async function () {
  const emailInput = document.getElementById("email").value.trim();
  
  if (emailInput) {
    try {
      // Check if user exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, emailInput);
      if (signInMethods.length > 0) {
        // Send password reset email
        await sendPasswordResetEmail(auth, emailInput);
        alert(`A password reset link has been sent to ${emailInput}`);
      } else {
        alert("No user found for that email. Please sign up.");
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert("No user found for that email. Please sign up.");
      } else {
        alert("Failed to send reset email. Please try again later.");
        console.error("Error:", error);
      }
    }
  } else {
    alert("Please enter your email address");
  }
};
