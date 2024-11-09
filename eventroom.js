import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase configuration
const app = initializeApp(firebaseConfig);
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};
const auth = getAuth(app);
auth.onAuthStateChanged((user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
        loadEventRoom(eventCode);
    }
  } else {
    alert("You need to log in to access this room.");
    window.location.href = "login.html";
  }
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Initialize the database reference

// Load event room data
async function loadEventRoom(eventCode) {
  try {
      const roomRef = dbRef(database, `rooms/${eventCode}`);
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
          const roomData = snapshot.val();
          roomNameElem.textContent = roomData.roomName || 'Event Room';
          roomCodeElem.textContent = `Code: ${eventCode}`;

          // Set host photo with error fallback
          const hostPhotoUrl = roomData.hostPhotoUrl || '';
          hostPhotoElem.src = hostPhotoUrl;
          hostPhotoElem.onerror = () => { hostPhotoElem.src = 'default.png'; };
      } else {
          alert("Room does not exist.");
      }
  } catch (error) {
      console.error("Error loading event room:", error);
  }
}

// Load guests list
function loadGuests(guestsData) {
    const guestList = document.getElementById("guestList");
    guestList.innerHTML = "";

    for (const guestKey in guestsData) {
        const guest = guestsData[guestKey];
        const guestItem = document.createElement("li");
        guestItem.textContent = guest.guestName || "Unnamed Guest";
        guestList.appendChild(guestItem);
    }
}

// Upload photo
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
    picker.multiple = true;
    picker.click();

    picker.onchange = async (event) => {
        const files = event.target.files;
        if (!files.length) return;

        const folderName = `${user.uid}_uploads`;
        for (let file of files) {
            const fileName = `${Date.now()}_${file.name}`;
            const fileRef = storageRef(storage, `rooms/${eventCode}/${folderName}/${fileName}`);
            await uploadBytes(fileRef, file);
            alert(`Uploaded ${fileName}!`);
        }
    };
});

// Delete room
document.getElementById("deleteRoomButton").addEventListener("click", async () => {
    const confirmation = confirm("Are you sure?");
    if (!confirmation) return;

    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    await set(dbRef(database, `rooms/${eventCode}`), null);
    alert("Room deleted!");
    window.location.href = "index.html";
});

window.onload = () => {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
        loadEventRoom(eventCode);
    }
};
