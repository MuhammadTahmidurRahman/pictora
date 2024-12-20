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

// Close Dialog button functionality
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

        // Set the hostUploadedPhotoFolderPath from roomData
        hostData.hostUploadedPhotoFolderPath = roomData.hostUploadedPhotoFolderPath;

        // Add folder icon for host if they have uploaded photos
        if (hostData.folderPath) {
          const hostFolderIcon = document.createElement("button");
          hostFolderIcon.setAttribute("aria-label", "Host Folder");
          hostFolderIcon.classList.add("folder-icon");

          // No textContent as CSS handles the icon
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

        // Add "Arrange Photo" button for the host
        if (user.uid === hostId) {
          const arrangePhotoButton = document.createElement("button");
          arrangePhotoButton.setAttribute("aria-label", "Arrange Photos");
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
          addMemberButton.setAttribute("aria-label", "Add Member");
          addMemberButton.classList.add("add-member-button");
          addMemberButton.addEventListener("click", () => {
            toggleDialog(true);
          });
          hostActions.appendChild(addMemberButton);
        }

        // View Sorted Photos button
        const sortedPhotoButton = document.createElement("button");
        sortedPhotoButton.setAttribute("aria-label", "View Sorted Photos");
        sortedPhotoButton.classList.add("view-sorted-button"); // Corrected class name

        sortedPhotoButton.addEventListener("click", () => {
          if (user.uid === hostId) {
            // Host uses hostData.hostUploadedPhotoFolderPath + "/photos"
            if (hostData.hostUploadedPhotoFolderPath) {
              window.location.href = `photogallery.html?eventCode=${encodeURIComponent(eventCode)}&folderName=${encodeURIComponent(hostData.hostUploadedPhotoFolderPath + "/photos")}&userId=${encodeURIComponent(hostId)}`;
            } else {
              alert("No sorted photos available for host.");
            }
          } else {
            // Participant uses participantData.folderPath + "/photos"
            const participants = roomData.participants || {};
            const participantData = participants[user.uid];
            if (participantData && participantData.folderPath) {
              window.location.href = `photogallery.html?eventCode=${encodeURIComponent(eventCode)}&folderName=${encodeURIComponent(participantData.folderPath + "/photos")}&userId=${encodeURIComponent(user.uid)}`;
            } else {
              alert("No sorted photos available for you.");
            }
          }
        });
        hostActions.appendChild(sortedPhotoButton);
      }

      // Load guests list
      const participants = roomData.participants || {};
      const guests = Object.entries(participants).filter(([key]) => key !== hostId);

      // Ensure each participant has a folderPath and upload their profile photo to that path if not already done
      for (const [participantId, participantData] of Object.entries(participants)) {
        if (!participantData.folderPath && participantData.photoUrl) {
          const participantRef = dbRef(database, `rooms/${eventCode}/participants/${participantId}`);
          const folderPath = `rooms/${eventCode}/${participantId}`;
          await update(participantRef, { folderPath });

          const response = await fetch(participantData.photoUrl);
          const blob = await response.blob();
          const participantImageRef = storageRef(storage, `${folderPath}/${participantData.name.replace(/\s+/g, "_")}_profilePhoto.jpg`);
          await uploadBytes(participantImageRef, blob);
        }
      }

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

function loadGuests(guests, currentUserId, hostId, eventCode) {
  const guestListElem = document.getElementById("guestList");
  guestListElem.innerHTML = "";

  guests.forEach(([guestId, guestData]) => {
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode);
    guestListElem.appendChild(guestItem);
  });
}

function loadManualGuests(manualGuests, currentUserId, hostId, eventCode) {
  const manualGuestListElem = document.getElementById("manualGuestList");
  manualGuestListElem.innerHTML = "";

  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, true);
    manualGuestListElem.appendChild(guestItem);
  });
}

function createGuestItem(guestId, guestData, currentUserId, hostId, eventCode, isManual = false) {
  const guestItem = document.createElement("li");
  guestItem.classList.add("guest-item");
  
  guestItem.innerHTML = 
    `<img class="guest-photo" src="${guestData.photoUrl}" alt="Guest Photo" />
    <span class="guest-name">${guestData.name}</span>`;
  
  if (guestData.folderPath) {
    const folderIcon = document.createElement("button");
    folderIcon.setAttribute("aria-label", "Guest Folder");
    folderIcon.classList.add("folder-icon");

    // No textContent as CSS handles the icon

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
    deleteButton.setAttribute("aria-label", "Delete Guest");
    deleteButton.classList.add("delete-guest-button");
    // No textContent as CSS handles the icon and hover text
    deleteButton.addEventListener("click", async () => {
      await deleteManualGuest(eventCode, guestId, guestData.folderPath);
    });
    guestItem.appendChild(deleteButton);
  }

  return guestItem;
}

document.getElementById("addGuestButton").addEventListener("click", async () => {
  const guestName = document.getElementById("guestName").value.trim();
  const guestEmail = document.getElementById("guestEmail").value.trim();
  const guestPhoto = document.getElementById("guestPhoto").files[0];  
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");

  if (!guestName || !guestEmail || !guestPhoto) {
    alert("All fields are required.");
    return;
  }

  const participantId = `${eventCode}_${Date.now()}`;
  const folderPath = `rooms/${eventCode}/${participantId}`;
  const storagePath = `uploads/${participantId}`;

  try {
    const fileRef = storageRef(storage, storagePath);
    await uploadBytes(fileRef, guestPhoto);
    const photoUrl = await getDownloadURL(fileRef);

    const manualGuestRef = dbRef(database, `rooms/${eventCode}/manualParticipants/${participantId}`);
    await update(manualGuestRef, {
      name: guestName,
      email: guestEmail,
      photoUrl,
      folderPath,
    });

    const response = await fetch(photoUrl);
    const blob = await response.blob();
    const participantImageRef = storageRef(storage, `${folderPath}/${guestName.replace(/\s+/g, "_")}_profilePhoto.jpg`);
    await uploadBytes(participantImageRef, blob);

    alert("Guest added successfully and profile picture uploaded.");
    toggleDialog(false);
    loadEventRoom(eventCode);
  } catch (error) {
    console.error("Error adding guest:", error);
    alert("Failed to add guest.");
  }
});

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

function toggleDialog(show) {
  const dialog = document.getElementById("addGuestDialog");
  dialog.classList.toggle("hidden", !show);

  if (show) {
    document.getElementById("guestName").value = "";
    document.getElementById("guestEmail").value = "";
    document.getElementById("guestPhoto").value = null;
  }
}

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
