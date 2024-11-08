// Firebase Configuration
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
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const database = firebase.database();
  
  const eventCodeInput = document.getElementById('eventCodeInput');
  const joinEventBtn = document.getElementById('joinEventBtn');
  const backButton = document.getElementById('backButton');
  let user = null;
  
  // Listen for auth state changes to update the `user` variable
  auth.onAuthStateChanged((currentUser) => {
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
  
    const userEmail = user.email.replace('.', '_');
    const guestData = {
      guestId: user.uid,
      guestName: user.displayName || 'Guest',
      guestEmail: user.email,
      guestPhotoUrl: user.photoURL || '',
    };
  
    const roomRef = database.ref(`rooms/${eventCode}/guests/${userEmail}`);
    const snapshot = await roomRef.get();
  
    try {
      if (!snapshot.exists()) {
        await roomRef.set(guestData);
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
    const eventCode = eventCodeInput.value.trim();
    if (!eventCode) {
      alert('Please enter a code.');
      return;
    }
  
    try {
      // Check if the room exists
      const snapshot = await database.ref(`rooms/${eventCode}`).get();
      if (snapshot.exists()) {
        // Join the room as a guest
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
  
  // Event Listeners
  joinEventBtn.addEventListener('click', navigateToEventRoom);
  backButton.addEventListener('click', goBack);
  