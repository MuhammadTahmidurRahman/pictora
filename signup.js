// Ensure no duplicate imports and only import necessary functions once
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, GoogleSignIn } from "google-signin";
import { checkCameraPermission, checkStoragePermission } from "./permissions"; // Assume you have a permissions module
import { showAlert } from "./alerts"; // Assume you have a utility for showing alerts

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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const uploadImageButton = document.getElementById("upload-image-btn");
  const signupButton = document.getElementById("signup-btn");
  const googleSignupButton = document.getElementById("google-signup-btn");
  let selectedImageFile = null;

  // Toggle password visibility
  document.querySelectorAll(".toggle").forEach((toggle, idx) => {
    toggle.addEventListener("click", () => {
      const input = idx === 0 ? passwordInput : confirmPasswordInput;
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  // Handle image upload
  uploadImageButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", (event) => {
      selectedImageFile = event.target.files[0];
      uploadImageButton.textContent = "Photo Selected";
    });
    input.click();
  });

  // Upload image to Firebase
  const uploadImage = async () => {
    if (!selectedImageFile) {
      alert("Please select an image.");
      return null;
    }
    const fileName = `${Date.now()}-${selectedImageFile.name}`;
    const storageRef = storage.ref(`uploads/${fileName}`);
    const snapshot = await storageRef.put(selectedImageFile);
    return await snapshot.ref.getDownloadURL();
  };

  // Sign up logic
  signupButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields.");
      return;
    }
    if (!selectedImageFile) {
      alert("Please upload a photo.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const imageUrl = await uploadImage();
      if (!imageUrl) return;
      await database.ref(`users/${user.uid}`).set({ name, email, photo: imageUrl });
      alert("Sign up successful!");
    } catch (error) {
      alert(error.message);
    }
  });

  // Google sign-up logic
  googleSignupButton.addEventListener("click", async () => {
    if (!selectedImageFile) {
      alert("Please upload an image.");
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      const imageUrl = await uploadImage();
      await database.ref(`users/${user.uid}`).set({ name: user.displayName, email: user.email, photo: imageUrl });
      alert("Google Sign-Up successful!");
    } catch (error) {
      alert(error.message);
    }
  });
});
