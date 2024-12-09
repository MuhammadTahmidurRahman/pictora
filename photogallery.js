// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

async function fetchImages(folderName) {
  try {
    const folderRef = storageRef(storage, folderName);
    const result = await listAll(folderRef);

    const photoGrid = document.getElementById("photoGrid");
    // Clear any placeholder text
    photoGrid.innerHTML = "";

    if (result.items.length === 0) {
      // No photos found, just don't show anything
      return;
    }

    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
    urls.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      photoGrid.appendChild(img);
    });

  } catch (error) {
    console.error("Error loading photos:", error);
    // No message needed, just fail silently or show alert if you want
    // But you said no extra messages, so do nothing here
  }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back(); 
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const urlParams = new URLSearchParams(window.location.search);
    const folderName = urlParams.get("folderName");

    if (!folderName) {
      alert("Missing folder path. Unable to load photos.");
      window.history.back();
      return;
    }

    fetchImages(folderName);
  } else {
    alert("You must be signed in to view photos.");
    window.location.href = "login.html";
  }
});
