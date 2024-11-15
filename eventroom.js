// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "join_event.html"; // Navigate to join_event.html
});

// Load Event Room and Data
async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();

      // Display room name and code
      document.getElementById("roomName").textContent = roomData.roomName || "Event Room";
      document.getElementById("roomCode").textContent = `Code: ${eventCode}`;

      const user = auth.currentUser;

      // Load host information
      const hostId = roomData.hostId;
      const hostData = roomData.participants[hostId];
      if (hostData) {
        document.getElementById("hostName").textContent = hostData.name || "Host";
        document.getElementById("hostPhoto").src = hostData.photoUrl || "fallback.png";

        // Add folder icon for host if they have uploaded photos
        if (roomData.hostUploadedPhotoFolderPath) {
          const hostFolderIcon = document.createElement("button");
          hostFolderIcon.textContent = "📁"; // Folder icon
          hostFolderIcon.classList.add("folder-icon");
          hostFolderIcon.addEventListener("click", () => {
            // Navigate to photogallery.html with host's folder
            window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
              eventCode
            )}&folderName=${encodeURIComponent(roomData.hostUploadedPhotoFolderPath)}&userId=${encodeURIComponent(hostId)}`;
          });
          document.getElementById("hostInfo").appendChild(hostFolderIcon);
        }
      }

      // Load guests list
      const participants = roomData.participants || {};
      const guests = Object.entries(participants).filter(([key]) => key !== hostId);

      loadGuests(guests, user.uid, hostId, eventCode);
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading event room:", error);
  }
}

// Load Guests and Display Their Profile Pictures and Folder Icons
function loadGuests(guests, currentUserId, hostId, eventCode) {
  const guestListElem = document.getElementById("guestList");
  guestListElem.innerHTML = "";

  guests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.classList.add("guest-item");
    guestItem.innerHTML = `
      <img class="guest-photo" src="${guestData.photoUrl || 'fallback.png'}" alt="Guest Photo" />
      <span class="guest-name">${guestData.name || "Unnamed Guest"}</span>
    `;

    // Add folder icon if the guest has uploaded photos
    if (guestData.folderPath) {
      const folderIcon = document.createElement("button");
      folderIcon.textContent = "📁"; // Folder icon
      folderIcon.classList.add("folder-icon");

      // Folder icon is clickable only if the current user is the host or the guest themselves
      if (currentUserId === hostId || currentUserId === guestId) {
        folderIcon.addEventListener("click", () => {
          // Navigate to photogallery.html with guest's folder
          window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
            eventCode
          )}&folderName=${encodeURIComponent(guestData.folderPath)}&userId=${encodeURIComponent(guestId)}`;
        });
      } else {
        folderIcon.disabled = true; // Disable for other users
      }

      guestItem.appendChild(folderIcon);
    }

    guestListElem.appendChild(guestItem);
  });
}

// Check Authentication and Load Event Room
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Get the event code from URL parameters
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadEventRoom(eventCode); // Load the event room
    } else {
      alert("Event Code is missing!");
      window.location.href = "join_event.html"; // Redirect to join_event.html
    }
  } else {
    alert("Please log in to access the event room.");
    window.location.href = "login.html"; // Redirect to login page
  }
});
