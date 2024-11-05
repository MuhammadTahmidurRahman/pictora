// Import the necessary Firebase modules
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
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
        console.log(`User created: ${user.uid}`);

        // Upload image to Firebase Storage if provided
        if (imageUpload) {
            const storageRef = ref(storage, `uploads/${user.uid}/${imageUpload.name}`); // Include the filename for easier access
            await uploadBytes(storageRef, imageUpload);
            const imageUrl = await getDownloadURL(storageRef);
            console.log(`User created: ${user.uid}, Image URL: ${imageUrl}`);
            alert("User registered successfully with image uploaded!");
        } else {
            console.log("No image uploaded.");
            alert("User registered successfully without an image.");
        }

        // Redirect or further actions
    } catch (error) {
        console.error("Error signing up: ", error);
        alert(error.message);
    }
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        console.log("Attempting to sign in with Google...");
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log(`User signed in: ${user.uid}`);
        alert("User signed in with Google successfully!");
        // Redirect or further actions
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        alert(error.message);
    }
}

export function navigateToLogin() {
    window.location.href = "login.html"; // Adjust the URL to your login page
}
