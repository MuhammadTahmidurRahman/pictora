// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();
const storage = getStorage();

// Load Photos
async function loadPhotos(eventCode) {
  const folderPath = `rooms/${eventCode}/host`;
  const folderRef = storageRef(storage, folderPath);
  const photoContainer = document.getElementById("photoContainer");

  try {
    const listResult = await listAll(folderRef);
    photoContainer.innerHTML = "";

    const photoItems = []; // Store photo items for reordering

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);

      // Create photo thumbnail
      const photoItem = document.createElement("div");
      photoItem.classList.add("photo-item");
      photoItem.dataset.path = itemRef.fullPath;

      photoItem.innerHTML = `
        <img src="${photoUrl}" alt="Photo" />
        <button class="delete-btn">Delete</button>
      `;

      // Add delete functionality
      photoItem.querySelector(".delete-btn").addEventListener("click", async () => {
        await deletePhoto(itemRef.fullPath);
        loadPhotos(eventCode);
      });

      photoItems.push(photoItem);
    }

    // Append photos to container
    photoItems.forEach((item) => {
      photoContainer.appendChild(item);
    });
  } catch (error) {
    console.error("Error loading photos:", error);
  }
}

// Delete Photo
async function deletePhoto(photoPath) {
  const photoRef = storageRef(storage, photoPath);

  try {
    await deleteObject(photoRef);
    alert("Photo deleted successfully.");
  } catch (error) {
    console.error("Error deleting photo:", error);
    alert("Failed to delete photo.");
  }
}

// Drag-and-Drop Reordering
function enableDragAndDrop() {
  const photoContainer = document.getElementById("photoContainer");
  let draggedItem = null;

  photoContainer.addEventListener("dragstart", (e) => {
    draggedItem = e.target;
    e.target.style.opacity = "0.5";
  });

  photoContainer.addEventListener("dragend", (e) => {
    e.target.style.opacity = "1";
  });

  photoContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    const closestItem = document.elementFromPoint(e.clientX, e.clientY);
    if (closestItem && closestItem !== draggedItem && closestItem.classList.contains("photo-item")) {
      photoContainer.insertBefore(draggedItem, closestItem);
    }
  });
}

// Send Sorted Photos to Flask (ngrok URL)
async function sendSortedPhotos(eventCode, sortedPaths) {
  const ngrokUrl = "YOUR_NGROK_URL_HERE"; // Replace with your actual ngrok URL
  const response = await fetch(`${ngrokUrl}/sort_photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventCode, sortedPaths }),
  });

  const result = await response.json();
  if (result.success) {
    alert("Photos sorted successfully.");
    loadPhotos(eventCode); // Reload photos after sorting
  } else {
    alert("Failed to sort photos.");
  }
}

// Initialize Arrange Room Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadPhotos(eventCode);
      enableDragAndDrop();

      // Add event listener for "Arrange Photos" button
      document.getElementById("arrangePhotosBtn").addEventListener("click", () => {
        const sortedPaths = []; // Collect sorted image paths

        const photoItems = document.querySelectorAll(".photo-item");
        photoItems.forEach((item) => {
          sortedPaths.push(item.dataset.path);
        });

        // Send sorted photos to Flask backend
        sendSortedPhotos(eventCode, sortedPaths);
      });
    } else {
      alert("Event code is missing.");
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});
