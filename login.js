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
    window.location.href = "createorjoinroom.html"; // Redirect if logged in
  }
});

// Email/Password Login with Check for Existing User
function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Check if the user exists in Firestore
            const user = userCredential.user;
            const userRef = doc(db, "users", user.uid); // Assuming you store users in Firestore under 'users'
            getDoc(userRef).then((docSnap) => {
                if (docSnap.exists()) {
                    alert("Login successful!");
                    window.location.href = "createorjoinroom.html"; // Redirect to homepage
                } else {
                    alert("This email is not registered. Please sign up first.");
                    // Sign the user out if they are not found in Firestore
                    auth.signOut();
                }
            });
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

// Google Sign-In with User Existence Check
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
        // Attempt to sign in with Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user exists in Firestore
        const userRef = doc(db, "users", user.uid); // Assuming users are stored in 'users' collection
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            alert("Google Sign-In successful!");
            window.location.href = "createorjoinroom.html"; // Redirect if user is found
        } else {
            // If user doesn't exist in Firestore, delete them from Firebase Authentication and sign out
            await deleteUser(user); // Remove user from Firebase Authentication
            alert("This Google account is not registered. Please sign up first.");
        }
    } catch (error) {
        console.error("Google Sign-In Error:", error.message);

        // Handle error in case deleteUser fails (e.g., network issue)
        if (error.code === 'auth/requires-recent-login') {
            alert("Please log in again to remove this account.");
        } else {
            alert("Google Sign-In failed: " + error.message);
        }
    }
}

// Exporting functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
