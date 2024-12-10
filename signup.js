// Ensure no duplicate imports and only import necessary functions once
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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

// Function to toggle password visibility
window.togglePassword = function (fieldId) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
};

// Function to show the file picker
window.showImagePicker = function () {
  document.getElementById("image").click();
};

// Function to display selected image message
window.displayImage = function (input) {
  const uploadText = document.getElementById("upload-text");
  if (input.files && input.files[0]) {
    console.log("File selected:", input.files[0].name);  // Log the file name to confirm it's being selected
    uploadText.textContent = "Photo selected"; // Show message when a photo is selected
  } else {
    uploadText.textContent = "Upload your photo here"; // Show default message if no photo selected
  }
};

// Function to register a user and upload the profile image
window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const imageFile = document.getElementById("image").files[0];
  const uploadText = document.getElementById("upload-text");

    // Log inputs for debugging
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password Length:", password.length);
    console.log("Confirm Password Length:", confirmPassword.length);
    console.log("Image file:", imageFile);

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
    uploadText.textContent = "No photo uploaded."; // Show message if no image selected
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

    uploadText.textContent = "Uploading photo...";  // Show upload message

    // Upload image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    console.log("Uploading photo...");
    await uploadBytes(storageRef, imageFile);

    // Log the upload status
    console.log("Upload completed");

    const imageUrl = await getDownloadURL(storageRef);
    console.log("Image URL:", imageUrl);

    // Save user data to Firebase Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: email,
      name: name,
      photo: imageUrl,
    });

    uploadText.textContent = "Photo uploaded successfully."; // Show success message
    alert("User registered successfully!");
    window.location.href = "join_event.html"; // Redirect to join event after successful signup
  } catch (error) {
    console.error("Error registering user:", error);
    uploadText.textContent = "Error uploading photo."; // Show error message
    alert("Failed to register user. Please try again.");
  }
};

// Google Sign-In function with image upload validation
window.signInWithGoogle = async function () {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account", // Ensures the user is prompted to select an account
  });

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
    window.location.href = "join_event.html"; // Redirect after successful Google sign-in
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
    alert("Google Sign-In failed. Please try again.");
  }
};
