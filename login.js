import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// Monitor authentication state and redirect if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
    if (isNewUser) {
      alert("You are not registered. Please sign up first.");
      window.location.href = "signup.html";
    } else {
      console.log("Redirecting to main page for existing user");
      window.location.href = "createorjoinroom.html";
    }
  }
});

// Email/Password Login with Check for Existing User
function loginWithEmailPassword() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("User login attempt with email:", email); // Debugging log
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User logged in:", user); // Debugging log
    })
    .catch((error) => {
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
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Google sign-in successful for user:", user); // Debugging log
  } catch (error) {
    console.error("Google Sign-In Error:", error.message);
    alert("Google Sign-In failed: " + error.message);
  }
}

// Export functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
