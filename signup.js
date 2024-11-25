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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// State variables
let imageFile = null;
let isUploading = false;

// Handle file selection
document.getElementById("uploadImageButton").addEventListener("click", async () => {
  const permissionGranted = await checkStoragePermission();
  if (!permissionGranted) {
    showAlert("Permission is required to access storage");
    return;
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      imageFile = file;
      document.getElementById("uploadStatus").innerText = "Photo selected";
    }
  };
  input.click();
});

// Upload image to Firebase Storage
async function uploadImage(image) {
  if (!image) {
    showAlert("Please select an image first.");
    return null;
  }

  const fileName = `${Date.now()}_${image.name}`;
  const imageRef = storageRef(storage, `uploads/${fileName}`);

  try {
    isUploading = true;
    const snapshot = await uploadBytes(imageRef, image);
    const downloadURL = await getDownloadURL(snapshot.ref);
    isUploading = false;
    showAlert("Image uploaded successfully!");
    return downloadURL;
  } catch (error) {
    isUploading = false;
    showAlert(`Failed to upload image: ${error.message}`);
    return null;
  }
}

// Register user
document.getElementById("signUpButton").addEventListener("click", async () => {
  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();
  const confirmPassword = document.getElementById("confirmPasswordInput").value.trim();

  if (!name || !email || !password || !confirmPassword) {
    showAlert("Please fill up all the information box properly.");
    return;
  }

  if (!imageFile) {
    showAlert("Please upload your photo.");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters long.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const imageUrl = await uploadImage(imageFile);
    if (!imageUrl) return;

    await set(ref(database, `users/${user.uid}`), {
      name: name,
      email: email,
      photo: imageUrl,
    });

    window.location.href = "create_or_join_room.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showAlert("Email or Google account already exists. Please log in.");
    } else {
      showAlert(`Failed to register: ${error.message}`);
    }
  }
});

// Google Sign-In
document.getElementById("googleSignInButton").addEventListener("click", async () => {
  if (!imageFile) {
    showAlert("Please upload an image before signing up with Google.");
    return;
  }

  try {
    const provider = new GoogleAuthProvider();
    const googleSignIn = new GoogleSignIn();

    const googleUser = await googleSignIn.signIn();
    if (!googleUser) {
      showAlert("No Google account selected.");
      return;
    }

    const credential = GoogleAuthProvider.credential(
      googleUser.getAuthResponse().id_token
    );

    const userCredential = await signInWithCredential(auth, credential);

    if (userCredential.additionalUserInfo.isNewUser) {
      const imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;

      await set(ref(database, `users/${userCredential.user.uid}`), {
        name: googleUser.profileObj.name || "N/A",
        email: googleUser.profileObj.email,
        photo: imageUrl,
      });

      window.location.href = "create_or_join_room.html";
    } else {
      showAlert("Email or Google account already exists. Please log in.");
    }
  } catch (error) {
    showAlert(`Failed to sign in with Google: ${error.message}`);
  }
});
