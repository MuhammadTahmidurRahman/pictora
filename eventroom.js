import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// Function to upload photo and update the database
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

        const fileName = `${Date.now()}_${file.name}`;
        const folderPath = `rooms/${eventCode}/${user.uid}/photos/`;
        const fileRef = storageRef(storage, `${folderPath}${fileName}`);

        // Upload the file to Firebase Storage
        await uploadBytes(fileRef, file);
        alert(`Uploaded ${fileName}!`);

        // Update the photo folder path in the database
        const roomRef = dbRef(database, `rooms/${eventCode}`);
        const roomSnapshot = await get(roomRef);

        if (!roomSnapshot.exists()) {
            alert("Room does not exist!");
            return;
        }

        const roomData = roomSnapshot.val();
        let updateData = {};

        // Check if the current user is the host or a guest
        if (roomData.host && roomData.host.hostId === user.uid) {
            // If the user is the host
            updateData[`host/uploadedPhotoFolderPath`] = folderPath;
        } else if (roomData.guests && roomData.guests[user.uid]) {
            // If the user is a guest
            updateData[`guests/${user.uid}/uploadedPhotoFolderPath`] = folderPath;
        } else {
            alert("User not recognized in this event room!");
            return;
        }

        // Update the database with the new photo path
        await update(roomRef, updateData);
        alert("Photo path updated successfully!");
    };
});

window.onload = async () => {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
        await loadEventRoom(eventCode);
    }
};

// Function to load the event room details
async function loadEventRoom(eventCode) {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    const roomSnapshot = await get(roomRef);

    if (!roomSnapshot.exists()) {
        alert("Room not found!");
        return;
    }

    const roomData = roomSnapshot.val();
    document.getElementById("roomNameSpan").textContent = roomData.roomName || "Unnamed Room";
    document.getElementById("roomCodeSpan").textContent = eventCode;

    const hostData = roomData.host;
    document.getElementById("hostNameSpan").textContent = hostData.hostName || "Unknown Host";
    if (hostData.hostPhotoUrl) {
        document.getElementById("hostPhoto").src = hostData.hostPhotoUrl;
    }

    loadGuests(roomData.guests || {});
}

// Function to load guests list
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
