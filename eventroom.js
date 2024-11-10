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

    // Detect user type
    const userType = await detectUserType(eventCode, userId);
    if (!userType) {
      alert("User is not part of this room!");
      return;
    }

    const folderPath = `rooms/${eventCode}/${userType.type === 'host' ? 'host' : 'guests'}/${userType.key}/photos/`;
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `${folderPath}${fileName}`);

    try {
      // Upload Image to Firebase Storage
      const snapshot = await uploadBytes(fileRef, file);
      const photoUrl = await getDownloadURL(snapshot.ref);

      // Update the uploaded photo folder path only, without changing the profile picture URL
      const userRef = dbRef(database, `rooms/${eventCode}/${userType.type}/${userType.key}`);
      
      await update(userRef, {
        uploadedPhotoFolderPath: folderPath
      });

      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo.");
    }
  };
});
