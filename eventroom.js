
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

/// Add Guest Button Logic
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

    // Now, update the manual guest with the photo URL and folder path
    const manualGuestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${participantId}`);
    await update(manualGuestRef, {
      name: guestName,
      email: guestEmail,
      photoUrl,
      folderPath,
    });

    // Ensure the profile picture is also uploaded to the folder path of the manual participant
    // Fetch the profile photo URL from the data
    const profileImageUrl = "https://firebasestorage.googleapis.com/v0/b/pictora-7f0ad.appspot.com/o/uploads%2F4B3AC5YZ_1731691793585?alt=media&token=3a62378c-4b97-40aa-928b-0b7eae140c5d";  // Provided URL

    // Download the profile image from the provided URL and upload it to the participant's folder
    const response = await fetch(profileImageUrl);
    const blob = await response.blob();  // Convert the image to a Blob
    const participantImageRef = storageRef(storage, `${folderPath}/profilePicture.jpg`);  // You can change the file name if needed

    // Upload the profile picture to the correct folder path
    await uploadBytes(participantImageRef, blob);

    alert("Guest added successfully and profile picture uploaded.");
    toggleDialog(false);
    loadEventRoom(eventCode);
  } catch (error) {
    console.error("Error adding guest:", error);
    alert("Failed to add guest.");
  }
});

// Delete Manual Guest
async function deleteManualGuest(eventCode, guestId, folderPath) {
  try {
    const guestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${guestId}`);
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

// Toggle Add Guest Dialog
function toggleDialog(show) {
  const dialog = document.getElementById("addGuestDialog");
  dialog.classList.toggle("hidden", !show);

  // Clear previous inputs
  if (show) {
    document.getElementById("guestName").value = "";
    document.getElementById("guestEmail").value = "";
    document.getElementById("guestPhoto").value = null;
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