import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, get, remove, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const auth = getAuth();
const storage = getStorage();
const database = getDatabase();

let eventCode = new URLSearchParams(window.location.search).get('eventCode');
const roomCodeElement = document.getElementById('roomCode');
const roomNameElement = document.getElementById('roomName');
const hostNameElement = document.getElementById('hostName');
const hostPhotoContainer = document.getElementById('hostPhotoContainer');
const guestListElement = document.getElementById('guestList');
const uploadPhotoButton = document.getElementById('uploadPhotoButton');
const deleteRoomButton = document.getElementById('deleteRoomButton');
const backButton = document.getElementById('backButton');

function loadRoomData() {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    get(roomRef).then((snapshot) => {
        if (snapshot.exists()) {
            const roomData = snapshot.val();
            roomNameElement.textContent = roomData.roomName || "No Room Name";
            roomCodeElement.textContent = `Room Code: ${eventCode}`;
            const hostData = roomData.host ? Object.values(roomData.host)[0] : null;
            const guests = roomData.guests || {};
            
            if (hostData) {
                hostNameElement.textContent = `Host: ${hostData.hostName}`;
                if (hostData.hostPhotoUrl) {
                    hostPhotoContainer.innerHTML = `<img src="${hostData.hostPhotoUrl}" alt="Host Photo">`;
                }
            }

            guestListElement.innerHTML = "";
            Object.values(guests).forEach((guest) => {
                const guestElement = document.createElement('li');
                guestElement.innerHTML = `
                    <img src="${guest.guestPhotoUrl || 'assets/placeholder.png'}" alt="Guest Photo">
                    <span>${guest.guestName}</span>
                `;
                guestListElement.appendChild(guestElement);
            });
        }
    }).catch((error) => {
        console.error("Error loading room data:", error);
    });
}

function uploadPhotos(userId, username) {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.multiple = true;
    picker.onchange = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        const roomRef = dbRef(database, `rooms/${eventCode}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();
        let isHost = false;
        let folderType = '';
        let displayName = '';

        const host = Object.values(roomData.host || {})[0];
        if (host && host.hostId === userId) {
            isHost = true;
            folderType = 'host';
            displayName = host.hostName;
        }

        if (!isHost) {
            for (const guest of Object.values(roomData.guests || {})) {
                if (guest.guestId === userId) {
                    folderType = 'guests';
                    displayName = guest.guestName;
                    break;
                }
            }
        }

        const storagePath = `rooms/${eventCode}/${folderType}/${displayName}/${userId}/photos/`;
        for (const file of files) {
            const fileRef = storageRef(storage, `${storagePath}${Date.now()}`);
            await uploadBytes(fileRef, file);
        }

        alert(`${files.length} photos uploaded successfully!`);
    };
    picker.click();
}

function deleteRoom() {
    const roomRef = dbRef(database, `rooms/${eventCode}`);
    if (confirm("Are you sure you want to delete this room?")) {
        remove(roomRef).then(() => {
            alert("Room deleted successfully!");
            window.location.href = 'createorjoinroom.html';
        }).catch((error) => {
            console.error("Error deleting room:", error);
        });
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadRoomData();
        uploadPhotoButton.onclick = () => uploadPhotos(user.uid, user.displayName);
        deleteRoomButton.onclick = deleteRoom;
        backButton.onclick = () => window.location.href = 'createorjoinroom.html';
    } else {
        alert("User not authenticated");
        window.location.href = 'index.html';
    }
});
