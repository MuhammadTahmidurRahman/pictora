import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
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
const database = getDatabase(app);

// Function to check if a user exists in the database
async function checkUserExists(uid) {
  const userSnapshot = await get(dbRef(database, `users/${uid}`));
  return userSnapshot.exists(); // Returns true if the user exists
}

// Email/Password Login Function
async function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    await setPersistence(auth, browserLocalPersistence); // Persist login session
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if user exists in the database
    const userExists = await checkUserExists(user.uid);
    if (userExists) {
      alert("Login successful!");
      window.location.href = "join_event.html"; // Redirect on success
    } else {
      alert("No account found with this email. Please sign up.");
      await signOut(auth); // Logout if user is not in the database
      window.location.href = "signup.html";
    }
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.code === 'auth/user-not-found') {
      alert("No account found for this email. Please sign up.");
    } else if (error.code === 'auth/wrong-password') {
      alert("Incorrect password. Please try again.");
    } else {
      alert(`Login failed: ${error.message}`);
    }
  }
}

// Google Login Function
async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in the database
    const userExists = await checkUserExists(user.uid);
    if (userExists) {
      alert("Google sign-in successful!");
      window.location.href = "join_event.html"; // Redirect on success
    } else {
      alert("No account found with this Google account. Please sign up.");
      await signOut(auth); // Logout if user is not in the database
      window.location.href = "signup.html";
    }
  } catch (error) {
    console.error("Google sign-in error:", error.message);
    alert("Failed to sign in with Google. Please try again.");
  }
}

// Attach Event Listeners
document.getElementById('login-button').addEventListener('click', loginUser);
document.getElementById('googleSignInButton').addEventListener('click', loginWithGoogle);

// Toggle Password Visibility
function togglePassword(inputId) {
  const passwordField = document.getElementById(inputId);
  passwordField.type = passwordField.type === "password" ? "text" : "password";
}
