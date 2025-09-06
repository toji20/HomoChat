// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "homochat-5da74.firebaseapp.com",
  projectId: "homochat-5da74",
  storageBucket: "homochat-5da74.firebasestorage.app",
  messagingSenderId: "739309243935",
  appId: "1:739309243935:web:78624d15f20a7ddc644f2a",
  measurementId: "G-GRS0R90K30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Optional: Export the app instance if needed elsewhere
export default app;