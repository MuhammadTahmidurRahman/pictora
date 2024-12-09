// photogallery.js

// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig2 = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

const app2 = initializeApp(firebaseConfig2);
const auth2 = getAuth();
const storage2 = getStorage();

let currentFolderName = "";

async function downloadAllPhotosAsZip(folderName) {
  const folderRef = storageRef(storage2, folderName);
  const listResult = await listAll(folderRef);

  if (listResult.items.length === 0) {
    alert("No photos available.");
    return;
  }

  const blobPromises = listResult.items.map(async (itemRef) => {
    const photoUrl = await getDownloadURL(itemRef);
    const response = await fetch(photoUrl);
    return response.blob();
  });

  const blobs = await Promise.all(blobPromises);

  const zip = new JSZip();
  blobs.forEach((blob, index) => {
    const fileName = `photo_${index + 1}.jpg`;
    zip.file(fileName, blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "All_Photos.zip");
  alert("Photos downloaded successfully.");
}

async function fetchImages(folderName) {
  currentFolderName = folderName;
  try {
    const folderRef = storageRef(storage2, folderName);
    const result = await listAll(folderRef);

    const photoGrid = document.getElementById("photoGrid");
    photoGrid.innerHTML = ""; // Clear any previous content

    if (result.items.length === 0) {
      return;
    }

    const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));
    urls.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      photoGrid.appendChild(img);
    });

    let downloadAllBtn = document.getElementById("downloadAllBtn");
    if (!downloadAllBtn) {
      downloadAllBtn = document.createElement("button");
      downloadAllBtn.id = "downloadAllBtn";
      downloadAllBtn.textContent = "Download All Photos";
      downloadAllBtn.addEventListener("click", () => {
        downloadAllPhotosAsZip(folderName);
      });
      const galleryContainer = document.getElementById("galleryContainer");
      galleryContainer.appendChild(downloadAllBtn);
    }

  } catch (error) {
    console.error("Error loading photos:", error);
  }
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back(); 
});

onAuthStateChanged(auth2, (user) => {
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
