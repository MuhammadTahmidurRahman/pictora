// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// Function to handle login with email and password
window.loginWithEmailPassword = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful");
      // Redirect or navigate to the homepage
    })
    .catch((error) => {
      console.error("Login failed:", error);
      alert("Failed to log in. Please check your credentials.");
    });
};

// Function to handle Google login
window.loginWithGoogle = function () {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then(() => {
      alert("Google sign-in successful");
      // Redirect or navigate to the homepage
    })
    .catch((error) => {
      console.error("Google sign-in failed:", error);
      alert("Failed to sign in with Google.");
    });
};
