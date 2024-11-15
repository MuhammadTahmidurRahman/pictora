// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage();

// Fetch images and populate the gallery
async function fetchImages(folderName) {
  try {
    console.log("Fetching images from folder:", folderName); // Debug folder path

    // Reference to the folder in Firebase Storage
    const folderRef = storageRef(storage, folderName);

    // List all items in the folder
    const result = await listAll(folderRef);
    console.log("Storage items:", result.items); // Debug storage items

    // If no images are found, display a message
    if (result.items.length === 0) {
      document.getElementById("emptyMessage").textContent = "No photos uploaded.";
      return;
    }

    // Fetch URLs for all images
    const photoGrid = document.getElementById("photoGrid");
    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
    console.log("Fetched URLs:", urls); // Debug fetched URLs

    // Populate the gallery with images
    document.getElementById("emptyMessage").style.display = "none";
    urls.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      photoGrid.appendChild(img);
    });
  } catch (error) {
    console.error("Error loading photos:", error); // Debug any errors
    alert("Error loading photos. Please try again.");
  }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back(); // Navigate back to the previous page
});

// Ensure user is authenticated before loading photos
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User authenticated:", user.uid); // Debug authenticated user ID

    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const folderName = urlParams.get("folderName");

    // Validate folder path
    if (!folderName) {
      alert("Missing folder path. Unable to load photos.");
      window.history.back();
      return;
    }

    // Fetch and display images
    fetchImages(folderName);
  } else {
    console.log("User is not authenticated."); // Debug unauthenticated state
    alert("You must be signed in to view photos.");
    window.location.href = "login.html"; // Redirect to login page
  }
});
