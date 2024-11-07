import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
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

// Monitor authentication state and redirect if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    checkIfUserExists(user);
  }
});

// Function to check if the user is new or existing by checking Firestore for user data
async function checkIfUserExists(user) {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    // Existing user, redirect to main page
    window.location.href = "createorjoinroom.html";
  } else {
    // User is new, sign out and show alert
    await signOut(auth);
    alert("You are not registered. Please sign up first.");
    window.location.href = "signup.html";
  }
}

// Email/Password Login
function loginWithEmailPassword() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      checkIfUserExists(userCredential.user);
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

// Google Sign-In
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    checkIfUserExists(result.user);
  } catch (error) {
    alert("Google Sign-In failed: " + error.message);
  }
}

// Export functions for use in HTML
window.loginWithEmailPassword = loginWithEmailPassword;
window.loginWithGoogle = loginWithGoogle;
