// Upload Photo and Update Database
document.getElementById("uploadPhotoButton").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You need to log in!");
    return;
  }

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.click();

  picker.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userId = user.uid;
    const userEmail = user.email.replace(/\./g, '_');
    const userDisplayName = user.displayName?.replace(/ /g, '_') || "Guest";

    // Detect user type
    const userType = await detectUserType(eventCode, userId);
    if (!userType) {
      alert("User is not part of this room!");
      return;
    }

    const folderPath = `rooms/${eventCode}/${userType.type}s/${userDisplayName}/${userId}/photos/`;
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `${folderPath}${fileName}`);

    try {
      // Upload Image to Firebase Storage
      const snapshot = await uploadBytes(fileRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      // Update the correct user type data in the Realtime Database
      const userRef = dbRef(database, `rooms/${eventCode}/${userType.type}s/${userType.key}`);

      const updateData = {
        [`${userType.type}PhotoUrl`]: photoUrl,
        uploadedPhotoFolderPath: `${folderPath}${fileName}`
      };

      await update(userRef, updateData);

      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };
});
// Upload Photo and Update Database
document.getElementById("uploadPhotoButton").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You need to log in!");
    return;
  }

  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*";
  picker.click();

  picker.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userId = user.uid;
    const userEmail = user.email.replace(/\./g, '_');
    const userDisplayName = user.displayName.replace(/ /g, '_') || "Guest";

    // Detect user type
    const userType = await detectUserType(eventCode, userId);
    if (!userType) {
      alert("User is not part of this room!");
      return;
    }

    const folderPath = `rooms/${eventCode}/${userType.type === 'host' ? 'host' : 'guests'}/${userDisplayName}/${userId}/photos/`;
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `${folderPath}${fileName}`);

    try {
      // Upload Image to Firebase Storage
      const snapshot = await uploadBytes(fileRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      // Update the correct user type data in the Realtime Database
      const userRef = dbRef(database, `rooms/${eventCode}/${userType.type}/${userType.key}`);

      // Update the user type with the new photo URL and folder path
      await update(userRef, {
        [`${userType.type}PhotoUrl`]: photoUrl,
        uploadedPhotoFolderPath: `${folderPath}${fileName}`, // Keep the uploaded folder path
      });

      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };
});

// Window onload
window.onload = () => {
  const eventCode = new URLSearchParams(window.location.search).get("eventCode");
  if (eventCode) {
    loadEventRoom(eventCode);
  }
};
