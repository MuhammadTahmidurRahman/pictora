// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, update, push, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// Toggle Add Guest Dialog
function toggleDialog(show) {
  const dialog = document.getElementById("addGuestDialog");
  dialog.classList.toggle("hidden", !show);
}

// Add Guest Button Logic
document.getElementById("addGuestButton").addEventListener("click", async () => {
  const guestName = document.getElementById("guestName").value.trim();
  const guestEmail = document.getElementById("guestEmail").value.trim();
  const guestPhoto = document.getElementById("guestPhoto").files[0];
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");

  if (!guestName || !guestEmail || !guestPhoto) {
    alert("All fields are required.");
    return;
  }

  try {
    // Generate a unique participant ID
    const participantId = `${eventCode}_${Date.now()}`;
    const folderPath = `rooms/${eventCode}/manualParticipants/${participantId}`;
    const storagePath = `uploads/${participantId}`;

    // Upload guest photo to Firebase Storage
    const fileRef = storageRef(storage, storagePath);
    const uploadResult = await uploadBytes(fileRef, guestPhoto);
    const photoUrl = await fileRef.getDownloadURL();

    console.log(`Photo uploaded to: ${photoUrl}`);

    // Save guest details in Firebase Realtime Database
    const guestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${participantId}`);
    await update(guestRef, {
      name: guestName,
      email: guestEmail,
      referencePhotoUrl: photoUrl,
      folderPath,
    });

    alert("Guest added successfully!");
    toggleDialog(false); // Close the dialog
    loadEventRoom(eventCode); // Reload the room to show the new guest
  } catch (error) {
    console.error("Error adding guest:", error);
    alert("Failed to add guest.");
  }
});

// Load Event Room
async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();

      document.getElementById("roomName").textContent = roomData.roomName || "Event Room";
      document.getElementById("roomCode").textContent = `Code: ${eventCode}`;

      const user = auth.currentUser;
      const hostId = roomData.hostId;

      // Load host info
      const hostData = roomData.participants[hostId];
      if (hostData) {
        document.getElementById("hostName").textContent = hostData.name || "Host";
        document.getElementById("hostPhoto").src = hostData.photoUrl || "fallback.png";

        if (roomData.hostUploadedPhotoFolderPath && user.uid === hostId) {
          const hostFolderIcon = document.createElement("button");
          hostFolderIcon.textContent = "📁";
          hostFolderIcon.classList.add("folder-icon");
          hostFolderIcon.addEventListener("click", () => {
            window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
              eventCode
            )}&folderName=${encodeURIComponent(roomData.hostUploadedPhotoFolderPath)}&userId=${encodeURIComponent(hostId)}`;
          });
          document.getElementById("hostActions").appendChild(hostFolderIcon);
        }

        // Add "Add Member" button for host
        if (user.uid === hostId) {
          const addMemberButton = document.createElement("button");
          addMemberButton.textContent = "Add Member";
          addMemberButton.classList.add("add-member-button");
          addMemberButton.addEventListener("click", () => toggleDialog(true));
          document.getElementById("hostActions").appendChild(addMemberButton);
        }
      }

      // Load guests
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
});

// Load Manual Guests
function loadManualGuests(manualGuests, currentUserId, hostId, eventCode) {
  const guestListElem = document.getElementById("guestList");
  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, true);
    guestListElem.appendChild(guestItem);
  });
}

// Utility to create guest list items
function createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, isManual = false) {
  const guestItem = document.createElement("li");
  guestItem.classList.add("guest-item");
  guestItem.innerHTML = `
    <img class="guest-photo" src="${guestData.photoUrl || guestData.referencePhotoUrl || 'fallback.png'}" alt="Guest Photo" />
    <span class="guest-name">${guestData.name || "Unnamed Guest"}</span>
  `;

  if (guestData.folderPath && currentUserId === hostId) {
    const folderIcon = document.createElement("button");
    folderIcon.textContent = "📁";
    folderIcon.classList.add("folder-icon");
    folderIcon.addEventListener("click", () => {
      window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
        eventCode
      )}&folderName=${encodeURIComponent(guestData.folderPath)}&userId=${encodeURIComponent(guestId)}`;
    });
    guestItem.appendChild(folderIcon);
  }

  return guestItem;
}

// Authentication and load event room
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadEventRoom(eventCode);
    } else {
      alert("Event Code is missing!");
    }
  } else {
    alert("Please log in to access the event room.");
    window.location.href = "login.html";
  }
});
