import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// NeoDownloader Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBu1EeEI9TM9b6lmSDDmCkguVjmn7YnGBc",
    authDomain: "neo-downloader-13f8b.firebaseapp.com",
    projectId: "neo-downloader-13f8b",
    storageBucket: "neo-downloader-13f8b.firebasestorage.app",
    messagingSenderId: "1095106268936",
    appId: "1:1095106268936:web:8c5cfebbf25b985429a6bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
