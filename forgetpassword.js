// forgetpassword.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
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

// Define the goBack function
window.goBack = function() {
    window.history.back();
};
