// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFireStore } from "firebase/firesstore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4A9RWGpRdmUaDuk9K0Ezka76KtGFT7YM",
  authDomain: "nus-lifters-club.firebaseapp.com",
  projectId: "nus-lifters-club",
  storageBucket: "nus-lifters-club.firebasestorage.app",
  messagingSenderId: "962344894507",
  appId: "1:962344894507:web:76d3059bafb802678aaa6e",
  measurementId: "G-QPDRWZTXRQ",
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFireStore(FIREBASE_APP);
