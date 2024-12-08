// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// Function to load and display guest list
async function loadGuests(guests, containerId) {
  const guestListContainer = document.getElementById(containerId);
  guestListContainer.innerHTML = ""; // Clear previous list

  guests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.innerHTML = `
      <img src="${guestData.photoUrl || "fallback.png"}" alt="Guest Photo" class="guest-photo" />
      <span>${guestData.name || "Unnamed Guest"}</span>
      <button class="folder-icon" data-folder-path="${guestData.folderPath || ""}">
        📁 View Photos
      </button>
    `;
    guestListContainer.appendChild(guestItem);

    // Add event listener to view photos
    const folderButton = guestItem.querySelector(".folder-icon");
    folderButton.addEventListener("click", () => {
      if (guestData.folderPath) {
        fetchAndDisplayPhotos(guestData.folderPath, "photoDialogContent");
        toggleDialog(true); // Open photo dialog
      } else {
        alert("No photos available for this guest.");
      }
    });
  });
}

async function downloadGuestPhotosAsZip(folderPath, guestName) {
  const JSZip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
  const { saveAs } = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
  const zip = new JSZip();

  try {
    const folderRef = storageRef(storage, folderPath);
    const listResult = await listAll(folderRef);

    if (listResult.items.length === 0) {
      alert("No photos available for this guest.");
      return;
    }

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const fileName = itemRef.name;
      zip.file(fileName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${guestName}_Photos.zip`);
    alert("Photos downloaded successfully.");
  } catch (error) {
    console.error("Error downloading photos:", error);
    alert("Failed to download photos.");
  }
}

async function loadGuests(guests, containerId) {
  const guestListContainer = document.getElementById(containerId);
  guestListContainer.innerHTML = ""; // Clear previous list

  guests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.innerHTML = `
      <img src="${guestData.photoUrl || "fallback.png"}" alt="Guest Photo" class="guest-photo" />
      <span>${guestData.name || "Unnamed Guest"}</span>
      <button class="folder-icon" data-folder-path="${guestData.folderPath || ""}">
        📁 View Photos
      </button>
      <button class="download-button" data-folder-path="${guestData.folderPath || ""}">
        📦 Download Photos
      </button>
    `;
    guestListContainer.appendChild(guestItem);

    // Add event listener to view photos
    const folderButton = guestItem.querySelector(".folder-icon");
    folderButton.addEventListener("click", () => {
      if (guestData.folderPath) {
        fetchAndDisplayPhotos(guestData.folderPath, "photoDialogContent");
        toggleDialog(true); // Open photo dialog
      } else {
        alert("No photos available for this guest.");
      }
    });

    // Add event listener to download photos
    const downloadButton = guestItem.querySelector(".download-button");
    downloadButton.addEventListener("click", () => {
      if (guestData.folderPath) {
        downloadGuestPhotosAsZip(guestData.folderPath, guestData.name || "Unnamed Guest");
      } else {
        alert("No photos available for this guest.");
      }
    });
  });
}

// Function to load and display manual guest list
async function loadManualGuests(manualGuests, containerId) {
  const manualGuestListContainer = document.getElementById(containerId);
  manualGuestListContainer.innerHTML = ""; // Clear previous list

  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.innerHTML = `
      <span>${guestData.name || "Unnamed Manual Guest"}</span>
    `;
    manualGuestListContainer.appendChild(guestItem);
  });
}

// Function to fetch photos and display them
async function fetchAndDisplayPhotos(folderPath, containerId) {
  const photoContainer = document.getElementById(containerId);
  photoContainer.innerHTML = ""; // Clear any previous content

  try {
    const folderRef = storageRef(storage, folderPath);
    const listResult = await listAll(folderRef);

    if (listResult.items.length === 0) {
      photoContainer.textContent = "No Photos Available.";
      return;
    }

    listResult.items.forEach(async (itemRef) => {
      const photoUrl = await getDownloadURL(itemRef);
      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "Photo";
      img.classList.add("photo-thumbnail");
      photoContainer.appendChild(img);
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    photoContainer.textContent = "Failed to load photos.";
  }
}

// Function to toggle the photo dialog
function toggleDialog(show) {
  const dialog = document.getElementById("photoDialog");
  dialog.style.display = show ? "flex" : "none";
}

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
      }

      // Load participants and manual participants
      const participants = roomData.participants || {};
      const guests = Object.entries(participants).filter(([key]) => key !== hostId);
      loadGuests(guests, "guestList");

      const manualGuests = roomData.manualParticipants || {};
      loadManualGuests(Object.entries(manualGuests), "manualGuestList");
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading event room:", error);
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
