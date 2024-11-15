import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

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
  const roomCode = document.getElementById("room-code").value.trim();
  const user = auth.currentUser;

  // Ensure user is logged in
  if (!user) {
    displayMessage("Please log in to join the room!");
    return;
  }

  // Validate room code
  if (roomCode === "") {
    displayMessage("Please enter a room code!");
    return;
  }

  // Fetch room data from Firebase
  const roomRef = database.ref(`rooms/${roomCode}`);
  const roomSnapshot = await roomRef.get();

  if (!roomSnapshot.exists()) {
    displayMessage("Room does not exist!");
    return;
  }

  const roomData = roomSnapshot.val();

  // Check if the user is the host
  if (roomData.hostId === user.uid) {
    displayMessage("You are the host of this room!");
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
    return;
  }

  // Check if the user is already a participant
  const participantRef = database.ref(`rooms/${roomCode}/participants/${user.uid}`);
  const participantSnapshot = await participantRef.get();

  if (participantSnapshot.exists()) {
    displayMessage("You are already a participant in this room!");
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
    return;
  }

  // If user is neither host nor participant, add as new participant
  const sanitizedEmail = user.email.replace(/\./g, '_');
  const participantData = {
    name: user.displayName || "Guest",
    email: user.email,
    uploadedPhotoFolderPath: `rooms/${roomCode}/${user.uid}`,
    photoUrl: user.photoURL || ""
  };

  await participantRef.set(participantData);
  window.location.href = `/eventroom.html?eventCode=${roomCode}`;
}

// Function to display messages to the user
function displayMessage(message) {
  document.getElementById("message").innerText = message;
}

// Function to listen for user profile changes and update participant data
function listenForUserProfileChanges() {
  const user = auth.currentUser;
  const userRef = database.ref(`users/${user.uid}`);

  userRef.on("value", async (snapshot) => {
    const updatedName = snapshot.val().name || user.displayName || "Guest";
    const updatedPhotoUrl = snapshot.val().photo || user.photoURL || "";

    // Update participant data in all rooms where this user is a participant
    const roomsSnapshot = await database.ref('rooms').get();
    roomsSnapshot.forEach((room) => {
      const eventCode = room.key;
      const participantRef = database.ref(`rooms/${eventCode}/participants/${user.uid}`);

      participantRef.get().then((participantSnapshot) => {
        if (participantSnapshot.exists()) {
          participantRef.update({
            name: updatedName,
            photoUrl: updatedPhotoUrl,
          });
        }
      });
    });
  });
}

// Initialize listener for profile changes after login
auth.onAuthStateChanged((user) => {
  if (user) {
    listenForUserProfileChanges();
  }
});