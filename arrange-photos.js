import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, listAll } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "join_event.html";
});

// Load Guest Folders
async function loadGuestFolders(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const participants = roomData.participants || {};

      // Get the guest folders
      const guestFoldersContainer = document.getElementById("guestFoldersContainer");
      guestFoldersContainer.innerHTML = ""; // Clear any previous content

      // Iterate over the guests and create folder items
      Object.entries(participants).forEach(([guestId, guestData]) => {
        if (guestId !== roomData.hostId) {  // Exclude the host
          const folderItem = document.createElement("div");
          folderItem.classList.add("guest-folder-item");
          folderItem.innerHTML = `
            <img class="guest-photo" src="${guestData.photoUrl || 'fallback.png'}" alt="Guest Photo" />
            <span class="guest-name">${guestData.name}</span>
          `;

          folderItem.addEventListener("click", () => {
            viewArrangedPhotos(guestData.folderPath, guestId);
          });

          guestFoldersContainer.appendChild(folderItem);
        }
      });
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading guest folders:", error);
    alert("Failed to load guest folders.");
  }
}

// View Arranged Photos for a Guest
async function viewArrangedPhotos(folderPath, guestId) {
  try {
    const folderRef = storageRef(storage, `rooms/${eventCode}/${guestId}/${folderPath}`);
    const listResult = await listAll(folderRef);

    const photosContainer = document.createElement("div");
    photosContainer.classList.add("photos-container");

    listResult.items.forEach(async (itemRef) => {
      const photoUrl = await getDownloadURL(itemRef);
      const photoElement = document.createElement("img");
      photoElement.src = photoUrl;
      photoElement.classList.add("arranged-photo");
      photosContainer.appendChild(photoElement);
    });

    // Show the photos container to the host
    document.body.appendChild(photosContainer);

  } catch (error) {
    console.error("Error fetching arranged photos:", error);
    alert("Failed to load arranged photos.");
  }
}

// Get Event Code from URL and Load Folders
const eventCode = new URLSearchParams(window.location.search).get("eventCode");
if (eventCode) {
  loadGuestFolders(eventCode);
} else {
  alert("Event Code is missing!");
  window.location.href = "join_event.html";
}
