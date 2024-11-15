import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getDatabase, ref, get, set, update, onValue } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

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
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);

// Join Room function
async function joinRoom() {
  const roomCode = document.getElementById("eventCodeInput").value.trim();
  const user = auth.currentUser;

  if (!user) {
    displayMessage("Please log in to join the room!");
    return;
  }

  if (roomCode === "") {
    displayMessage("Please enter a room code!");
    return;
  }

  const roomRef = ref(database, `rooms/${roomCode}`);
  const roomSnapshot = await get(roomRef);

  if (!roomSnapshot.exists()) {
    displayMessage("Room does not exist!");
    return;
  }

  const roomData = roomSnapshot.val();

  if (roomData.hostId === user.uid) {
    displayMessage("You are the host of this room!");
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
    return;
  }

  const participantRef = ref(database, `rooms/${roomCode}/participants/${user.uid}`);
  const participantSnapshot = await get(participantRef);

  if (participantSnapshot.exists()) {
    displayMessage("You are already a participant in this room!");
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
    return;
  }

  const participantData = {
    name: user.displayName || "Guest",
    email: user.email,
    photoUrl: user.photoURL || "",  // Store the user's photo URL directly
  };

  // Only set the participant data without the uploadedPhotoFolderPath
  await set(participantRef, participantData);
  window.location.href = `/eventroom.html?eventCode=${roomCode}`;
}

// Function to display messages
function displayMessage(message) {
  const messageElement = document.createElement("p");
  messageElement.innerText = message;
  messageElement.style.color = "red";
  const container = document.querySelector(".container");
  container.appendChild(messageElement);

  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

// Listen for "Go to EventRoom" button click
document.addEventListener("DOMContentLoaded", () => {
  const joinButton = document.getElementById("joinEventBtn");
  joinButton.addEventListener("click", joinRoom);
});

// Listen for user profile changes
function listenForUserProfileChanges() {
  const user = auth.currentUser;
  const userRef = ref(database, `users/${user.uid}`);

  onValue(userRef, async (snapshot) => {
    const updatedName = snapshot.val().name || user.displayName || "Guest";
    const updatedPhotoUrl = snapshot.val().photo || user.photoURL || "";

    const roomsSnapshot = await get(ref(database, 'rooms'));
    roomsSnapshot.forEach((room) => {
      const eventCode = room.key;
      const participantRef = ref(database, `rooms/${eventCode}/participants/${user.uid}`);

      get(participantRef).then((participantSnapshot) => {
        if (participantSnapshot.exists()) {
          update(participantRef, {
            name: updatedName,
            photoUrl: updatedPhotoUrl,
          });
        }
      });
    });
  });
}

// Initialize listener for profile changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    listenForUserProfileChanges();
  }
});
