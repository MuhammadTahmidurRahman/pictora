import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// Load Photos and Event Details
async function loadEventDetails(eventCode) {
  const eventRef = ref(database, `rooms/${eventCode}`);
  const eventSnapshot = await get(eventRef);
  const eventData = eventSnapshot.val();

  if (eventData) {
    document.getElementById("eventName").innerText = eventData.eventName;
    document.getElementById("eventCode").innerText = `Event Code: ${eventCode}`;

    const hostDetails = eventData.host;
    document.getElementById("hostName").innerText = hostDetails.name;
    document.getElementById("hostPhoto").src = hostDetails.photoUrl;
    loadGuests(eventCode);
    loadPhotos(eventCode);
  } else {
    console.error("Event data not found.");
  }
}

// Load Guest List
async function loadGuests(eventCode) {
  const guestsRef = ref(database, `rooms/${eventCode}/guests`);
  const guestSnapshot = await get(guestsRef);
  const guestData = guestSnapshot.val();

  const guestListContainer = document.getElementById("guestList");
  guestListContainer.innerHTML = ""; // Clear the list

  if (guestData) {
    Object.keys(guestData).forEach((guestId) => {
      const guest = guestData[guestId];
      const guestItem = document.createElement("li");
      guestItem.innerText = `${guest.name} (${guest.email})`;
      guestListContainer.appendChild(guestItem);
    });
  }
}

// Load Manual Guest List
async function loadManualGuests(eventCode) {
  const manualGuestsRef = ref(database, `rooms/${eventCode}/manualGuests`);
  const manualGuestSnapshot = await get(manualGuestsRef);
  const manualGuestData = manualGuestSnapshot.val();

  const manualGuestListContainer = document.getElementById("manualGuestList");
  manualGuestListContainer.innerHTML = ""; // Clear the list

  if (manualGuestData) {
    Object.keys(manualGuestData).forEach((guestId) => {
      const guest = manualGuestData[guestId];
      const guestItem = document.createElement("li");
      guestItem.innerText = `${guest.name} (${guest.email})`;
      manualGuestListContainer.appendChild(guestItem);
    });
  }
}

// Load Photos
async function loadPhotos(eventCode) {
  const folderPath = `rooms/${eventCode}/host`; // Path for the room photos
  const folderRef = storageRef(storage, folderPath);
  const photoContainer = document.getElementById("photoContainer");

  try {
    const listResult = await listAll(folderRef);
    photoContainer.innerHTML = ""; // Clear existing photos

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);

      // Create photo thumbnail
      const photoItem = document.createElement("div");
      photoItem.classList.add("photo-item");
      photoItem.innerHTML = `
        <img src="${photoUrl}" alt="Photo">
        <button class="delete-btn">Delete</button>
      `;

      // Add delete functionality
      photoItem.querySelector(".delete-btn").addEventListener("click", async () => {
        await deletePhoto(itemRef.fullPath);
        loadPhotos(eventCode); // Reload photos after deletion
      });

      photoContainer.appendChild(photoItem);
    }
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

// Initialize the Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadEventDetails(eventCode); // Load event and details
    } else {
      alert("Event code is missing.");
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});
