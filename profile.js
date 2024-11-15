document.addEventListener("DOMContentLoaded", () => {
    const user = firebase.auth().currentUser;
    const databaseRef = firebase.database().ref();
    const profileImage = document.getElementById("profileImage");
    const nameField = document.getElementById("profileName");
    const emailField = document.getElementById("profileEmail");
    const editButton = document.getElementById("editButton");
    const deleteButton = document.getElementById("deleteButton");
    const logoutButton = document.getElementById("logoutButton");
  
    // Fetch user profile data
    function fetchUserProfile() {
      if (user) {
        const userRef = databaseRef.child('users').child(user.uid);
        userRef.get().then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            profileImage.src = userData.photo || '';
            nameField.textContent = userData.name || '';
            emailField.textContent = user.email || 'No Email';
          }
        }).catch((error) => {
          console.error("Error fetching profile data:", error);
        });
      }
    }
  
    // Edit name logic
    editButton.addEventListener("click", () => {
      const newName = prompt("Enter your new name:");
      if (newName && user) {
        user.updateProfile({
          displayName: newName
        }).then(() => {
          databaseRef.child('users').child(user.uid).update({
            name: newName
          }).then(() => {
            fetchUserProfile(); // Refresh profile data
          });
        }).catch((error) => {
          console.error("Error updating name:", error);
        });
      }
    });
  
    // Delete account logic
    deleteButton.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        if (user) {
          const userId = user.uid;
          // Delete user data and profile image
          databaseRef.child('users').child(userId).remove().then(() => {
            user.delete().then(() => {
              window.location.href = "login.html"; // Redirect to login
            }).catch((error) => {
              console.error("Error deleting account:", error);
            });
          });
        }
      }
    });
  
    // Logout logic
    logoutButton.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        window.location.href = "login.html"; // Redirect to login
      });
    });
  
    // Initial data fetch
    fetchUserProfile();
  });
  