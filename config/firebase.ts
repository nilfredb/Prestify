// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkXhjeAOxQ8MDVCsF7fNBPkLJrO4IDw18",
  authDomain: "expense-tracker-d5bf1.firebaseapp.com",
  projectId: "expense-tracker-d5bf1",
  storageBucket: "expense-tracker-d5bf1.firebasestorage.app",
  messagingSenderId: "1044275495768",
  appId: "1:1044275495768:web:2b5991725d1c5ab9889b2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


//auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

//db

export const firestore = getFirestore(app);