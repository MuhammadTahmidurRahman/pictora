// Ensure no duplicate imports and only import necessary functions once
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

// Register user with email and password and upload profile image
window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const imageFile = document.getElementById("image").files[0];

  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill up all the information boxes.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }
  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }
  if (!imageFile) {
    alert("Please upload a profile image.");
    return;
  }

  try {
    // 1. Check if the email is already registered in Firebase Authentication
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      alert("This email is already registered. Please log in instead.");
      return;
    }

    // 2. Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Upload profile image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Store user data in Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: email,
      name: name,
      photo: imageUrl,
    });

    alert("User registered successfully with image uploaded!");
    // No automatic login or redirection here, you can manually log in later
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Failed to register user. Please try again.");
  }
};

// Google Sign-In with image upload validation
window.signInWithGoogle = async function () {
  const provider = new GoogleAuthProvider();
  const imageFile = document.getElementById("image").files[0];

  if (!imageFile) {
    alert("Please upload an image before signing up with Google.");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user is already registered in Realtime Database
    const userSnapshot = await get(dbRef(database, `users/${user.uid}`));
    if (userSnapshot.exists()) {
      alert("You have already signed up. Redirecting you to the join event page.");
      window.location.href = "join_event.html";
      return;
    }

    // Upload profile image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Store user data in Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: user.email,
      name: user.displayName,
      photo: imageUrl,
    });

    alert("Google Sign-In successful and image uploaded!");
    // No automatic login or redirection here, you can manually log in later
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
    alert("Google Sign-In failed. Please try again.");
  }
};
