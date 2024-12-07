import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';
import { getStorage, ref as storageRef, listAll, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js';

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
const database = getDatabase(app);
const storage = getStorage(app);

// Get event code dynamically (replace with actual logic)
const eventCode = 'event123';  // Example event code

let participants = [];
let manualParticipants = [];

// Fetch participants from Firebase
async function fetchParticipants() {
  const participantsRef = ref(database, `rooms/${eventCode}/participants`);
  const snapshot = await get(participantsRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    participants = Object.keys(data).map(id => ({
      id,
      name: data[id].name,
      photoUrl: data[id].photoUrl,
      folderPath: `rooms/${eventCode}/${id}/photos`
    }));
    renderParticipants();
  }
}

// Fetch manual participants from Firebase
async function fetchManualParticipants() {
  const manualParticipantsRef = ref(database, `rooms/${eventCode}/manualParticipants`);
  const snapshot = await get(manualParticipantsRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    manualParticipants = Object.keys(data).map(id => ({
      id,
      name: data[id].name,
      photoUrl: data[id].photoUrl,
      folderPath: `rooms/${eventCode}/${id}/photos`
    }));
    renderManualParticipants();
  }
}

// Render the participant list
function renderParticipants() {
  const participantList = document.getElementById('participantList');
  participantList.innerHTML = '';
  participants.forEach(participant => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${participant.photoUrl || 'default.jpg'}" alt="Photo">
      <span>${participant.name}</span>
      <button class="viewPhotosButton" data-folder="${participant.folderPath}">View Photos</button>
    `;
    participantList.appendChild(li);
  });
}

// Render the manual guest list
function renderManualParticipants() {
  const manualGuestList = document.getElementById('manualGuestList');
  manualGuestList.innerHTML = '';
  manualParticipants.forEach(participant => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${participant.photoUrl || 'default.jpg'}" alt="Photo">
      <span>${participant.name}</span>
      <button class="viewPhotosButton" data-folder="${participant.folderPath}">View Photos</button>
    `;
    manualGuestList.appendChild(li);
  });
}

// Fetch images from Firebase Storage
async function fetchImages(folderPath) {
  const folderRef = storageRef(storage, folderPath);
  const listResult = await listAll(folderRef);
  const imageUrls = [];

  for (let item of listResult.items) {
    const url = await getDownloadURL(item);
    imageUrls.push(url);
  }

  return imageUrls;
}

// Show the image gallery in a dialog
function showImageGallery(images) {
  const imageGallery = document.getElementById('imageGallery');
  imageGallery.innerHTML = '';
  images.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    imageGallery.appendChild(img);
  });

  const dialog = document.getElementById('imageGalleryDialog');
  dialog.classList.add('visible');
}

// Handle the "View Photos" button click
document.body.addEventListener('click', async (e) => {
  if (e.target.classList.contains('viewPhotosButton')) {
    const folderPath = e.target.getAttribute('data-folder');
    const images = await fetchImages(folderPath);

    if (images.length === 0) {
      const noPhotosDialog = document.getElementById('noPhotosDialog');
      noPhotosDialog.classList.add('visible');
    } else {
      showImageGallery(images);
    }
  }
});

// Close the "No Photos" dialog
document.getElementById('closeNoPhotosDialogButton').addEventListener('click', () => {
  const noPhotosDialog = document.getElementById('noPhotosDialog');
  noPhotosDialog.classList.remove('visible');
});

// Back Button Event
document.getElementById('backButton').addEventListener('click', () => {
  window.history.back();
});

// Function to update the sortPhotoRequest value
async function updateSortPhotoRequest(eventCode) {
  const hostRef = ref(database, `rooms/${eventCode}/host`);

  try {
    // Get the current sortPhotoRequest value
    const snapshot = await get(hostRef);
    let currentSortValue = snapshot.exists() ? snapshot.val().sortPhotoRequest : 0.0;

    // Increment the value by 1
    const newSortValue = currentSortValue + 1.0;

    // Update the sortPhotoRequest field in the database
    await set(hostRef, {
      sortPhotoRequest: newSortValue,
    });

    console.log(`sortPhotoRequest field updated to ${newSortValue}.`);

  } catch (error) {
    console.error("Error updating sortPhotoRequest field:", error);
  }
}

// Initialize Arrange Room Page
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      fetchParticipants();
      fetchManualParticipants();
      updateSortPhotoRequest(eventCode);  // Increment and update sortPhotoRequest each time
    } else {
      alert("Event code is missing.");
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});
