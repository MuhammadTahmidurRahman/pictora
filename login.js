import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, fetchSignInMethodsForEmail, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// Function to handle Google login
window.loginWithGoogle = async function () {
  const provider = new GoogleAuthProvider();

  try {
    // Step 1: Prompt the user to pick an account and get the email
    const dummyResult = await signInWithPopup(auth, provider);
    const email = dummyResult.user.email;

    // Step 2: Immediately sign out the dummy result to prevent account creation
    await signOut(auth);

    // Step 3: Check if the email is already registered
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);

    if (signInMethods.length === 0) {
      // If no sign-in methods exist, the user is not registered
      alert("You are not registered. Please sign up first.");
      window.location.href = 'signup.html';
    } else {
      // If the user is registered, proceed with the actual Google sign-in
      const finalResult = await signInWithPopup(auth, provider);
      alert("Google sign-in successful");
      window.location.href = 'homepage.html'; // Replace with your desired homepage URL
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google.");
  }
};
