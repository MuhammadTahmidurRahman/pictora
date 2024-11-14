import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistence set to local");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Function to handle Google login and check if user exists
window.loginWithGoogle = async function () {
  try {
    // Initiate Google Sign-In
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      // If user exists, proceed to the next step
      alert("Google sign-in successful");

      // Redirect to the create or join room page
      window.location.href = 'join_event.html';
    } else {
      // If user does not exist, sign out and redirect to signup page
      await signOut(auth);
      alert("User not registered. Redirecting to sign-up page.");
      window.location.href = 'signup.html';
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google. Redirecting to sign-up page.");
    window.location.href = 'signup.html';
  }
};

// Single onAuthStateChanged listener

async function loginUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    window.location.href = "join_event.html";  // Redirect to event page on successful login
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Login failed. Please check your credentials.");
  }
}

// Check if user is logged in on page load
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in.");
    // Redirect user to the join event page if already logged in
    window.location.href = "join_event.html";
  } else {
    console.log("No user is logged in.");
    // Stay on login page if no user is logged in
  }
});
