import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. Checking user status...");
  if (user) {
    console.log("User is already logged in:", user);
    // If user is logged in, redirect to join_event
    if (window.location.pathname === '/signup.html') {
      console.log("Redirecting to join_event...");
      window.location.href = 'join_event.html'; // Redirect to event page
    }
  } else {
    console.log("User is not logged in. Staying on signup page.");
    // If the user is not logged in, do not redirect.
  }
});


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
//const auth = getAuth();
const storage = getStorage();
const database = getDatabase();
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed. Checking user status...");
  if (user) {
    console.log("User is already logged in:", user);
    // If user is logged in, redirect to join_event
    if (window.location.pathname === '/signup.html') {
      console.log("Redirecting to join_event...");
      window.location.href = 'join_event.html'; // Redirect to event page
    }
  } else {
    console.log("User is not logged in. Staying on signup page.");
    // If the user is not logged in, do not redirect.
  }
});



// Toggle password visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
}

// Show image picker
function showImagePicker() {
  document.getElementById("image").click();
}

// Display selected image status
function displayImage(input) {
  const uploadText = document.getElementById("upload-text");
  uploadText.textContent = input.files && input.files[0] ? "Photo selected" : "Upload your photo here";
}

// Register user with email and password and upload profile image
async function registerUser() {
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

    // 2. Check if the email is already registered in Realtime Database
    const userQuery = query(dbRef(database, "users"), orderByChild("email"), equalTo(email));
    const userSnapshot = await get(userQuery);
    if (userSnapshot.exists()) {
      alert("This email is already registered in the database. Please log in instead.");
      return;
    }

    // Create user with email and password
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
    window.location.href = "join_event.html";
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Failed to register user. Please try again.");
  }
}

// Google Sign-In with image upload validation
async function signInWithGoogle() {
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
    window.location.href = "join_event.html";
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
    alert("Google Sign-In failed. Please try again.");
  }
}


onAuthStateChanged(auth, (user) => {
  // If the user is logged in, redirect them to the join event page
  if (user) {
    console.log("User is already logged in, redirecting to join event...");
    window.location.href = 'join_event.html'; // Redirect to event page
  }
  // Else, stay on the signup page
});

// Expose functions to global scope for inline HTML event handlers
window.togglePassword = togglePassword;
window.showImagePicker = showImagePicker;
window.displayImage = displayImage;
window.registerUser = registerUser;
window.signInWithGoogle = signInWithGoogle;
