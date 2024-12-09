// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

// Redirect authenticated users to join_event.html
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Optionally, check if email is verified
    if (user.emailVerified) {
      window.location.href = "join_event.html";
    } else {
      alert("Please verify your email before proceeding. A verification email has been sent to your email address.");
      // Optionally, you can resend verification email
      sendEmailVerification(user)
        .then(() => {
          alert("Verification email sent. Please check your inbox.");
        })
        .catch((error) => {
          console.error("Error sending verification email:", error);
          alert("Failed to send verification email. Please try again.");
        });
      // Sign out the user to prevent access without verification
      signOut(auth);
    }
  }
});

// Utility functions
window.togglePassword = function (fieldId) {
  const field = document.getElementById(fieldId);
  field.type = field.type === "password" ? "text" : "password";
};

window.showImagePicker = function () {
  document.getElementById("image").click();
};

window.displayImage = function (input) {
  const uploadText = document.getElementById("upload-text");
  uploadText.textContent = input.files && input.files[0] ? "Photo selected" : "Upload your photo here";
};

// Register User
window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const imageFile = document.getElementById("image").files[0];

  // Validation checks
  if (!name || !email || !password || !confirmPassword || !imageFile) {
    alert("Please fill up all the fields and upload an image.");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    // Check if the email is already registered
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      alert("This email is already registered. Please log in.");
      return;
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Upload image to Firebase Storage
    const storageRefPath = `uploads/${user.uid}`;
    const storageRef = ref(storage, storageRefPath);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Save user data to Firebase Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email,
      name,
      photo: imageUrl,
    });

    // Send email verification
    await sendEmailVerification(user);
    alert("Registration successful! A verification email has been sent to your email address. Please verify to proceed.");
    
    // Sign out the user to prevent access without verification
    await signOut(auth);

    // Redirect to login page after signing out
    window.location.href = "login.html";
  } catch (error) {
    console.error("Registration error:", error);
    alert(`Failed to register. ${error.message}`);
  }
};

// Google Sign-In
window.signInWithGoogle = async function () {
  const provider = new GoogleAuthProvider();
  const imageFile = document.getElementById("image").files[0];

  if (!imageFile) {
    alert("Please upload a profile image.");
    return;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user exists in the database
    const userSnapshot = await get(dbRef(database, `users/${user.uid}`));
    if (userSnapshot.exists()) {
      alert("Welcome back!");
      window.location.href = "join_event.html";
      return;
    }

    // Upload image to Firebase Storage
    const storageRefPath = `uploads/${user.uid}`;
    const storageRef = ref(storage, storageRefPath);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Save user data to Firebase Realtime Database
    await set(dbRef(database, `users/${user.uid}`), {
      email: user.email,
      name: user.displayName || "No Name",
      photo: imageUrl,
    });

    alert("Google Sign-In successful!");
    window.location.href = "join_event.html";
  } catch (error) {
    console.error("Google Sign-In error:", error);
    alert(`Failed to sign in with Google. ${error.message}`);
  }
};
