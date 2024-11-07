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
const auth = getAuth();

// Toggle password visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
}

// Email/Password Login
async function loginWithEmailPassword() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill in both email and password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    alert("Login successful!");
    window.location.href = "createorjoinroom.html";
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      alert("This email is not registered. Please sign up first.");
    } else if (error.code === 'auth/wrong-password') {
      alert("Incorrect password. Please try again.");
    } else {
      alert("Login failed. Please try again.");
    }
  }
}

// Google Sign-In
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    alert("Google Sign-In successful!");
    window.location.href = "createorjoinroom.html";
  } catch (error) {
    alert("Google Sign-In failed. Please try again.");
  }
}

// Expose functions for inline HTML event handlers
window.togglePassword = togglePassword;
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
