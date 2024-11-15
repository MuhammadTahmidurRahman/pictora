// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get, set, update, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
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

// Load Event Room Details
async function loadEventRoom(eventCode) {
  const roomRef = dbRef(database, `rooms/${eventCode}`);
  const roomSnapshot = await get(roomRef);

  if (!roomSnapshot.exists()) {
    alert("Room does not exist!");
    window.location.href = "join_event.html"; // Redirect if room doesn't exist
    return;
  }

  const roomData = roomSnapshot.val();
  document.getElementById("roomName").textContent = roomData.roomName || "No Room Name";
  document.getElementById("roomCode").textContent = `Room Code: ${eventCode}`;
  loadHostInfo(roomData.hostId, eventCode);
  loadGuestList(roomData.participants, roomData.hostId);
}

// Load Host Information
async function loadHostInfo(hostId, eventCode) {
  const hostRef = dbRef(database, `rooms/${eventCode}/participants/${hostId}`);
  const hostSnapshot = await get(hostRef);

  if (hostSnapshot.exists()) {
    const hostData = hostSnapshot.val();
    document.getElementById("hostName").textContent = hostData.name || "Unknown Host";
    document.getElementById("hostPhoto").src = hostData.photoUrl || "default-photo.jpg";
  }
}

// Load Guest List
function loadGuestList(participants, hostId) {
  const guestListElement = document.getElementById("guestList");
  guestListElement.innerHTML = ""; // Clear the guest list

  for (const [participantId, participantData] of Object.entries(participants || {})) {
    if (participantId !== hostId) {
      const listItem = document.createElement("li");
      listItem.textContent = participantData.name || "Unknown Guest";

      // Add folder icon if photo folder exists
      if (participantData.folderPath) {
        const folderIcon = document.createElement("button");
        folderIcon.textContent = "📁 View Photos";
        folderIcon.onclick = () => viewGuestPhotos(eventCode, participantId);
        listItem.appendChild(folderIcon);
      }
      guestListElement.appendChild(listItem);
    }
  }
}

// Upload Photo
document.getElementById("uploadPhotoButton").addEventListener("click", async () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const user = auth.currentUser;

  if (!user) {
    alert("Please log in to upload photos.");
    return;
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = "image/*";
  fileInput.onchange = async () => {
    const files = fileInput.files;
    const userId = user.uid;
    const folderPath = `rooms/${eventCode}/${userId}`;
    const userFolderRef = storageRef(storage, folderPath);

    for (let file of files) {
      const fileRef = storageRef(userFolderRef, file.name);
      await uploadBytes(fileRef, file);
    }

    const participantRef = dbRef(database, `rooms/${eventCode}/participants/${userId}`);
    await update(participantRef, { folderPath });

    alert(`${files.length} photo(s) uploaded successfully!`);
  };
  fileInput.click();
});

// Delete Room
document.getElementById("deleteRoomButton").addEventListener("click", async () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const confirmation = confirm("Are you sure you want to delete this room?");

  if (confirmation) {
    await remove(dbRef(database, `rooms/${eventCode}`));
    alert("Room deleted successfully.");
    window.location.href = "createorjoinroom.html";
  }
});

// Back Button Event
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "createorjoinroom.html";
});

// Load event room data after user authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadEventRoom(eventCode);
    }
  } else {
    alert("Please log in to access the event room.");
    window.location.href = "login.html";
  }
});
