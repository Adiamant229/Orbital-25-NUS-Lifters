import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFunctions } from "firebase/functions"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD4A9RWGpRdmUaDuk9K0Ezka76KtGFT7YM",
  authDomain: "nus-lifters-club.firebaseapp.com",
  projectId: "nus-lifters-club",
  storageBucket: "nus-lifters-club.firebasestorage.app",
  messagingSenderId: "962344894507",
  appId: "1:962344894507:web:76d3059bafb802678aaa6e",
  measurementId: "G-QPDRWZTXRQ",
};

const app = initializeApp(firebaseConfig);

const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

const db = getFirestore(app);
const functions = getFunctions(app);
export {app, auth, db, functions}