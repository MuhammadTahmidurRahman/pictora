import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Monitor authentication state for automatic redirection if the user is already logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Check if the user exists in Firestore
    await _checkIfUserExists(user);
  }
});

// Function to check if the user is new or existing in Firestore
async function _checkIfUserExists(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    // Existing user, proceed to the main page
    window.location.href = "createorjoinroom.html";
  } else {
    // New user, prompt sign-up or set initial data
    await setDoc(userDocRef, {
      email: user.email,
      createdAt: new Date().toISOString()
    });
    window.location.href = "createorjoinroom.html";
  }
}

// Email/Password Login with Check for Existing User
async function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await _checkIfUserExists(user);
    } catch (error) {
        // Handle error
        if (error.code === 'auth/user-not-found') {
            alert("This email is not registered. Please sign up first.");
        } else if (error.code === 'auth/wrong-password') {
            alert("Incorrect password. Please try again.");
        } else {
            alert("Login failed: " + error.message);
        }
    }
}

// Google Sign-In with Check for Existing User
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await _checkIfUserExists(user);
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        alert("Google Sign-In failed: " + error.message);
    }
}

// Exporting functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
