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

// Load Event Room and Data
async function loadEventRoom(eventCode) {
  try {
    const roomRef = ref(database, `rooms/${eventCode}`);
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
      }

      // Load guests list (Guests and Manual Guests)
      const participants = roomData.participants || {};
      const guests = Object.entries(participants).filter(([key]) => key !== hostId);
      loadGuests(guests, user.uid, hostId, eventCode);

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

// Create a Guest or Manual Guest List Item
function createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, isManual = false) {
  const guestItem = document.createElement("li");
  guestItem.classList.add("guest-item");
  guestItem.innerHTML = `
    <img class="guest-photo" src="${guestData.photoUrl}" alt="Guest Photo" />
    <span class="guest-name">${guestData.name}</span>
  `;

  if (guestData.folderPath) {
    const folderIcon = document.createElement("button");
    folderIcon.textContent = "📁";
    folderIcon.classList.add("folder-icon");

    if (currentUserId === hostId || currentUserId === guestId) {
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

// Delete Manual Guest
async function deleteManualGuest(eventCode, guestId, folderPath) {
  try {
    const guestRef = ref(database, `rooms/${eventCode}/manualParticipants/${guestId}`);
    await remove(guestRef);

    const folderRef = storageRef(storage, folderPath);
    const listResult = await listAll(folderRef);
    for (const itemRef of listResult.items) {
      await deleteObject(itemRef);
    }

    alert("Guest deleted successfully.");
    loadEventRoom(eventCode);
  } catch (error) {
    console.error("Error deleting guest:", error);
    alert("Failed to delete guest.");
  }
}

// Initialize Arrange Room Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadEventRoom(eventCode); // Load event data and guests
    } else {
      alert("Event code is missing.");
      window.location.href = "join_event.html";
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});

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

// Update sortPhotoRequest field and increment it when host visits the page

async function updateSortPhotoRequest(eventCode) {
    const hostRef = ref(database, `rooms/${eventCode}/host`);
  
    try {
      // Get the current sortPhotoRequest value
      const snapshot = await get(hostRef);
      let currentSortValue = snapshot.exists() ? snapshot.val().sortPhotoRequest : 0.0;
  
      // Increment the value by 1
      const newSortValue = currentSortValue + 1.0;
  
      // Update the sortPhotoRequest field in the database
      await set(hostRef, {
        sortPhotoRequest: newSortValue,
      });
  
      console.log(`sortPhotoRequest field updated to ${newSortValue}.`);
  
    } catch (error) {
      console.error("Error updating sortPhotoRequest field:", error);
    }
  }
  
  // Initialize Arrange Room Page
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const eventCode = new URLSearchParams(window.location.search).get("eventCode");
      if (eventCode) {
        loadPhotos(eventCode); // Load and sort photos when eventCode is available
        updateSortPhotoRequest(eventCode);  // Increment and update sortPhotoRequest each time
      } else {
        alert("Event code is missing.");
      }
    } else {
      alert("Please log in to access this page.");
      window.location.href = "login.html";
    }
  });