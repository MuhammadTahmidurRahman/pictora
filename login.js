import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
const auth = getAuth(app);

// Function to handle login with email and password
window.loginWithEmailPassword = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Check if the user is newly created (new user will have same creation and last sign-in time)
      if (user.metadata.creationTime === user.metadata.lastSignInTime) {
        // The user is new, sign them out and prompt them to sign up
        signOut(auth)
          .then(() => {
            alert("You are not registered. Please sign up first.");
            // Redirect to sign-up page
            window.location.href = 'signup.html'; // Adjust path to your signup page
          })
          .catch((error) => {
            console.error("Error signing out:", error);
            alert("An error occurred while logging out. Please try again.");
          });
      } else {
        // The user is a returning user
        alert("Login successful");
        // Redirect to the homepage or wherever appropriate
        window.location.href = 'homepage.html'; // Adjust path to your homepage
      }
    })
    .catch((error) => {
      console.error("Login failed:", error);
      alert("Failed to log in. Please check your credentials.");
    });
}

// Function to handle Google login
window.loginWithGoogle = function () {
  const provider = new GoogleAuthProvider();
  const email = document.getElementById("email").value;

  // Check if the email already exists in Firebase Auth
  fetchSignInMethodsForEmail(auth, email)
    .then((methods) => {
      if (methods.length === 0) {
        // If no sign-in methods are available for the email, the user is new
        alert("You are not registered. Please sign up first.");
        window.location.href = 'signup.html'; // Redirect to signup page
      } else {
        // Proceed with Google login since the email exists in Firebase
        signInWithPopup(auth, provider)
          .then((result) => {
            const user = result.user;
            alert("Google sign-in successful");
            // Redirect to homepage or wherever appropriate
            window.location.href = 'homepage.html'; // Adjust path to your homepage
          })
          .catch((error) => {
            console.error("Google sign-in failed:", error);
            alert("Failed to sign in with Google.");
          });
      }
    })
    .catch((error) => {
      console.error("Error checking email:", error);
      alert("An error occurred while checking your email.");
    });
}
