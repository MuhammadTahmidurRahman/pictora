// Function to join room as a guest
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
  