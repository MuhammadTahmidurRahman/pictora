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

let user = null;

// Track authentication state
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log('User logged in:', user.email);
  } else {
    console.log('No user is logged in');
    user = null;
  }
});

// Function to join the room as a guest
async function joinRoomAsGuest(eventCode, roomName) {
  if (!user) {
    alert('Please log in to join the room!');
    return;
  }

  const userEmailKey = user.email.replace(/\./g, '_');
  // Generate guestKey in the format: IEPVZNF9_Sad Day__tahmidworksinworkstation@gmail_com_Muhammad Tahmidur Rahman
  const guestKey = `${eventCode}_${roomName}__${userEmailKey}_${user.displayName}`;

  // Prepare guest data object
  const guestData = {
    guestEmail: user.email,
    guestId: user.uid,
    guestName: user.displayName || 'Guest',
    guestPhotoUrl: user.photoURL || '',
  };

  const roomRef = ref(database, `rooms/${eventCode}/guests/${guestKey}`);
  const snapshot = await get(roomRef);

  try {
    if (!snapshot.exists()) {
      // Store guest data if not already exists
      await set(roomRef, guestData);
      alert('You have successfully joined the room!');
    } else {
      alert('You have already joined this room!');
    }
    // Navigate to event room page
    window.location.href = `eventroom.html?eventCode=${eventCode}`;
  } catch (error) {
    console.error('Error joining room:', error);
    alert('An error occurred while trying to join the room.');
  }
}

// Function to navigate to the event room after checking the code
async function navigateToEventRoom() {
  const eventCode = document.getElementById('eventCodeInput').value.trim();
  if (!eventCode) {
    alert('Please enter a code.');
    return;
  }

  try {
    // Check if the room exists
    const roomSnapshot = await get(ref(database, `rooms/${eventCode}`));
    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.val();
      const roomName = roomData.host.roomName || 'No Name';

      console.log(`Room found: ${roomName}`);
      
      // Join the room as a guest with the room name
      await joinRoomAsGuest(eventCode, roomName);
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
