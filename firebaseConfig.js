// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4A9RWGpRdmUaDuk9K0Ezka76KtGFT7YM",
  authDomain: "nus-lifters-club.firebaseapp.com",
  projectId: "nus-lifters-club",
  storageBucket: "nus-lifters-club.firebasestorage.app",
  messagingSenderId: "962344894507",
  appId: "1:962344894507:web:76d3059bafb802678aaa6e",
  measurementId: "G-QPDRWZTXRQ",
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize auth
export const auth = getAuth(app);

// Set persistence to browserLocalPersistence (works in Expo Go)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to browserLocalPersistence");
  })
  .catch((error) => {
    console.error("Failed to set persistence:", error);
  });

// Initialize Firestore
export const db = getFirestore(app);
