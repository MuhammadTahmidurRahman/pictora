// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
const storage = getStorage();
const database = getDatabase(app);

// Load Photos
async function loadPhotos(eventCode) {
  const folderPath = `rooms/${eventCode}/host`;  // Path for the room photos
  const folderRef = storageRef(storage, folderPath);
  const photoContainer = document.getElementById("photoContainer");

  try {
    const listResult = await listAll(folderRef);
    photoContainer.innerHTML = "";

    const photoItems = []; // Store photo items for reordering
    const allPaths = [];  // Array to hold all photo paths

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
        loadPhotos(eventCode); // Reload photos after deletion
      });

      photoItems.push(photoItem);
      allPaths.push(itemRef.fullPath); // Add photo path to the array
    }

    // Append photos to container
    photoItems.forEach((item) => {
      photoContainer.appendChild(item);
    });

    // After loading all photos, send them to the backend for sorting
    sendSortedPhotos(eventCode, allPaths); 

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

// Send Sorted Photos to Flask (ngrok URL)
async function sendSortedPhotos(eventCode, sortedPaths) {
  const ngrokUrl = "https://c61f-34-125-41-195.ngrok-free.app/"; // Replace with your actual ngrok URL
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
  } else {
    alert("Failed to sort photos.");
  }
}

// Update sortPhotoRequest field when host visits the page
async function updateSortPhotoRequest(eventCode) {
  const hostRef = ref(database, `rooms/${eventCode}/host`);
  await set(hostRef, {
    sortPhotoRequest: 1.0,  // Update the field to a decimal value
  }).then(() => {
    console.log("sortPhotoRequest field updated to 1.0.");
  }).catch((error) => {
    console.error("Error updating sortPhotoRequest field:", error);
  });
}

// Initialize Arrange Room Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadPhotos(eventCode); // Load and sort photos when eventCode is available
      updateSortPhotoRequest(eventCode);  // Update sortPhotoRequest when host visits the page
    } else {
      alert("Event code is missing.");
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});
