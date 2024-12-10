// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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

// Check auth state and handle redirection
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in, redirecting to join event...");
    window.location.href = 'join_event.html';
  }
});

// Toggle password visibility
window.togglePassword = function (fieldId) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
};

// Show image picker
window.showImagePicker = function () {
  document.getElementById("image").click();
};

// Display selected image message
window.displayImage = function (input) {
  const uploadText = document.getElementById("upload-text");
  if (input.files && input.files[0]) {
    uploadText.textContent = "Photo selected"; // Show message when a photo is selected
  } else {
    uploadText.textContent = "Upload your photo here"; // Show default message if no photo selected
  }
};

// Register user and upload profile image
window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const imageFile = document.getElementById("image").files[0];
  const uploadText = document.getElementById("upload-text");

  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill up all the information boxes.");
    return;
  }

  if (!emailRegex.test(email)) {
    alert("Wrong email. Please type again.");
    return;
  }

  if (password.length < 8) {
    alert("The password must be 8 characters long.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (!imageFile) {
    uploadText.textContent = "No photo uploaded."; // Show message when no photo is uploaded
    return;
  }

  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      alert("This email is already registered. Please log in instead.");
      return;
    }

    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Show uploading message
    uploadText.textContent = "Uploading photo...";

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Save user data to Firebase Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: email,
      name: name,
      photo: imageUrl,
    });

    uploadText.textContent = "Photo uploaded successfully."; // Show success message
    alert("User registered successfully!");
    window.location.href = "join_event.html";
  } catch (error) {
    console.error("Error registering user:", error);
    uploadText.textContent = "Error uploading photo."; // Show error message
    alert("Failed to register user. Please try again.");
  }
};

// Google sign-in function
window.signInWithGoogle = async function () {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const imageFile = document.getElementById("image").files[0];
  const uploadText = document.getElementById("upload-text");

  if (!imageFile) {
    uploadText.textContent = "No photo uploaded.";
    alert("Please upload an image before signing up with Google.");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userSnapshot = await get(dbRef(database, `users/${user.uid}`));
    
    if (userSnapshot.exists()) {
      uploadText.textContent = "Photo uploaded successfully.";
      alert("User already signed up, redirecting to join event...");
      window.location.href = "join_event.html";
      return;
    }

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Save user data to Firebase Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: user.email,
      name: user.displayName,
      photo: imageUrl,
    });

    uploadText.textContent = "Photo uploaded successfully."; // Show success message
    alert("Google Sign-In successful!");
    window.location.href = "join_event.html";
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
    uploadText.textContent = "Error uploading photo."; // Show error message
    alert("Google Sign-In failed.");
  }
};
