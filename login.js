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
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if the user is new or existing
    _checkIfUserExists(user);
  }
});

// Function to check if the user is new or existing
function _checkIfUserExists(user) {
  const metadata = user.metadata;
  if (metadata.creationTime !== metadata.lastSignInTime) {
    // Existing user, proceed to the main page
    window.location.href = "createorjoinroom.html"; // Redirect to homepage
  } else {
    // User is new, prevent account from being saved and sign them out
    auth.signOut().then(() => {
      alert("You are not registered. Please sign up first.");
      window.location.href = "signup.html"; // Redirect to the sign-up page
    }).catch((error) => {
      console.error("Error signing out: ", error);
    });
  }
}

// Email/Password Login with Check for Existing User
function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            
            // Check if the user is new or existing
            const user = userCredential.user;
            _checkIfUserExists(user);
            window.location.href = "createorjoinroom.html"; // Run the check
        })
        .catch((error) => {
            // Handle error
            if (error.code === 'auth/user-not-found') {
                alert("This email is not registered. Please sign up first.");
            } else if (error.code === 'auth/wrong-password') {
                alert("Incorrect password. Please try again.");
            } else {
                alert("Login failed: " + error.message);
            }
        });
}

// Google Sign-In with Check for Existing User
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
        // Attempt to sign in with Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user is new or existing
        _checkIfUserExists(user);
        window.location.href = "createorjoinroom.html"; // Run the check
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        alert("Google Sign-In failed: " + error.message);
    }
}

// Exporting functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
