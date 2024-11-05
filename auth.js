// Import the necessary Firebase modules
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Initialize Firebase Authentication and Storage
const auth = getAuth();
const storage = getStorage();

export async function registerUser(name, email, password, confirmPassword, imageUpload) {
    // Check if all fields are filled
    if (!name || !email || !password || !confirmPassword) {
        alert("Please fill in all fields");
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    // Check password length
    if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Upload image to Firebase Storage if provided
        if (imageUpload) {
            const storageRef = ref(storage, `uploads/${user.uid}`);
            await uploadBytes(storageRef, imageUpload);
            const imageUrl = await getDownloadURL(storageRef);

            // Here you can implement the logic to store user's details along with the imageUrl
            console.log(`User created: ${user.uid}, Image URL: ${imageUrl}`);
        }

        alert("User registered successfully!");
        // Redirect to another page or perform further actions
    } catch (error) {
        console.error("Error signing up: ", error);
        alert(error.message);
    }
}

export function navigateToLogin() {
    window.location.href = "login.html"; // Adjust the URL to your login page
}
