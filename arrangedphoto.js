import { getStorage, ref, listAll, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js';
import { getDatabase, ref as dbRef, get } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js';

// Firebase configuration (replace with your Firebase config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

// Event Code from URL or some context (replace with actual logic)
const eventCode = 'event123';

let participants = [];
let manualParticipants = [];

// Fetch participants and manual guests data from Firebase
async function fetchParticipants() {
  const participantsRef = dbRef(database, `rooms/${eventCode}/participants`);
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

async function fetchManualParticipants() {
  const manualParticipantsRef = dbRef(database, `rooms/${eventCode}/manualParticipants`);
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

// Render participants and manual guests
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

// Fetch and display images for the selected participant
async function fetchImages(folderPath) {
  const folderRef = ref(storage, folderPath);
  const listResult = await listAll(folderRef);
  const imageUrls = [];

  for (let item of listResult.items) {
    const url = await getDownloadURL(item);
    imageUrls.push(url);
  }

  return imageUrls;
}

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

// Handle "View Photos" button click
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

// Handle closing the "No Photos" dialog
document.getElementById('closeNoPhotosDialogButton').addEventListener('click', () => {
  const noPhotosDialog = document.getElementById('noPhotosDialog');
  noPhotosDialog.classList.remove('visible');
});

// Handle downloading images as a ZIP (implement the download logic as needed)
document.getElementById('downloadAllButton').addEventListener('click', () => {
  // Implement the ZIP download functionality here
  alert('Download logic not yet implemented');
});

// Handle back button click
document.getElementById('backButton').addEventListener('click', () => {
  window.history.back();
});

// Fetch initial data
fetchParticipants();
fetchManualParticipants();
