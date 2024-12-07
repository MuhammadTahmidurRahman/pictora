// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, update, get, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// Wait for the DOM content to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Back button functionality
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "eventroom.html";
    });
  }

  const closeDialogButton = document.getElementById("closeDialogButton");
  if (closeDialogButton) {
    closeDialogButton.addEventListener("click", () => {
      toggleDialog(false);  // Close the dialog
    });
  }

  // Check authentication and load event room
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const eventCode = new URLSearchParams(window.location.search).get("eventCode");
      if (eventCode) {
        loadEventRoom(eventCode);
      } else {
        alert("Event Code is missing!");
        window.location.href = "join_event.html";
      }
    } else {
      alert("Please log in to access the event room.");
      window.location.href = "login.html";
    }
  });
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

      // Reset host actions
      const hostActions = document.getElementById("hostActions");
      hostActions.innerHTML = "";

      // Load host information
      const hostId = roomData.hostId;
      const hostData = roomData.participants[hostId];
      if (hostData) {
        document.getElementById("hostName").textContent = hostData.name || "Host";
        document.getElementById("hostPhoto").src = hostData.photoUrl || "fallback.png";

        // Add folder icon for host if they have uploaded photos
        if (hostData.folderPath) {
          const hostFolderIcon = document.createElement("button");
          hostFolderIcon.textContent = "📁";
          hostFolderIcon.classList.add("folder-icon");

          if (user.uid === hostId) {
            hostFolderIcon.addEventListener("click", () => {
              window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
                eventCode
              )}&folderName=${encodeURIComponent(hostData.folderPath)}&userId=${encodeURIComponent(hostId)}`;
            });
          } else {
            hostFolderIcon.disabled = true;
          }

          hostActions.appendChild(hostFolderIcon);
        }
      }

      // Load guests list
      const participants = roomData.participants || {};
      const guests = Object.entries(participants).filter(([key]) => key !== hostId);

      loadGuests(guests, user.uid, hostId, eventCode);

      // Load manual guests
      const manualGuests = roomData.manualParticipants || {};
      loadManualGuests(Object.entries(manualGuests), user.uid, hostId, eventCode);
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
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode);
    guestListElem.appendChild(guestItem);
  });
}

// Load Manual Guests
function loadManualGuests(manualGuests, currentUserId, hostId, eventCode) {
  const manualGuestListElem = document.getElementById("manualGuestList");
  manualGuestListElem.innerHTML = "";

  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, true);
    manualGuestListElem.appendChild(guestItem);
  });
}

//
