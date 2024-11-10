// Import necessary Firebase modules
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

// Fetch User Profile Picture from Realtime Database
async function fetchUserProfilePicture(userKey) {
  try {
    const userRef = dbRef(database, `users/${userKey}/photo`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userPhotoUrl = snapshot.val();
      document.getElementById("userProfilePicture").src = userPhotoUrl;
    } else {
      console.error("User data does not exist.");
    }
  } catch (error) {
    console.error("Error fetching user profile picture:", error);
  }
}

// Load Event Room and Data
async function loadEventRoom(eventCode) {
  try {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      document.getElementById("roomName").textContent = roomData.roomName || 'Event Room';
      document.getElementById("roomCode").textContent = `Code: ${eventCode}`;
      
      // Host information
      const hostData = Object.values(roomData.host || {})[0];
      document.getElementById("hostPhoto").src = hostData?.hostPhotoUrl || "fallback.png";

      // Load the guest list
      loadGuests(roomData.guests);
    } else {
      alert("Room does not exist.");
    }
  } catch (error) {
    console.error("Error loading event room:", error);
  }
}

// Load Guest List with Dynamic Access to Profile Pictures
function loadGuests(guestsData) {
  const guestListElem = document.getElementById("guestList");
  guestListElem.innerHTML = "";  // Clear the current guest list

  Object.entries(guestsData || {}).forEach(([guestKey, guest]) => {
    const guestItem = document.createElement("li");

    const guestPhotoUrl = guest.guestPhotoUrl || "fallback.png";
    const guestName = guest.guestName || "Unnamed Guest";

    guestItem.innerHTML = `
      <img src="${guestPhotoUrl}" width="40" height="40" style="border-radius: 50%;" alt="Guest Photo">
      <span>${guestName}</span>
    `;

    guestListElem.appendChild(guestItem);
  });
}

// Detect User Role (Host or Guest)
async function detectUserType(eventCode, userId) {
  const roomRef = dbRef(database, `rooms/${eventCode}`);
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    const roomData = snapshot.val();

    for (const hostKey in roomData.host) {
      if (roomData.host[hostKey]?.hostId === userId) {
        return { type: "host", key: hostKey };
      }
    }

    for (const guestKey in roomData.guests) {
      if (roomData.guests[guestKey]?.guestId === userId) {
        return { type: "guest", key: guestKey };
      }
    }
  }

  return null;
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

    const userType = await detectUserType(eventCode, userId);
    if (!userType) {
      alert("User is not part of this room!");
      return;
    }

    const folderType = userType.type === 'host' ? 'host' : 'guests';
    const storagePath = `rooms/${eventCode}/${folderType}/${userType.key}/photos/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, storagePath);

    try {
      const snapshot = await uploadBytes(fileRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      const userRef = dbRef(database, `rooms/${eventCode}/${folderType}/${userType.key}`);
      await update(userRef, {
        [`${userType.type}PhotoUrl`]: photoUrl,
        uploadedPhotoFolderPath: `rooms/${eventCode}/${folderType}/${userType.key}/photos/`
      });

      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };
});

// Window onload
window.onload = () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  if (eventCode) {
    loadEventRoom(eventCode);
  }
};
