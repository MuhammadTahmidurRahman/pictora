// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getDatabase, 
  ref as dbRef, 
  get, 
  set 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  getDownloadURL, 
  listAll, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
  window.location.href = "eventroom.html";
});


/**
 * Existing Functionality
 */

// Function to download guest photos as a ZIP file
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

// Function to load guests into the DOM
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

// Function to load manual guests into the DOM
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

// Function to fetch and display photos in a dialog
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

// Function to toggle the photo dialog visibility
function toggleDialog(show) {
  const dialog = document.getElementById("photoDialog");
  dialog.style.display = show ? "flex" : "none";
}

// Function to view host photo
async function viewHostPhoto(hostData) {
  const hostMessage = document.getElementById("hostMessage");
  const folderPath = hostData.photoFolderPath; // Assuming photoFolderPath is the folder path of the host's photos in Firebase Storage

  if (folderPath) {
    try {
      const folderRef = storageRef(storage, folderPath);
      const listResult = await listAll(folderRef);

      if (listResult.items.length === 0) {
        hostMessage.textContent = "No photos available for the host.";
        return;
      }

      // Display first photo from the folder
      const photoUrl = await getDownloadURL(listResult.items[0]);
      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "Host Photo";
      img.classList.add("photo-thumbnail");
      hostMessage.innerHTML = ""; // Clear any previous message
      hostMessage.appendChild(img);
    } catch (error) {
      console.error("Error fetching host photo:", error);
      hostMessage.textContent = "Failed to load host photo.";
    }
  } else {
    hostMessage.textContent = "No photo folder available for the host.";
  }
}

// Function to download host photos as a ZIP file
async function downloadHostPhoto(hostData) {
  const hostMessage = document.getElementById("hostMessage");
  const folderPath = hostData.photoFolderPath; // Assuming photoFolderPath is the folder path of the host's photos in Firebase Storage

  if (folderPath) {
    try {
      const folderRef = storageRef(storage, folderPath);
      const listResult = await listAll(folderRef);

      if (listResult.items.length === 0) {
        hostMessage.textContent = "No photos available to download for the host.";
        return;
      }

      const JSZip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
      const { saveAs } = await import('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
      const zip = new JSZip();

      // Loop through all photos in the folder and add them to the zip file
      for (const itemRef of listResult.items) {
        const photoUrl = await getDownloadURL(itemRef);
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const fileName = itemRef.name;
        zip.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "host_photos.zip");
      alert("Host photos downloaded successfully.");
    } catch (error) {
      console.error("Error downloading host photos:", error);
      hostMessage.textContent = "Failed to download host photos.";
    }
  } else {
    hostMessage.textContent = "No photo folder available for the host.";
  }
}

// Function to load event room details and participants
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

        // Add event listeners for the host photo buttons
        document.getElementById("viewHostPhotoBtn").addEventListener("click", () => viewHostPhoto(hostData));
        document.getElementById("downloadHostPhotoBtn").addEventListener("click", () => downloadHostPhoto(hostData));
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

/**
 * New Backend Connection Functionality
 */

// Function to load photos for arranging the room
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
      photoItem.dataset.path = itemRef.folderPath;

      photoItem.innerHTML = `  
        <img src="${photoUrl}" alt="Photo" />
        <button class="delete-btn">Delete</button>
      `;

      // Add delete functionality
      photoItem.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this photo?")) {
          await deletePhoto(itemRef.folderPath);
          loadPhotos(eventCode); // Reload photos after deletion
        }
      });

      photoItems.push(photoItem);
      allPaths.push(itemRef.folderPath); // Add photo path to the array
    }

    // Append photos to container
    photoItems.forEach((item) => {
      photoContainer.appendChild(item);
    });

  } catch (error) {
    console.error("Error loading photos:", error);
    photoContainer.textContent = "Failed to load photos.";
  }
}

// Function to delete a photo from Firebase Storage
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
  const hostRef = dbRef(database, `rooms/${eventCode}/host`);

  try {
    // Get the current sortPhotoRequest value
    const snapshot = await get(hostRef);
    let currentSortValue = 0.0;

    if (snapshot.exists()) {
      const hostData = snapshot.val();
      currentSortValue = hostData.sortPhotoRequest !== undefined ? hostData.sortPhotoRequest : 0.0;
    }

    // Increment the value by 1
    const newSortValue = currentSortValue + 1.0;

    // Update the sortPhotoRequest field in the database while preserving existing data
    await set(hostRef, {
      ...snapshot.val(),  // Preserve existing host data
      sortPhotoRequest: newSortValue,
    });

    console.log(`sortPhotoRequest field updated to ${newSortValue}.`);

  } catch (error) {
    console.error("Error updating sortPhotoRequest field:", error);
  }
}

/**
 * Authentication and Initialization
 */

// Check Authentication and Initialize Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get("eventCode");

    if (eventCode) {
      // Load Event Room Details
      loadEventRoom(eventCode);

      // Load and arrange photos for the room
      loadPhotos(eventCode);

      // Update sortPhotoRequest each time the host visits the page
      updateSortPhotoRequest(eventCode);
    } else {
      alert("Event Code is missing!");
      window.location.href = "join_event.html";
    }
  } else {
    alert("Please log in to access the event room.");
    window.location.href = "login.html";
  }
});
