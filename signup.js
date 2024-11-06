// signup.js
import { registerUser, signInWithGoogle } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
    const signupBtn = document.getElementById('signupBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const imageUpload = document.getElementById('imageUpload');

    // Enable buttons when an image is uploaded
    imageUpload.addEventListener('change', () => {
        const files = imageUpload.files;
        signupBtn.disabled = files.length === 0;
        googleSignInBtn.disabled = files.length === 0;
    });

    // Signup button event listener
    signupBtn.addEventListener('click', () => {
        if (imageUpload.files.length === 0) {
            alert("Please upload an image to proceed with signup.");
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Pass image file to registerUser
        registerUser(name, email, password, confirmPassword, imageUpload.files[0]);
    });

    // Google Sign-In button event listener
    googleSignInBtn.addEventListener('click', () => {
        if (imageUpload.files.length === 0) {
            alert("Please upload an image to proceed with Google Sign-In.");
            return;
        }

        signInWithGoogle();
    });
});
