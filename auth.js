import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.3./firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.3/firebase-auth.js";

const auth = getAuth();
const storage = getStorage();

export async function registerUser(name, email, password, confirmPassword, file) {
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Upload image to Firebase Storage
        const storageRef = ref(storage, `uploads/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Image uploaded successfully, download URL:", downloadURL);
        // You can now save the URL in your database or display it as needed.

    } catch (error) {
        console.error("Error registering user:", error);
        alert(error.message);
    }
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Get the file from the image upload input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput.files.length === 0) {
            alert("Please upload an image to proceed with Google Sign-In.");
            return;
        }

        // Upload the image
        const storageRef = ref(storage, `uploads/${user.uid}/${fileInput.files[0].name}`);
        await uploadBytes(storageRef, fileInput.files[0]);
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Image uploaded successfully after Google Sign-In, download URL:", downloadURL);

    } catch (error) {
        console.error("Error signing in with Google:", error);
        alert(error.message);
    }
}
