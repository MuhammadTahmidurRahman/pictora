// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  fetchSignInMethodsForEmail, 
  GoogleAuthProvider, 
  onAuthStateChanged 
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
const database = getDatabase();s

// Redirect authenticated users to join_event.html if their email is verified
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.emailVerified) {
      window.location.href = "join_event.html";
    } else {
      alert("Please verify your email before proceeding. A verification email has been sent to your email address.");
      // Optionally, resend verification email
      try {
        await sendEmailVerification(user);
        alert("Verification email sent. Please check your inbox.");
      } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to send verification email. Please try again.");
      }
      // Sign out the user to prevent access without verification
      await signOut(auth);
    }
  }
});

// Utility Functions

/**
 * Toggles the visibility of a password field.
 * @param {string} fieldId - The ID of the password input field.
 */
window.togglePassword = function (fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.type = field.type === "password" ? "text" : "password";
  } else {
    console.error(`Password field with id '${fieldId}' not found.`);
  }
};

/**
 * Triggers the hidden file input to open the image picker.
 */
window.showImagePicker = function () {
  const imageInput = document.getElementById("image");
  if (imageInput) {
    imageInput.click();
  } else {
    console.error("Image input element with id 'image' not found.");
  }
};

/**
 * Displays the selected image status.
 * @param {HTMLElement} input - The file input element.
 */
window.displayImage = function (input) {
  const uploadText = document.getElementById("upload-text");
  if (uploadText) {
    uploadText.textContent = input.files && input.files[0] ? "Photo selected" : "Upload your photo here";
  } else {
    console.error("Upload text element with id 'upload-text' not found.");
  }
};

/**
 * Navigates back to the previous page.
 */
window.goBack = function () {
  window.history.back();
};

/**
 * Registers a new user with email and password, uploads their profile image, and sends a verification email.
 */
window.registerUser = async function () {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const imageInput = document.getElementById("image");
  const imageFile = imageInput ? imageInput.files[0] : null;

  // Debugging: Check if imageFile is obtained correctly
  console.log("Image File:", imageFile);

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

    // Ensure the user object exists
    if (!user) {
      alert("Failed to create user. Please try again.");
      return;
    }

    // Upload image to Firebase Storage
    // Include file extension in the storage path
    const fileExtension = imageFile.name.split('.').pop();
    const storagePath = `uploads/${user.uid}/profile.${fileExtension}`;
    const imageStorageRef = storageRef(storage, storagePath);

    // Debugging: Log storage path
    console.log("Uploading image to:", storagePath);

    await uploadBytes(imageStorageRef, imageFile);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // Debugging: Log image URL
    console.log("Image URL:", imageUrl);

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

/**
 * Signs in the user using Google Sign-In, uploads their profile image if new, and redirects accordingly.
 */
window.signInWithGoogle = async function () {
  const provider = new GoogleAuthProvider();
  const imageInput = document.getElementById("image");
  const imageFile = imageInput ? imageInput.files[0] : null;

  if (!imageFile) {
    alert("Please upload a profile image.");
    return;
  }

  try {
    // Debugging: Log image file
    console.log("Google Sign-In Image File:", imageFile);

    // Upload image to Firebase Storage
    const fileExtension = imageFile.name.split('.').pop();
    const storagePath = `uploads/google/${Date.now()}.${fileExtension}`;
    const imageStorageRef = storageRef(storage, storagePath);

    // Debugging: Log storage path
    console.log("Uploading Google image to:", storagePath);

    await uploadBytes(imageStorageRef, imageFile);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // Debugging: Log image URL
    console.log("Google Image URL:", imageUrl);

    // Sign in with Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) {
      alert("Failed to sign in with Google. Please try again.");
      return;
    }

    // Check if user exists in the database
    const userSnapshot = await get(dbRef(database, `users/${user.uid}`));
    if (userSnapshot.exists()) {
      alert("Welcome back!");
      window.location.href = "join_event.html";
      return;
    }

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
