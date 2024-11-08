// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

// References
const eventCodeElement = document.getElementById("eventCode");
const roomNameElement = document.getElementById("roomName");
const guestsContainer = document.getElementById("guestsContainer");
const uploadPhotoButton = document.getElementById("uploadPhotoButton");
const deleteRoomButton = document.getElementById("deleteRoomButton");

// Fetch Event Room Data
async function loadEventRoom(eventCode) {
  const roomRef = dbRef(database, `rooms/${eventCode}`);
  const roomSnapshot = await get(roomRef);

  if (!roomSnapshot.exists()) {
    alert("Room does not exist!");
    return;
  }

  const roomData = roomSnapshot.val();
  const roomName = roomData.roomName || "Unnamed Room";

  roomNameElement.textContent = `Room Name: ${roomName}`;
  eventCodeElement.textContent = `Event Code: ${eventCode}`;

  const hostData = Object.values(roomData.host || {})[0] || {};
  const hostName = hostData.hostName || "Unknown Host";

  const hostPhotoUrl = hostData.hostPhotoUrl;
  if (hostPhotoUrl) {
    const img = document.createElement("img");
    img.src = hostPhotoUrl;
    img.alt = "Host Photo";
    img.style.width = "50px";
    img.style.borderRadius = "50%";
    document.getElementById("hostDetails").appendChild(img);
  }
  document.getElementById("hostName").textContent = `Host: ${hostName}`;

  // Load guests
  loadGuests(roomData.guests || {});
}

// Load Guests List
function loadGuests(guestsData) {
  guestsContainer.innerHTML = "";
  for (const guestKey in guestsData) {
    const guest = guestsData[guestKey];
    const guestName = guest.guestName || "Unnamed Guest";
    const guestPhotoUrl = guest.guestPhotoUrl;

    const guestElement = document.createElement("div");
    guestElement.className = "guest";

    const guestNameElement = document.createElement("p");
    guestNameElement.textContent = guestName;

    const guestPhotoElement = document.createElement("img");
    guestPhotoElement.src = guestPhotoUrl || "default-avatar.png";
    guestPhotoElement.alt = guestName;
    guestPhotoElement.style.width = "40px";
    guestPhotoElement.style.borderRadius = "50%";

    guestElement.appendChild(guestPhotoElement);
    guestElement.appendChild(guestNameElement);
    guestsContainer.appendChild(guestElement);
  }
}

// Upload Photo Function
uploadPhotoButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You need to be logged in to upload photos!");
    return;
  }

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.multiple = true;
  picker.click();

  picker.onchange = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    const folderName = `${user.displayName}_uploads`;
    for (let file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRefPath = storageRef(storage, `rooms/${eventCode}/${folderName}/${fileName}`);
      await uploadBytes(storageRefPath, file);

      alert(`Photo ${fileName} uploaded successfully!`);
    }
  };
});

// Delete Room Function
deleteRoomButton.addEventListener("click", async () => {
  const confirmation = confirm("Are you sure you want to delete this room? This action cannot be undone.");
  if (!confirmation) return;

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const roomRef = dbRef(database, `rooms/${eventCode}`);
  await set(roomRef, null);

  alert("Room deleted successfully!");
  window.location.href = "index.html";
});

// Initialize Event Room
window.onload = () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  if (eventCode) {
    loadEventRoom(eventCode);
  } else {
    alert("No event code provided!");
    window.location.href = "index.html";
  }
};
