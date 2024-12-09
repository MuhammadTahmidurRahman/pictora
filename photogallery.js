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

async function downloadAllPhotosAsZip(folderName) {
  const JSZip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
  const { saveAs } = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
  const zip = new JSZip();

  try {
    const folderRef = storageRef(storage, folderName);
    const listResult = await listAll(folderRef);

    if (listResult.items.length === 0) {
      alert("No photos available.");
      return;
    }

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const fileName = itemRef.name;
      zip.file(fileName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "All_Photos.zip");
    alert("Photos downloaded successfully.");
  } catch (error) {
    console.error("Error downloading photos:", error);
    alert("Failed to download photos.");
  }
}

// Fetch images and populate the gallery
async function fetchImages(folderName) {
  try {
    const folderRef = storageRef(storage, folderName);
    const result = await listAll(folderRef);

    if (result.items.length === 0) {
      document.getElementById("emptyMessage").textContent = "No photos uploaded.";
      return;
    }

    const photoGrid = document.getElementById("photoGrid");
    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));

    document.getElementById("emptyMessage").style.display = "none";
    urls.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      photoGrid.appendChild(img);
    });

    // Add a download all button below the gallery
    let downloadAllBtn = document.getElementById("downloadAllBtn");
    if (!downloadAllBtn) {
      downloadAllBtn = document.createElement("button");
      downloadAllBtn.id = "downloadAllBtn";
      downloadAllBtn.textContent = "Download All Photos";
      downloadAllBtn.addEventListener("click", () => {
        downloadAllPhotosAsZip(folderName);
      });
      document.getElementById("photoGalleryContainer").appendChild(downloadAllBtn);
    }

  } catch (error) {
    console.error("Error loading photos:", error);
    alert("Error loading photos. Please try again.");
  }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back(); 
});

// Ensure user is authenticated before loading photos
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
