import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL, uploadBytes } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// Fetch Room Data and Display
async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const roomNameElem = document.getElementById("roomName");
      const roomCodeElem = document.getElementById("roomCode");
      const hostPhotoElem = document.getElementById("hostPhoto");

      roomNameElem.textContent = roomData.roomName || 'Event Room';
      roomCodeElem.textContent = `Code: ${eventCode}`;

      // Fetch Host Photo URL
      const hostData = roomData.host && Object.values(roomData.host)[0];
      if (hostData && hostData.hostPhotoUrl) {
        // Display Host Image
        hostPhotoElem.src = hostData.hostPhotoUrl;
      } else {
        hostPhotoElem.src = "fallback.png"; // Fallback image
      }

      // Load Guests List
      loadGuests(roomData.guests);
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading event room:", error);
  }
}

// Load Guests List
function loadGuests(guestsData) {
  const guestListElem = document.getElementById("guestList");
  guestListElem.innerHTML = "";

  for (const guestKey in guestsData) {
    const guest = guestsData[guestKey];
    const guestItem = document.createElement("li");

    // Display Guest Image
    const guestPhoto = document.createElement("img");
    guestPhoto.width = 40;
    guestPhoto.height = 40;
    guestPhoto.style.borderRadius = "50%";
    guestPhoto.src = guest.guestPhotoUrl || "fallback.png";

    // Guest Name
    const guestName = document.createElement("span");
    guestName.textContent = guest.guestName || "Unnamed Guest";

    guestItem.appendChild(guestPhoto);
    guestItem.appendChild(guestName);
    guestListElem.appendChild(guestItem);
  }
}

// Upload Photo
document.getElementById("uploadPhotoButton").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You need to log in!");
    return;
  }

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.click();

  picker.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userId = user.uid;
    const folderPath = `rooms/${eventCode}/${userId}/photos/`;
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `${folderPath}${fileName}`);

    // Upload Image
    await uploadBytes(fileRef, file);

    // Update the Database
    const photoUrl = await getDownloadURL(fileRef);
    const userRef = dbRef(database, `rooms/${eventCode}/guests/${userId}`);
    await userRef.update({
      guestPhotoUrl: photoUrl,
    });

    alert("Photo uploaded successfully!");
  };
});

// Window onload
window.onload = () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  if (eventCode) {
    loadEventRoom(eventCode);
  }
};
