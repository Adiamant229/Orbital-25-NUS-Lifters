import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase config
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

// Initialize Auth conditionally (native vs web)
let auth;

if (Platform.OS === "web") {
  auth = getAuth(app); // web doesn't use AsyncStorage
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

export const db = getFirestore(app);
