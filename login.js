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

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Monitor authentication state for automatic redirection if the user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // If user is already logged in, redirect them to the main page
    window.location.href = "createorjoinroom.html";
  }
});

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// Email/Password Login with Check for Existing User
function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Check if the user is new or existing
            const user = userCredential.user;
            _checkIfUserExists(user); // Run the check
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

// Function to handle user metadata check
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

// Google Sign-In with Check for Existing User and Deleting User if Not Found
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
        // Attempt to sign in with Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // User exists, proceed to the main page
            alert("Google Sign-In successful!");
            window.location.href = "createorjoinroom.html"; // Redirect to homepage
        } else {
            // User does not exist in Firestore, sign them out and delete their Firebase Authentication record
            await deleteUser(user); // Delete user from Firebase Authentication
            alert("This Google account is not registered. Please sign up first.");
            window.location.href = "signup.html"; // Redirect to sign-up page
        }
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);
        alert("Google Sign-In failed: " + error.message);
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
