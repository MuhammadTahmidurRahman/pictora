// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, push, update, get, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
          hostFolderIcon.textContent = "📁";
          hostFolderIcon.classList.add("folder-icon");

          // Only the host can click the host's folder
          if (user.uid === hostId) {
            hostFolderIcon.addEventListener("click", () => {
              window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
                eventCode
              )}&folderName=${encodeURIComponent(roomData.hostUploadedPhotoFolderPath)}&userId=${encodeURIComponent(hostId)}`;
            });
          } else {
            hostFolderIcon.disabled = true;
          }

          document.getElementById("hostActions").appendChild(hostFolderIcon);
        }

        // Add "Add Member" button for the host
        if (user.uid === hostId) {
          const addMemberButton = document.createElement("button");
          addMemberButton.textContent = "Add Member";
          addMemberButton.classList.add("add-member-button");
          addMemberButton.addEventListener("click", () => toggleDialog(true));
          document.getElementById("hostActions").appendChild(addMemberButton);
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
  const guestListElem = document.getElementById("guestList");
  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, true);
    guestListElem.appendChild(guestItem);
  });
}

// Create a Guest or Manual Guest List Item
function createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, isManual = false) {
  const guestItem = document.createElement("li");
  guestItem.classList.add("guest-item");
  guestItem.innerHTML = `
    <img class="guest-photo" src="${guestData.photoUrl || guestData.referencePhotoUrl || 'fallback.png'}" alt="Guest Photo" />
    <span class="guest-name">${guestData.name || "Unnamed Guest"}</span>
  `;

  // Add folder icon if the guest has a folder
  if (guestData.folderPath) {
    const folderIcon = document.createElement("button");
    folderIcon.textContent = "📁";
    folderIcon.classList.add("folder-icon");

    if (currentUserId === hostId) {
      folderIcon.addEventListener("click", () => {
        window.location.href = `photogallery.html?eventCode=${encodeURIComponent(
          eventCode
        )}&folderName=${encodeURIComponent(guestData.folderPath)}&userId=${encodeURIComponent(guestId)}`;
      });
    } else {
      folderIcon.disabled = true;
    }

    guestItem.appendChild(folderIcon);
  }

  // Add "Delete Guest" button for manual guests
  if (isManual && currentUserId === hostId) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Guest";
    deleteButton.classList.add("delete-guest-button");
    deleteButton.addEventListener("click", async () => {
      await deleteManualGuest(eventCode, guestId, guestData.folderPath);
    });
    guestItem.appendChild(deleteButton);
  }

  return guestItem;
}

// Toggle Add Guest Dialog
function toggleDialog(show) {
  const dialog = document.getElementById("addGuestDialog");
  dialog.classList.toggle("hidden", !show);
}

// Add Member Button Logic
document.getElementById("addGuestButton").addEventListener("click", async () => {
  const guestName = document.getElementById("guestName").value;
  const guestEmail = document.getElementById("guestEmail").value;
  const guestPhoto = document.getElementById("guestPhoto").files[0];
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");

  if (!guestName || !guestEmail || !guestPhoto) {
    alert("All fields are required.");
    return;
  }

  const folderPath = `rooms/${eventCode}/manualParticipants/${eventCode}_${Date.now()}`;
  const storagePath = `uploads/${eventCode}_${Date.now()}`;

  try {
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, guestPhoto);
    const photoUrl = await fileRef.getDownloadURL();

    const manualGuestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${eventCode}_${Date.now()}`);
    await update(manualGuestRef, {
      name: guestName,
      email: guestEmail,
      referencePhotoUrl: photoUrl,
      folderPath,
    });

    alert("Guest added successfully.");
    toggleDialog(false); // Close the dialog
    loadEventRoom(eventCode); // Reload the room to show new guest
  } catch (error) {
    console.error("Error adding guest:", error);
    alert("Failed to add guest.");
  }
});

// Close Dialog Logic
document.getElementById("closeDialogButton").addEventListener("click", () => {
  toggleDialog(false);
});

// Delete Manual Guest
async function deleteManualGuest(eventCode, guestId, folderPath) {
  try {
    const guestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${guestId}`);
    await remove(guestRef);

    const folderRef = storageRef(storage, folderPath);
    await deleteObject(folderRef);

    alert("Guest deleted successfully.");
    loadEventRoom(eventCode);
  } catch (error) {
    console.error("Error deleting guest:", error);
    alert("Failed to delete guest.");
  }
}

// Check Authentication and Load Event Room
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
