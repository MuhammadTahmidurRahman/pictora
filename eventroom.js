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

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "join_event.html";
});
document.getElementById("closeDialogButton").addEventListener("click", () => {
  toggleDialog(false);  // Close the dialog
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

        // Add "Add Member" button for the host
        if (user.uid === hostId) {
          const arrangePhotoButton = document.createElement("button");
          arrangePhotoButton.textContent = "Arrange Photo";
          arrangePhotoButton.classList.add("arrange-photo-button");

          arrangePhotoButton.addEventListener("click", () => {
            // Redirect to arrange_photos.html with eventCode
            window.location.href = `arrangedphoto.html?eventCode=${encodeURIComponent(eventCode)}`;
          });

          hostActions.appendChild(arrangePhotoButton);
        }

        // Add "Add Member" button for the host
        if (user.uid === hostId) {
          const addMemberButton = document.createElement("button");
          addMemberButton.textContent = "Add Member";
          addMemberButton.classList.add("add-member-button");
          addMemberButton.addEventListener("click", () => {
            toggleDialog(true);
          });
          hostActions.appendChild(addMemberButton);
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

// Add functionality to the Upload Photos button
document.getElementById("uploadPhotoButton").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to upload photos.");
    return;
  }

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const folderPath = `rooms/${eventCode}/${user.uid}`;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;

  input.addEventListener("change", async () => {
    const files = input.files;
    if (files.length === 0) return;

    try {
      for (const file of files) {
        const fileRef = storageRef(storage, `${folderPath}/${file.name}`);
        await uploadBytes(fileRef, file);
      }
      alert("Photos uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos.");
    }
  });

  input.click();
});

// Create a function to handle adding guests
document.getElementById("addGuestButton").addEventListener("click", async () => {
  const guestName = document.getElementById("guestName").value.trim();
  const guestEmail = document.getElementById("guestEmail").value.trim();
  const guestPhoto = document.getElementById("guestPhoto").files[0];  // This is the image to upload
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");

  if (!guestName || !guestEmail || !guestPhoto) {
    alert("All fields are required.");
    return;
  }

  const participantId = `${eventCode}_${Date.now()}`;
  const folderPath = `rooms/${eventCode}/${participantId}`;
  const storagePath = `uploads/${participantId}`;

  try {
    // Upload the guest photo to storage
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, guestPhoto);
    const photoUrl = await getDownloadURL(fileRef);  // Get the download URL for the uploaded photo

    // Now, update the participant in the database
    const participantRef = dbRef(database, `rooms/${eventCode}/participants/${participantId}`);
    await update(participantRef, {
      name: guestName,
      email: guestEmail,
      photoUrl,
      folderPath,  // Add the folder path for the participant
    });

    // Ensure the profile picture is fetched from `photoUrl` and uploaded to the participant's folder
    const response = await fetch(photoUrl); // Fetch the uploaded profile photo using its URL
    const blob = await response.blob();  // Convert the fetched image to a Blob
    const participantImageRef = storageRef(storage, `${folderPath}/${guestName.replace(/\s+/g, "_")}_profilePhoto.jpg`);  // Save with dynamic file name

    // Upload the profile picture to the folder path
    await uploadBytes(participantImageRef, blob);

    alert("Guest added successfully and profile picture uploaded.");
    toggleDialog(false);
    loadEventRoom(eventCode);
  } catch (error) {
    console.error("Error adding guest:", error);
    alert("Failed to add guest.");
  }
});

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
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode);
    manualGuestListElem.appendChild(guestItem);
  });
}

// Create Guest Item Element
function createGuestItem(guestId, guestData, currentUserId, hostId, eventCode) {
  const guestItem = document.createElement("div");
  guestItem.classList.add("guest-item");

  const guestPhoto = document.createElement("img");
  guestPhoto.src = guestData.photoUrl || "default-avatar.png";
  guestPhoto.alt = guestData.name;

  const guestName = document.createElement("span");
  guestName.textContent = guestData.name || "Guest";

  guestItem.appendChild(guestPhoto);
  guestItem.appendChild(guestName);

  // Show folder icon if the guest has a folder path
  if (guestData.folderPath) {
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

// Function to toggle dialog visibility
function toggleDialog(visible) {
  const dialog = document.getElementById("addGuestDialog");
  dialog.style.display = visible ? "block" : "none";
}

// Initialize event loading
const eventCode = new URLSearchParams(window.location.search).get("eventCode");
loadEventRoom(eventCode);
