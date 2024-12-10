// profile.js

// Import necessary Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  updateProfile, 
  signOut, 
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getDatabase, 
  ref as dbRef, 
  onValue, 
  get, 
  update, 
  remove 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  getDownloadURL, 
  deleteObject 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHLMbTbLBS0mhw2dLFkLt4OzBEWyubr3c",
  authDomain: "pictora-7f0ad.firebaseapp.com",
  projectId: "pictora-7f0ad",
  storageBucket: "pictora-7f0ad.appspot.com",
  messagingSenderId: "155732133141",
  databaseURL: "https://pictora-7f0ad-default-rtdb.asia-southeast1.firebasedatabase.app/",
  appId: "1:155732133141:web:c5646717494a496a6dd51c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase();
const storage = getStorage();

// DOM elements
const profileImage = document.getElementById("profileImage");
const nameField = document.getElementById("profileName");
const emailField = document.getElementById("profileEmail");
const editButton = document.getElementById("editButton");
const deleteButton = document.getElementById("deleteButton");
const logoutButton = document.getElementById("logoutButton");

// Modal DOM elements
const editModal = document.getElementById("editModal");
const closeButton = document.querySelector(".close-button");
const saveNameButton = document.getElementById("saveNameButton");
const newNameField = document.getElementById("newName");

// Listen for auth state changes and fetch profile data if logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchUserProfile(user);
    listenForProfileChanges(user);
  } else {
    console.error("User not logged in");
    window.location.href = "login.html"; // Redirect to login if not authenticated
  }
});

// Fetch user profile data
function fetchUserProfile(user) {
  const userRef = dbRef(database, `users/${user.uid}`);
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        nameField.value = userData.name || user.displayName || 'No Name';
        emailField.value = user.email || 'No Email';
        if (userData.photo) {
          getDownloadURL(storageRef(storage, userData.photo))
            .then((url) => {
              profileImage.src = url; // Set profile image from Firebase Storage
            })
            .catch((error) => {
              console.error("Error fetching photo URL:", error);
              profileImage.src = "default-avatar.png"; // Fallback to default avatar
            });
        } else {
          profileImage.src = "default-avatar.png"; // Set default avatar if no photo
        }
      } else {
        console.error("No user data found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching profile data:", error);
    });
}

// Real-time listener for user profile changes
function listenForProfileChanges(user) {
  const userRef = dbRef(database, `users/${user.uid}`);
  onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      nameField.value = userData.name || user.displayName || 'No Name';
      if (userData.photo) {
        getDownloadURL(storageRef(storage, userData.photo))
          .then((url) => {
            profileImage.src = url;
          })
          .catch((error) => {
            console.error("Error fetching photo URL:", error);
            profileImage.src = "default-avatar.png"; // Fallback to default avatar
          });
      } else {
        profileImage.src = "default-avatar.png";
      }
    }
  });
}

// Show modal on edit button click
editButton.addEventListener("click", () => {
  editModal.style.display = "block";
  newNameField.value = nameField.value;
});

// Close modal when the close button is clicked
closeButton.addEventListener("click", () => {
  editModal.style.display = "none";
});

// Close modal when clicking outside the modal content
window.addEventListener("click", (event) => {
  if (event.target == editModal) {
    editModal.style.display = "none";
  }
});

// Save new name
saveNameButton.addEventListener("click", () => {
  const newName = newNameField.value.trim();
  if (newName) {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    updateProfile(user, { displayName: newName })
      .then(() => {
        const userRef = dbRef(database, `users/${user.uid}`);
        return update(userRef, { name: newName });
      })
      .then(() => {
        return updateNameInRooms(user.uid, newName);
      })
      .then(() => {
        editModal.style.display = "none";
      })
      .catch((error) => {
        console.error("Error updating name:", error);
        alert(`Error updating name: ${error.message}`);
      });
  } else {
    alert("Name cannot be empty.");
  }
});

// Update name in all rooms where the user is a host or participant
function updateNameInRooms(uid, newName) {
  const roomsRef = dbRef(database, `rooms`);
  return get(roomsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const roomsData = snapshot.val();
        const updates = {};

        Object.keys(roomsData).forEach((roomId) => {
          const room = roomsData[roomId];

          // Update if user is the host
          if (room.hostId === uid) {
            updates[`/rooms/${roomId}/hostName`] = newName;
          }

          // Update if user is a participant
          if (room.participants) {
            if (room.participants[uid]) {
              updates[`/rooms/${roomId}/participants/${uid}/name`] = newName;
            }
          }
        });

        return update(dbRef(database), updates);
      }
    })
    .then(() => {
      console.log("Name updated in all relevant rooms.");
    })
    .catch((error) => {
      console.error("Error updating name in rooms:", error);
    });
}

// Delete account logic
deleteButton.addEventListener("click", () => {
  const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.");
  if (confirmation) {
    deleteAccount();
  }
});

async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated");
    return;
  }

  const uid = user.uid;

  try {
    // Delete profile image from Firebase Storage
    const userSnapshot = await get(dbRef(database, `users/${uid}`));
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      if (userData.photo) {
        const photoRef = storageRef(storage, userData.photo);
        await deleteObject(photoRef);
      }
    }

    // Remove user from all participants lists in rooms
    const roomsSnapshotBefore = await get(dbRef(database, `rooms`));
    if (roomsSnapshotBefore.exists()) {
      const roomsDataBefore = roomsSnapshotBefore.val();
      const updatesBefore = {};

      Object.keys(roomsDataBefore).forEach((roomId) => {
        const roomData = roomsDataBefore[roomId];

        // If user is the host, skip removing them here as they will be handled later
        if (roomData.hostId === uid) return;

        // If user is a participant, remove them
        if (roomData.participants && roomData.participants[uid]) {
          updatesBefore[`/rooms/${roomId}/participants/${uid}`] = null;
        }
      });

      if (Object.keys(updatesBefore).length > 0) {
        await update(dbRef(database), updatesBefore);
      }
    }

    // Delete user data from Firebase Realtime Database
    await remove(dbRef(database, `users/${uid}`));

    // Delete user's hosted rooms
    const roomsSnapshot = await get(dbRef(database, `rooms`));
    if (roomsSnapshot.exists()) {
      const roomsData = roomsSnapshot.val();
      const updates = {};

      Object.keys(roomsData).forEach((roomId) => {
        const room = roomsData[roomId];
        if (room.hostId === uid) {
          updates[`/rooms/${roomId}`] = null; // Remove the room
        }
      });

      await update(dbRef(database), updates);
    }

    // Reauthenticate user before deletion
    const providerData = user.providerData[0];
    if (providerData.providerId === 'google.com') {
      // Reauthenticate with Google
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else if (user.email) {
      // Email/Password reauthentication
      const password = prompt("Please enter your password for reauthentication:");
      if (!password) {
        console.error("No password entered for reauthentication.");
        return;
      }
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    // Delete user account from Firebase Auth
    await deleteUser(user);

    // Redirect to login page
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error deleting account:", error);
    alert(`Error deleting account: ${error.message}`);
  }
}

// Logout logic
logoutButton.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html"; // Redirect to login
    })
    .catch((error) => {
      console.error("Error signing out:", error);
      alert(`Error signing out: ${error.message}`);
    });
});
