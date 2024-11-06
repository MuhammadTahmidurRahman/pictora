// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Login with email and password
  function loginWithEmailPassword() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert("Login successful");
        // Redirect or navigate to the homepage
      })
      .catch((error) => {
        console.error("Login failed:", error);
        alert("Failed to log in. Please check your credentials.");
      });
  }
  
  // Login with Google
  function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
  
    auth.signInWithPopup(provider)
      .then(() => {
        alert("Google sign-in successful");
        // Redirect or navigate to the homepage
      })
      .catch((error) => {
        console.error("Google sign-in failed:", error);
        alert("Failed to sign in with Google.");
      });
  }
  