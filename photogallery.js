// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
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
const database = getDatabase();
const storage = getStorage();

// Fetch images and populate the gallery
async function fetchImages(eventCode, folderName, userId) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in to view photos.");
    return;
  }

  try {
    // Fetch images from Firebase Storage
    const folderRef = storageRef(storage, folderName);
    const result = await listAll(folderRef);
    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));

    // Populate the gallery
    const photoGrid = document.getElementById("photoGrid");
    const emptyMessage = document.getElementById("emptyMessage");

    if (urls.length === 0) {
      emptyMessage.textContent = "No photos uploaded.";
    } else {
      emptyMessage.style.display = "none";
      urls.forEach((url) => {
        const img = document.createElement("img");
        img.src = url;
        photoGrid.appendChild(img);
      });
    }
  } catch (error) {
    console.error("Error loading photos:", error);
    alert("Error loading photos.");
  }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back(); // Navigate back to the previous page
});

// Get query parameters and initialize the gallery
const urlParams = new URLSearchParams(window.location.search);
const eventCode = urlParams.get("eventCode");
const folderName = urlParams.get("folderName");
const userId = urlParams.get("userId");

if (eventCode && folderName && userId) {
  fetchImages(eventCode, folderName, userId); // Fetch images for the folder
} else {
  alert("Missing required parameters.");
}
