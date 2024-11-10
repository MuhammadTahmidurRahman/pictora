import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref as dbRef, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
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

// Load Event Room Data
async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      document.getElementById("roomName").textContent = roomData.roomName || 'Event Room';
      document.getElementById("roomCode").textContent = `Code: ${eventCode}`;

      // Load Host Data
      const hostKey = Object.keys(roomData.host)[0];
      const hostData = roomData.host[hostKey];
      document.getElementById("hostPhoto").src = hostData?.hostPhotoUrl || "fallback.png";

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

    const guestPhoto = document.createElement("img");
    guestPhoto.width = 40;
    guestPhoto.height = 40;
    guestPhoto.style.borderRadius = "50%";
    guestPhoto.src = guest.guestPhotoUrl || "fallback.png";

    const guestName = document.createElement("span");
    guestName.textContent = guest.guestName || "Unnamed Guest";

    guestItem.appendChild(guestPhoto);
    guestItem.appendChild(guestName);
    guestListElem.appendChild(guestItem);
  }
}

// Detect User Type (Host or Guest)
async function detectUserType(eventCode, userId, userEmail, userDisplayName) {
  const roomRef = dbRef(database, `rooms/${eventCode}`);
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    const roomData = snapshot.val();
    const emailKeyPart = userEmail.replace(/\./g, '_'); // Replace `.` with `_`
    const nameKeyPart = userDisplayName.replace(/ /g, '_');

    // Construct potential keys for host and guests
    const potentialHostKey = `${eventCode}_Test1_${emailKeyPart}_${nameKeyPart}`;
    const potentialGuestKey = `${eventCode}_Test1_${emailKeyPart}_${nameKeyPart}`;

    // Check if the user is the host
    if (roomData.host[potentialHostKey]?.hostId === userId) {
      return { type: "host", key: potentialHostKey };
    }

    // Check if the user is a guest
    if (roomData.guests[potentialGuestKey]?.guestId === userId) {
      return { type: "guest", key: potentialGuestKey };
    }
  }
  return null;
}


// Upload Photo and Update Database
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
    const userEmail = user.email.replace(/\./g, '_');
    const userDisplayName = user.displayName.replace(/ /g, '_') || "Guest";

    // Detect user type using the updated structure
    const userType = await detectUserType(eventCode, userId, userEmail, userDisplayName);
    if (!userType) {
      alert("User is not part of this room!");
      return;
    }

    // Determine folder path based on user type
    const folderPath = userType.type === 'host' 
      ? `rooms/${eventCode}/host/${userType.key}/photos/`
      : `rooms/${eventCode}/guests/${userType.key}/photos/`;
      
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `${folderPath}${fileName}`);

    try {
      // Upload Image
      const snapshot = await uploadBytes(fileRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      // Update Database
      const userRef = dbRef(database, `rooms/${eventCode}/${userType.type}/${userType.key}`);
      const updates = {
        [`${userType.type}PhotoUrl`]: photoUrl,
        uploadedPhotoFolderPath: `${folderPath}${fileName}`,
      };
      await update(userRef, updates);

      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };
});

// Initialize Page
window.onload = () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  if (eventCode) {
    loadEventRoom(eventCode);
  }
};
