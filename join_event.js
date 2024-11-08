// Function to join room as a guest
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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


async function joinRoomAsGuest(eventCode) {
    if (!user) {
      alert('Please log in to join the room!');
      return;
    }
  
    const userEmail = user.email.replace('.', '_'); // Firebase does not allow '.' in keys, replace it with '_'
    const guestData = {
      guestId: user.uid,
      guestName: user.displayName || 'Guest',
      guestEmail: user.email,
      guestPhotoUrl: user.photoURL || '',
    };
  
    // Structure the reference to store in the database
    const roomRef = ref(database, `rooms/${eventCode}/guests/${eventCode}_${userEmail}_${user.displayName}`);
    
    const snapshot = await get(roomRef);
  
    try {
      if (!snapshot.exists()) {
        // Set the guest data under the correct path
        await set(roomRef, guestData);
        alert('You have successfully joined the room!');
      } else {
        alert('You have already joined this room!');
      }
      
      // Navigate to the event room page after joining
      window.location.href = `eventroom.html?eventCode=${eventCode}`;
    } catch (error) {
      console.error('Error joining room:', error);
      alert('An error occurred while trying to join the room.');
    }
  }
  