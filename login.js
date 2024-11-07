// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    deleteUser 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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
const db = getFirestore();
const storage = getStorage();

// Monitor authentication state for automatic redirection if the user is already logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // User exists, redirect to main page
        window.location.href = "createorjoinroom.html";
      } else {
        // User does not exist in Firestore, delete from auth
        await deleteUser(user);
        alert("This account is not registered. Please sign up first.");
        // Optionally, redirect to login page
        window.location.href = "login.html";
      }
    } catch (error) {
      console.error("Error checking user in Firestore:", error);
      alert("An error occurred. Please try again.");
      // Optionally, sign out the user
      await auth.signOut();
    }
  }
});

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// Email/Password Login
async function loginWithEmailPassword() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        // Sign in the user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // User exists, redirect to main page
            alert("Login successful!");
            window.location.href = "createorjoinroom.html";
        } else {
            // User does not exist in Firestore, delete from auth
            await deleteUser(user);
            alert("This account is not registered. Please sign up first.");
            // Optionally, redirect to login page
            window.location.href = "login.html";
        }
    } catch (error) {
        // Handle errors appropriately
        if (error.code === 'auth/user-not-found') {
            alert("This email is not registered. Please sign up first.");
        } else if (error.code === 'auth/wrong-password') {
            alert("Incorrect password. Please try again.");
        } else {
            console.error("Error during login:", error);
            alert("Login failed: " + error.message);
        }
    }
}

// Google Sign-In with User Existence Check
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
        // Attempt to sign in with Google
        const result = await signInWithPopup(auth, provider);

        // Get the signed-in user
        const user = result.user;

        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // User exists, proceed to the main page
            alert("Google Sign-In successful!");
            window.location.href = "createorjoinroom.html";
        } else {
            // User does not exist, delete their auth record and sign them out
            await deleteUser(user);
            alert("This Google account is not registered. Please sign up first.");
            // Optionally, redirect to login page
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error("Google Sign-In Error:", error);

        // Handle specific errors
        if (error.code === 'auth/requires-recent-login') {
            alert("To remove this account, please log in again and try.");
        } else {
            alert("Google Sign-In failed: " + error.message);
        }
    }
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
