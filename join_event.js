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

let user = null;
let userName = '';
let userEmail = '';
let userPhotoUrl = '';

// Track authentication state
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    userName = user.displayName || 'Guest';
    userEmail = user.email;
    userPhotoUrl = user.photoURL || '';
    console.log('User logged in:', user.email);
  } else {
    console.log('No user is logged in');
    user = null;
  }
});

// Function to join the room, checking if the user is already the host or a guest
async function joinRoom(eventCode, roomName) {
  if (!user) {
    alert('Please log in to join the room!');
    return;
  }

  const userEmailKey = userEmail.replace(/\./g, '_');
  const userId = user.uid;

  // Check if the user is already listed as the host in the room
  const hostRef = ref(database, `rooms/${eventCode}/host`);
  const hostSnapshot = await get(hostRef);

  let isHost = false;
  hostSnapshot.forEach((childSnapshot) => {
    if (childSnapshot.val().hostId === userId) {
      isHost = true;
    }
  });

  if (isHost) {
    alert("You are the host of this room.");
    window.location.href = `eventroom.html?eventCode=${eventCode}`;
    return;
  }

  // Check if the user is already listed as a guest in the room
  const guestRef = ref(database, `rooms/${eventCode}/guests`);
  const guestSnapshot = await get(guestRef);

  let isGuest = false;
  guestSnapshot.forEach((childSnapshot) => {
    if (childSnapshot.val().guestId === userId) {
      isGuest = true;
    }
  });

  if (isGuest) {
    alert("You are already a guest in this room!");
    window.location.href = `eventroom.html?eventCode=${eventCode}`;
    return;
  }

  // Fetch user data from Firebase Realtime Database
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);

  if (!userSnapshot.exists()) {
    alert('User information not found!');
    return;
  }

  // Extract guest details from the user snapshot
  const guestName = userSnapshot.val().name || userName;
  const guestPhotoUrl = userSnapshot.val().photo || userPhotoUrl;

  // Prepare guest data object
  const guestData = {
    guestId: userId,
    guestName,
    guestEmail: userEmail,
    guestPhotoUrl,
  };

  // Generate composite key in the format: eventCode_roomName__userEmailKey_guestName
  const compositeKey = `${eventCode}_${roomName}__${userEmailKey}_${guestName}`;
  const newGuestRef = ref(database, `rooms/${eventCode}/guests/${compositeKey}`);
  
  // Add guest data to the room
  await set(newGuestRef, guestData);

  // Listen for changes in user data and update room guest data
  onValue(userRef, async (snapshot) => {
    if (snapshot.exists()) {
      const updatedName = snapshot.val().name || guestName;
      const updatedPhotoUrl = snapshot.val().photo || guestPhotoUrl;

      if (updatedName !== guestName || updatedPhotoUrl !== guestPhotoUrl) {
        // Update local variables
        guestName = updatedName;
        guestPhotoUrl = updatedPhotoUrl;

        // Update guest data in the room
        await update(newGuestRef, {
          guestName: updatedName,
          guestPhotoUrl: updatedPhotoUrl,
        });

        // Create a new composite key if the guest name has changed
        const newCompositeKey = `${eventCode}_${roomName}__${userEmailKey}_${updatedName}`;
        if (newCompositeKey !== compositeKey) {
          const updatedGuestRef = ref(database, `rooms/${eventCode}/guests/${newCompositeKey}`);

          // Remove old entry and add new entry with updated composite key
          await set(updatedGuestRef, guestData);
          await update(updatedGuestRef, {
            guestName: updatedName,
            guestPhotoUrl: updatedPhotoUrl,
          });
          await ref(database, `rooms/${eventCode}/guests/${compositeKey}`).remove();
        }
      }
    }
  });

  // Redirect to the event room page
  window.location.href = `eventroom.html?eventCode=${eventCode}`;
}

// Function to navigate to the event room after checking the code
async function navigateToEventRoom() {
  const eventCode = document.getElementById('eventCodeInput').value.trim();
  if (!eventCode) {
    alert('Please enter a code.');
    return;
  }

  try {
    const roomRef = ref(database, `rooms/${eventCode}`);
    const roomSnapshot = await get(roomRef);

    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.val();
      const roomName = roomData.roomName || 'No Room Name';

      // Join the room as a guest or confirm host status
      await joinRoom(eventCode, roomName);
    } else {
      alert('Room does not exist!');
    }
  } catch (error) {
    console.error('Error navigating to event room:', error);
    alert('An error occurred while verifying the room code.');
  }
}

// Go back to the previous page
function goBack() {
  window.history.back();
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('joinEventBtn').addEventListener('click', navigateToEventRoom);
  document.getElementById('backButton').addEventListener('click', goBack);
});
