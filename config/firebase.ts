// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBlInh2U8LxmPeyYl7p3O2UprZI3ab6Buo",
    authDomain: "appi-4a197.firebaseapp.com",
    projectId: "appi-4a197",
    storageBucket: "appi-4a197.firebasestorage.app",
    messagingSenderId: "990521206834",
    appId: "1:990521206834:web:a0a051a22d5525a346342b",
    measurementId: "G-8WP6GR224P"
  };  

// Initialize Firebase
const app = initializeApp(firebaseConfig);


//auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

//db

export const firestore = getFirestore(app);