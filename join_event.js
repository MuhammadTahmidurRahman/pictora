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

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  const joinEventBtn = document.getElementById('joinEventBtn');
  const backButton = document.getElementById('backButton');
  const eventCodeInput = document.getElementById('eventCodeInput');

  if (joinEventBtn) {
    console.log('Join Event button found');
    joinEventBtn.addEventListener('click', navigateToEventRoom);
  } else {
    console.error('Join Event button not found');
  }

  if (backButton) {
    console.log('Back button found');
    backButton.addEventListener('click', goBack);
  } else {
    console.error('Back button not found');
  }
});

// Track user authentication state
let user = null;
onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log('User logged in:', user.email);
  } else {
    console.log('No user is logged in');
    user = null;
  }
});

// Function to join room as a guest
async function joinRoomAsGuest(eventCode) {
  if (!user) {
    alert('Please log in to join the room!');
    return;
  }

  const userEmailKey = user.email.replace('.', '_');
  const guestKey = `${eventCode}_${user.displayName}_${userEmailKey}`;

  const guestData = {
    eventCode: eventCode,
    guestId: user.uid,
    guestName: user.displayName || 'Guest',
    guestEmail: user.email,
    guestPhotoUrl: user.photoURL || '',
  };

  const roomRef = ref(database, `rooms/${eventCode}/guests/${guestKey}`);
  const snapshot = await get(roomRef);

  try {
    if (!snapshot.exists()) {
      await set(roomRef, guestData);
      alert('You have successfully joined the room!');
    } else {
      alert('You have already joined this room!');
    }
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

  console.log('Navigating to event room with code:', eventCode);

  try {
    const snapshot = await get(ref(database, `rooms/${eventCode}`));
    if (snapshot.exists()) {
      await joinRoomAsGuest(eventCode);
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
