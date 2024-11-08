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
  const navigateButton = document.getElementById('navigateButton');
  const backButton = document.getElementById('backButton');
  let user = auth.currentUser;
  
  // Function to join room as a guest
  async function joinRoomAsGuest(eventCode) {
    user = auth.currentUser;
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
  
    if (!snapshot.exists()) {
      await roomRef.set(guestData);
      alert('You have successfully joined the room!');
      window.location.href = `eventroom.html?eventCode=${eventCode}`;
    } else {
      alert('You have already joined this room!');
      window.location.href = `eventroom.html?eventCode=${eventCode}`;
    }
  }
  
  // Function to navigate to the event room after checking the code
  async function navigateToEventRoom() {
    const eventCode = eventCodeInput.value.trim();
    if (!eventCode) {
      alert('Please enter a code.');
      return;
    }
  
    // Check if the room exists
    const snapshot = await database.ref(`rooms/${eventCode}`).get();
    if (snapshot.exists()) {
      // Join the room as a guest
      await joinRoomAsGuest(eventCode);
    } else {
      alert('Room does not exist!');
    }
  }
  
  // Go back to the previous page
  function goBack() {
    window.history.back();
  }
  
  // Event Listeners
  navigateButton.addEventListener('click', navigateToEventRoom);
  backButton.addEventListener('click', goBack);
  