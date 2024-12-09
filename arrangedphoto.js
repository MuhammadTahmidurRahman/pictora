// arrangedphoto.js

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

let globalEventCode = "";
let globalRoomName = "";

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "eventroom.html";
});

// Download photos as ZIP
async function downloadPhotosAsZip(folderPath, fileNamePrefix) {
  const folderRef = storageRef(storage, folderPath);
  const listResult = await listAll(folderRef);

  if (listResult.items.length === 0) {
    alert("No photos available.");
    return null;
  }

  const blobPromises = listResult.items.map(async (itemRef) => {
    const photoUrl = await getDownloadURL(itemRef);
    const response = await fetch(photoUrl);
    return response.blob();
  });

  const blobs = await Promise.all(blobPromises);

  const zip = new JSZip();
  blobs.forEach((blob, index) => {
    const fileName = `photo_${index + 1}.jpg`;
    zip.file(fileName, blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${fileNamePrefix.replace(/\s+/g, '_')}_Photos.zip`);
  return `${fileNamePrefix.replace(/\s+/g, '_')}_Photos.zip`;
}

function sendGeneralEmailToParticipants(normalParticipantEmails) {
  if (normalParticipantEmails.length === 0) {
    alert("No normal participants to email.");
    return;
  }

  const subject = `Your Photos from ${globalRoomName} (${globalEventCode})`;
  const body = `Hello everyone,\n\nHere are your photos from the ${globalRoomName} (${globalEventCode}).\n\nBest regards,\nYour Event Team`;
  const mailtoLink = `mailto:${encodeURIComponent(normalParticipantEmails.join(','))}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}

async function sendEmailToManualGuest(guestData) {
  const folderPath = guestData.folderPath + "/photos";
  const zipName = await downloadPhotosAsZip(folderPath, guestData.name || "ManualGuest");
  if (!zipName) return;

  const subject = `Your Photos from ${globalRoomName} (${globalEventCode})`;
  const name = guestData.name || "Guest";
  const body = `Hello ${name},\n\nWe are pleased to share with you the photos from the ${globalRoomName} (${globalEventCode}). Please find your photos in the downloaded ZIP file.\n\nBest regards,\nYour Event Team`;

  const mailtoLink = `mailto:${encodeURIComponent(guestData.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}

async function loadGuests(guests, containerId) {
  const guestListContainer = document.getElementById(containerId);
  guestListContainer.innerHTML = "";

  const normalParticipantEmails = [];

  guests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.innerHTML = 
      `<img src="${guestData.photoUrl || "fallback.png"}" alt="Guest Photo" class="guest-photo" />
      <span>${guestData.name || "Unnamed Guest"}</span>
      <button class="folder-icon" data-folder-path="${guestData.folderPath || ""}">
        📁 View Photos
      </button>`;

    guestListContainer.appendChild(guestItem);

    if (guestData.email && !guestData.isManual) {
      normalParticipantEmails.push(guestData.email);
    }

    const folderButton = guestItem.querySelector(".folder-icon");
    folderButton.addEventListener("click", () => {
      if (guestData.folderPath) {
        window.location.href = "photogallery.html?folderName=" + encodeURIComponent(guestData.folderPath + "/photos");
      } else {
        alert("No photos available for this guest.");
      }
    });
  });

  if (normalParticipantEmails.length > 0) {
    const parentContainer = document.getElementById(containerId).parentElement; 
    let emailAllButton = document.getElementById("emailAllParticipantsBtn");
    if (!emailAllButton) {
      emailAllButton = document.createElement("button");
      emailAllButton.id = "emailAllParticipantsBtn";
      emailAllButton.textContent = "Send General Email to All Participants";
      emailAllButton.addEventListener("click", () => {
        sendGeneralEmailToParticipants(normalParticipantEmails);
      });
      parentContainer.insertBefore(emailAllButton, parentContainer.firstChild);
    }
  }
}

async function loadManualGuests(manualGuests, containerId) {
  const manualGuestListContainer = document.getElementById(containerId);
  manualGuestListContainer.innerHTML = "";

  if (!manualGuests || manualGuests.length === 0) {
    manualGuestListContainer.innerHTML = "<li>No manual guests available.</li>";
    return;
  }

  manualGuests.forEach(([guestId, guestData]) => {
    const guestItem = document.createElement("li");
    guestItem.innerHTML = 
      `<img src="${guestData.photoUrl || "fallback.png"}" alt="Manual Guest Photo" class="guest-photo" />
      <span>${guestData.name || "Unnamed Manual Guest"}</span>
      <button class="folder-icon" data-folder-path="${guestData.folderPath || ""}">
        📁 View Photos
      </button>
      <button class="email-button" title="Send Email">
        ✉️
      </button>`;

    manualGuestListContainer.appendChild(guestItem);

    const folderButton = guestItem.querySelector(".folder-icon");
    folderButton.addEventListener("click", () => {
      if (guestData.folderPath) {
        window.location.href = "photogallery.html?folderName=" + encodeURIComponent(guestData.folderPath + "/photos");
      } else {
        alert("No photos available for this manual guest.");
      }
    });

    const emailButton = guestItem.querySelector(".email-button");
    emailButton.addEventListener("click", () => {
      if (guestData.folderPath && guestData.email) {
        sendEmailToManualGuest(guestData);
      } else {
        alert("No email or no photos available for this manual guest.");
      }
    });
  });
}

async function fetchAndDisplayPhotos(folderPath, containerId) {
  const photoContainer = document.getElementById(containerId);
  if (!photoContainer) {
    const newContainer = document.createElement("div");
    newContainer.id = containerId;
    document.body.appendChild(newContainer);
  }
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  try {
    const folderRef = storageRef(storage, folderPath);
    const listResult = await listAll(folderRef);

    if (listResult.items.length === 0) {
      container.textContent = "No Photos Available.";
      return;
    }

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);
      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "Photo";
      img.classList.add("photo-thumbnail");
      container.appendChild(img);
    }
  } catch (error) {
    console.error("Error fetching photos:", error);
    const c = document.getElementById(containerId);
    if (c) c.textContent = "Failed to load photos.";
  }
}

function toggleDialog(show) {
  let dialog = document.getElementById("photoDialog");
  if (!dialog) {
    dialog = document.createElement("div");
    dialog.id = "photoDialog";
    dialog.style.display = "none";
    document.body.appendChild(dialog);

    const content = document.createElement("div");
    content.id = "photoDialogContent";
    dialog.appendChild(content);
  }
  dialog.style.display = show ? "flex" : "none";
}

async function viewHostPhoto(hostData) {
  const hostMessage = document.getElementById("hostMessage");
  const folderPath = hostData.photoFolderPath;

  if (folderPath) {
    try {
      const folderRef = storageRef(storage, folderPath);
      const listResult = await listAll(folderRef);

      if (listResult.items.length === 0) {
        hostMessage.textContent = "No photos available for the host.";
        return;
      }

      const photoUrl = await getDownloadURL(listResult.items[0]);
      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "Host Photo";
      img.classList.add("photo-thumbnail");
      hostMessage.innerHTML = "";
      hostMessage.appendChild(img);
    } catch (error) {
      console.error("Error fetching host photo:", error);
      hostMessage.textContent = "Failed to load host photo.";
    }
  } else {
    hostMessage.textContent = "No photo folder available for the host.";
  }
}

async function downloadHostPhoto(hostData) {
  const hostMessage = document.getElementById("hostMessage");
  const folderPath = hostData.photoFolderPath;

  if (folderPath) {
    try {
      const zipName = await downloadPhotosAsZip(folderPath, "host");
      if (zipName) {
        alert("Host photos downloaded successfully.");
      }
    } catch (error) {
      console.error("Error downloading host photos:", error);
      hostMessage.textContent = "Failed to download host photos.";
    }
  } else {
    hostMessage.textContent = "No photo folder available for the host.";
  }
}

async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      globalEventCode = eventCode;
      globalRoomName = roomData.roomName || "Event Room";

      document.getElementById("roomName").textContent = globalRoomName;
      document.getElementById("roomCode").textContent = `Code: ${eventCode}`;

      const hostId = roomData.hostId;
      const hostData = roomData.participants[hostId];
      if (hostData) {
        document.getElementById("hostName").textContent = hostData.name || "Host";
        document.getElementById("hostPhoto").src = hostData.photoUrl || "fallback.png";
        hostData.photoFolderPath = roomData.hostUploadedPhotoFolderPath;

        document.getElementById("viewHostPhotoBtn").addEventListener("click", () => {
          if (hostData.photoFolderPath) {
            window.location.href = "photogallery.html?folderName=" + encodeURIComponent(hostData.photoFolderPath + "/photos");
          } else {
            alert("No photo folder available for the host.");
          }
        });

        document.getElementById("downloadHostPhotoBtn").addEventListener("click", () => downloadHostPhoto(hostData));
      }

      const participants = roomData.participants || {};
      const guests = Object.entries(participants)
        .filter(([key]) => key !== hostId)
        .map(([id, data]) => [id, { ...data, isManual: false }]);
      loadGuests(guests, "guestList");

      const manualGuests = roomData.manualParticipants || {};
      const manualList = Object.entries(manualGuests).map(([id, data]) => [id, { ...data, isManual: true }]);
      loadManualGuests(manualList, "manualGuestList");
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading event room:", error);
  }
}

async function loadPhotos(eventCode) {
  let photoContainer = document.getElementById("photoContainer");
  if (!photoContainer) {
    const newContainer = document.createElement("div");
    newContainer.id = "photoContainer";
    document.body.appendChild(newContainer);
    photoContainer = newContainer;
  }
  
  const folderPath = `rooms/${eventCode}/host`;
  const folderRef = storageRef(storage, folderPath);

  try {
    const listResult = await listAll(folderRef);
    photoContainer.innerHTML = "";

    if (listResult.items.length === 0) {
      photoContainer.textContent = "No photos available.";
      return;
    }

    for (const itemRef of listResult.items) {
      const photoUrl = await getDownloadURL(itemRef);
      const photoItem = document.createElement("div");
      photoItem.classList.add("photo-item");
      photoItem.dataset.path = itemRef.fullPath;

      photoItem.innerHTML =   
        `<img src="${photoUrl}" alt="Photo" />
        <button class="delete-btn">Delete</button>`;

      photoItem.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this photo?")) {
          await deletePhoto(itemRef.fullPath);
          loadPhotos(eventCode);
        }
      });

      photoContainer.appendChild(photoItem);
    }

  } catch (error) {
    console.error("Error loading photos:", error);
    photoContainer.textContent = "Failed to load photos.";
  }
}

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

async function updateSortPhotoRequest(eventCode) {
  const hostRef = dbRef(database, `rooms/${eventCode}/host`);

  try {
    const snapshot = await get(hostRef);
    let currentSortValue = 0.0;

    if (snapshot.exists()) {
      const hostData = snapshot.val();
      currentSortValue = hostData.sortPhotoRequest !== undefined ? hostData.sortPhotoRequest : 0.0;
    }

    const newSortValue = currentSortValue + 1.0;
    await set(hostRef, {
      ...snapshot.val(),
      sortPhotoRequest: newSortValue,
    });

    console.log(`sortPhotoRequest field updated to ${newSortValue}.`);

  } catch (error) {
    console.error("Error updating sortPhotoRequest field:", error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get("eventCode");

    if (eventCode) {
      loadEventRoom(eventCode);
      loadPhotos(eventCode);
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
