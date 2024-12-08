import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
<<<<<<< Updated upstream
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
=======
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. Checking user status...");
  if (user) {
    console.log("User is logged in:", user);
    // If user is logged in, we should be redirected to join_event
    if (window.location.pathname === '/login.html') {
      console.log("Redirecting to join_event...");
      window.location.href = 'join_event.html'; // Redirect to event page
    }
  } else {
    console.log("User is not logged in. Staying on login page.");
    // If the user is not logged in, do not redirect.
  }
});
>>>>>>> Stashed changes

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Set persistence to local inside the login function
// Function to handle email login
async function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    window.location.href = "join_event.html";  // Redirect to event page on successful login
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.code === 'auth/user-not-found') {
      alert("No account found with this email. Please sign up.");
    } else {
      alert("Login failed. Please check your credentials.");
    }
  }
}

// Function to handle Google login and check if user exists
window.loginWithGoogle = async function () {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user exists in the Realtime Database
    const userSnapshot = await get(dbRef(database, "users/" + user.uid));
    if (userSnapshot.exists()) {
      alert("Google sign-in successful");
      window.location.href = 'join_event.html';  // Redirect to the event page
    } else {
      // If user does not exist in the database, sign out and redirect to signup page
      await signOut(auth);
      alert("No account found with this Google account. Please sign up.");
      window.location.href = 'signup.html';  // Redirect to signup page
    }
  } catch (error) {
    console.error("Google sign-in failed:", error.message);
    alert("Failed to sign in with Google. Please sign up.");
    window.location.href = 'signup.html';  // Redirect to signup page if sign-in fails
  }
};

<<<<<<< Updated upstream
// Listen to authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in.");
    if (window.location.pathname !== "/join_event.html") {
      window.location.href = "join_event.html"; // Redirect only if not already on the target page
    }
  } else {
    console.log("No user is logged in.");
  }
});

// Toggle password visibility
function togglePassword(inputId) {
  const passwordField = document.getElementById(inputId);
  const type = passwordField.type === "password" ? "text" : "password";
  passwordField.type = type;
}
=======
// Handle authentication state changes
// Handle authentication state changes
// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user);
>>>>>>> Stashed changes

// Add event listener for login button
document.getElementById('login-button').addEventListener('click', loginUser);

<<<<<<< Updated upstream
// Add event listener for Google sign-in button
document.getElementById('googleSignInButton').addEventListener('click', loginWithGoogle);
=======
    // Only redirect if not already on 'signup.html' or 'login.html'
    if (window.location.pathname !== '/signup.html' && window.location.pathname !== '/login.html') {
      window.location.href = 'signup.html';
    }
  }
});

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User is signed in:", user);

    // Redirect only if not already on 'join_event.html'
    if (window.location.pathname !== '/join_event.html') {
      window.location.href = 'join_event.html';
    }
  } else {
    // User is signed out
    console.log("User is signed out");

    // Redirect to 'signup.html' only if not on 'signup.html' or 'login.html'
    if (window.location.pathname !== '/signup.html' && window.location.pathname !== '/login.html') {
      window.location.href = 'signup.html';
    }
  }
});

>>>>>>> Stashed changes
