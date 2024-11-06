import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
const auth = getAuth();
const storage = getStorage();

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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Upload profile image to Firebase Storage
    const storageRef = ref(storage, `uploads/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    alert("User registered successfully with image uploaded!");
    console.log("Profile image URL:", imageUrl);
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

    // Upload profile image to Firebase Storage
    const storageRef = ref(storage, `profile_images/${user.uid}`);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    alert("Google Sign-In successful and image uploaded!");
    console.log("Profile image URL:", imageUrl);
  } catch (error) {
    console.error("Error with Google Sign-In:", error);
    alert("Google Sign-In failed. Please try again.");
  }
}

// Expose functions to global scope for inline HTML event handlers
window.togglePassword = togglePassword;
window.showImagePicker = showImagePicker;
window.displayImage = displayImage;
window.registerUser = registerUser;
window.signInWithGoogle = signInWithGoogle;
