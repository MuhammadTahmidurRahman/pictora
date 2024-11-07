import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// Email/Password Login
function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Login successful!");
            window.location.href = "createorjoinroom.html"; // Redirect to homepage
        })
        .catch((error) => {
            console.error("Error during login:", error.message);
            alert("Login failed: " + error.message);
        });
}

// Google Sign-In
function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then((result) => {
            alert("Google Sign-In successful!");
            window.location.href = "createorjoinroom.html"; // Redirect to homepage
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error.message);
            alert("Google Sign-In failed: " + error.message);
        });
}

// Navigation Functions
function goBack() {
    window.history.back();
}

function navigateToForgotPassword() {
    window.location.href = "forgot_password.html"; // Link to forgot password page
}

function navigateToRegister() {
    window.location.href = "signup.html"; // Link to registration page
}

// Exporting functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
window.goBack = goBack;
window.navigateToForgotPassword = navigateToForgotPassword;
window.navigateToRegister = navigateToRegister;
window.togglePasswordVisibility = togglePasswordVisibility;
