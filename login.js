import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithCredential, 
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getPermissions, requestPermission } from './permissions.js'; // Assuming permissions.js handles camera/storage permissions

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  appId: "1:155732133141:web:c5646717494a496a6dd51c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Image picker - get image URL from either camera or gallery
async function pickImage(source) {
  try {
    const permission = source === 'camera' ? 'camera' : 'storage'; // Adjust based on source
    await requestPermission(permission);

    const imageFile = await getImageFromSource(source); // A function to pick image either from camera or gallery
    if (!imageFile) {
      throw new Error('No image selected.');
    }
    return imageFile;
  } catch (error) {
    console.error("Image picking failed:", error);
    alert("Failed to select image.");
    return null;
  }
}

// Function to upload image to Firebase Storage
async function uploadImage(imageFile) {
  try {
    const fileName = Date.now().toString();
    const imageRef = ref(storage, 'uploads/' + fileName);
    const uploadResult = await uploadBytes(imageRef, imageFile);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload image.");
    return null;
  }
}

// Handle registration with email and password
async function registerUser(email, password, confirmPassword, name, imageFile) {
  if (!email || !password || !confirmPassword || !name) {
    alert("Please fill up all the information box properly.");
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
    alert("Please upload your photo.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const imageUrl = await uploadImage(imageFile);

    // Save user information to Firestore
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      photo: imageUrl || ''
    });

    // Redirect user after successful registration
    alert("User registered successfully!");
    window.location.href = 'create_or_join_room.html'; // Adjust as needed
  } catch (error) {
    console.error("Registration failed:", error);
    alert("Registration failed: " + error.message);
  }
}

// Handle Google login
async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      alert("Google sign-in successful");
      window.location.href = 'create_or_join_room.html'; // Adjust as needed
    } else {
      alert("User not registered. Redirecting to sign-up page.");
      await signOut(auth);
      window.location.href = 'signup.html';
    }
  } catch (error) {
    console.error("Google sign-in failed:", error);
    alert("Failed to sign in with Google: " + error.message);
  }
}

// Handle onAuthStateChanged
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname === '/login.html') {
      window.location.href = 'join_event.html'; // Redirect to event page after login
    }
  }
});

// Event listeners for actions (form submission, Google sign-in, etc.)
document.addEventListener("DOMContentLoaded", function () {
  // Attach event listeners after DOM content is loaded
  document.getElementById("signup-button").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const name = document.getElementById("name").value;
    const imageFile = document.getElementById("imageInput").files[0]; // Assuming an input field with ID "imageInput"

    registerUser(email, password, confirmPassword, name, imageFile);
  });

  document.getElementById("googleSignInButton").addEventListener("click", () => {
    signInWithGoogle();
  });

  document.getElementById("image-upload-button").addEventListener("click", async () => {
    const source = prompt("Choose image source (camera/gallery):");
    const imageFile = await pickImage(source);
    if (imageFile) {
      alert("Image selected successfully.");
    }
  });
});

document.getElementById('yourButtonId').addEventListener('click', function() {
  console.log("Button clicked");
});

