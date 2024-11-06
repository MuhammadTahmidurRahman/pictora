
function goBack() {
    window.history.back();
  }
  
  function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
  }
  
  function showImagePicker() {
    document.getElementById("image").click();
  }
  
  function displayImage(input) {
    const uploadText = document.getElementById("upload-text");
    if (input.files && input.files[0]) {
      uploadText.textContent = "Photo selected";
    } else {
      uploadText.textContent = "Upload your photo here";
    }
  }
  
  function registerUser() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();
  
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill up all the information boxes.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    alert("User registered successfully (simulated).");
  }
  
  function signInWithGoogle() {
    const image = document.getElementById("image").files[0];
    if (!image) {
      alert("Please upload an image before signing up with Google.");
      return;
    }
    alert("Google Sign-In successful (simulated).");
  }
  