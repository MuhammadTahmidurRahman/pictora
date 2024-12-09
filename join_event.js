// join_event.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getDatabase, ref, get, onValue } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';

// Firebase configuration (ensure this is correct)
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
const auth = getAuth(app);
const database = getDatabase(app);

/**
 * Fetches the user's profile photo URL from Firebase Realtime Database.
 * If not found, returns a default image URL.
 * @param {string} uid - The user's unique ID.
 * @returns {Promise<string>} - The URL of the user's profile photo.
 */
async function fetchUserProfilePhoto(uid) {
  let photoUrl = "";
  const userProfileRef = ref(database, `users/${uid}/photo`);  // Fetch the 'photo' field

  try {
    const snapshot = await get(userProfileRef);
    if (snapshot.exists()) {
      photoUrl = snapshot.val(); // The correct photo URL from the Realtime Database
    } else {
      console.error("Profile photo not found in Realtime Database, using default image");
      photoUrl = "https://example.com/default_image.jpg";  // Replace with your default image URL
    }
  } catch (error) {
    console.error("Error fetching profile photo from Realtime Database:", error);
    photoUrl = "https://example.com/default_image.jpg";  // Replace with your default image URL
  }

  return photoUrl;
}

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 */
function displayMessage(message) {
  const messageElement = document.createElement("p");
  messageElement.innerText = message;
  messageElement.style.color = "red";
  const container = document.querySelector(".container");
  if (container) {
    container.appendChild(messageElement);

    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  } else {
    console.error("Container element not found to display message.");
  }
}

/**
 * Handles the process of joining a room/event.
 */
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
  let roomSnapshot;

  try {
    roomSnapshot = await get(roomRef);
  } catch (error) {
    console.error("Error fetching room data:", error);
    displayMessage("An error occurred while fetching the room data.");
    return;
  }

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
  let participantSnapshot;

  try {
    participantSnapshot = await get(participantRef);
  } catch (error) {
    console.error("Error fetching participant data:", error);
    displayMessage("An error occurred while checking your participation.");
    return;
  }

  if (participantSnapshot.exists()) {
    displayMessage("You are already a participant in this room!");
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
    return;
  }

  // Fetch the user's profile photo from Realtime Database (not from Firebase Storage)
  let photoUrl;
  try {
    photoUrl = await fetchUserProfilePhoto(user.uid);
  } catch (error) {
    console.error("Error fetching user profile photo:", error);
    displayMessage("An error occurred while fetching your profile photo.");
    return;
  }

  // Create participant data and store the user's uploaded profile photo URL
  const participantData = {
    name: user.displayName || "Guest",
    email: user.email,
    photoUrl: photoUrl,  // Use the correct photo URL from Realtime Database
  };

  try {
    await set(participantRef, participantData);
    window.location.href = `/eventroom.html?eventCode=${roomCode}`;
  } catch (error) {
    console.error("Error adding participant to Realtime Database:", error);
    displayMessage("Failed to join the room. Please try again.");
  }
}

/**
 * Listens for changes in the user's profile and updates their information in all rooms they are part of.
 */
function listenForUserProfileChanges() {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found for profile changes.");
    return;
  }

  const userRef = ref(database, `users/${user.uid}`);

  onValue(userRef, async (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const updatedName = userData.name || user.displayName || "Guest";
      let updatedPhotoUrl = userData.photo || "";

      // Fetch the updated user profile photo from Firebase Realtime Database if not present
      if (!updatedPhotoUrl) {
        updatedPhotoUrl = await fetchUserProfilePhoto(user.uid);
      }

      try {
        const roomsSnapshot = await get(ref(database, 'rooms'));
        roomsSnapshot.forEach((room) => {
          const eventCode = room.key;
          const participantRef = ref(database, `rooms/${eventCode}/participants/${user.uid}`);

          get(participantRef).then((participantSnapshot) => {
            if (participantSnapshot.exists()) {
              update(participantRef, {
                name: updatedName,
                photoUrl: updatedPhotoUrl,
              }).then(() => {
                console.log(`Participant data updated for room ${eventCode}`);
              }).catch((error) => {
                console.error(`Error updating participant data for room ${eventCode}:`, error);
              });
            }
          }).catch((error) => {
            console.error(`Error fetching participant data for room ${eventCode}:`, error);
          });
        });
      } catch (error) {
        console.error("Error fetching rooms data:", error);
      }
    } else {
      console.error("User profile data does not exist in Realtime Database.");
      // Optional: Handle scenarios where user data is missing
    }
  });
}

// Listen for user authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    listenForUserProfileChanges();
  }
});

// Listen for "Go to EventRoom" button click
document.addEventListener("DOMContentLoaded", () => {
  const joinButton = document.getElementById("joinEventBtn");
  if (joinButton) {
    joinButton.addEventListener("click", joinRoom);
  } else {
    console.error("Join Event button not found in the DOM.");
  }
});
