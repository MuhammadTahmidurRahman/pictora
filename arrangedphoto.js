import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:155732133141:web:c5646717494a496a6dd51c",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage();
const database = getDatabase(app);

// Load Participant Photos
async function loadPhotos(eventCode) {
  const participantsRef = ref(database, `rooms/${eventCode}/participants`);
  const manualParticipantsRef = ref(database, `rooms/${eventCode}/manualParticipants`);
  const photoContainer = document.getElementById("photoContainer");

  try {
    const participantsSnapshot = await get(participantsRef);
    const manualParticipantsSnapshot = await get(manualParticipantsRef);

    const participants = [];
    const manualParticipants = [];

    // Fetch participants
    if (participantsSnapshot.exists()) {
      const data = participantsSnapshot.val();
      Object.keys(data).forEach(participantId => {
        participants.push({
          id: participantId,
          name: data[participantId].name,
          photoUrl: data[participantId].photoUrl,
          folderPath: `rooms/${eventCode}/${participantId}/photos`,
        });
      });
    }

    // Fetch manual participants
    if (manualParticipantsSnapshot.exists()) {
      const data = manualParticipantsSnapshot.val();
      Object.keys(data).forEach(manualParticipantId => {
        manualParticipants.push({
          id: manualParticipantId,
          name: data[manualParticipantId].name,
          photoUrl: data[manualParticipantId].photoUrl,
          folderPath: `rooms/${eventCode}/${manualParticipantId}/photos`,
        });
      });
    }

    // Render Participants
    photoContainer.innerHTML = '';
    await renderParticipantPhotos(participants, eventCode);
    await renderParticipantPhotos(manualParticipants, eventCode);

  } catch (error) {
    console.error("Error loading participants:", error);
  }
}

// Fetch and display participant photos from their respective folders
async function renderParticipantPhotos(participants, eventCode) {
  for (const participant of participants) {
    const images = await fetchImages(participant.folderPath);
    if (images.length > 0) {
      const participantElement = createParticipantElement(participant, images);
      document.getElementById("photoContainer").appendChild(participantElement);
    }
  }
}

// Fetch photos from Firebase Storage
async function fetchImages(folderPath) {
  const folderRef = storageRef(storage, folderPath);
  try {
    const listResult = await listAll(folderRef);
    const imageUrls = [];
    for (const item of listResult.items) {
      const url = await getDownloadURL(item);
      imageUrls.push(url);
    }
    return imageUrls;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

// Create HTML structure for participant and their photos
function createParticipantElement(participant, images) {
  const participantContainer = document.createElement("div");
  participantContainer.classList.add("participant-container");

  const nameElement = document.createElement("h3");
  nameElement.innerText = participant.name;

  const imageGallery = document.createElement("div");
  imageGallery.classList.add("image-gallery");

  images.forEach((imageUrl, index) => {
    const imageElement = document.createElement("img");
    imageElement.src = imageUrl;
    imageElement.alt = `Image ${index + 1}`;
    imageGallery.appendChild(imageElement);
  });

  const downloadButton = document.createElement("button");
  downloadButton.innerText = "Download All";
  downloadButton.onclick = () => downloadImagesAsZip(images);

  participantContainer.appendChild(nameElement);
  participantContainer.appendChild(imageGallery);
  participantContainer.appendChild(downloadButton);

  return participantContainer;
}

// Download images as ZIP (similar to Flutter app)
async function downloadImagesAsZip(images) {
  try {
    const zip = new JSZip();
    for (let i = 0; i < images.length; i++) {
      const response = await fetch(images[i]);
      const blob = await response.blob();
      zip.file(`image_${i + 1}.jpg`, blob);
    }

    zip.generateAsync({ type: "blob" }).then(function(content) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "images.zip";
      link.click();
    });
  } catch (error) {
    console.error("Error downloading images as ZIP:", error);
  }
}

// Initialize page when user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    const eventCode = new URLSearchParams(window.location.search).get("eventCode");
    if (eventCode) {
      loadPhotos(eventCode);  // Load and display participant photos
    } else {
      alert("Event code is missing.");
    }
  } else {
    alert("Please log in to access this page.");
    window.location.href = "login.html";
  }
});
