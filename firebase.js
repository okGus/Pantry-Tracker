// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyHAmZKmHs_gd1cC4wk3ESPWyqkgBgS2k",
  authDomain: "pantrytracker-57450.firebaseapp.com",
  projectId: "pantrytracker-57450",
  storageBucket: "pantrytracker-57450.appspot.com",
  messagingSenderId: "623084156328",
  appId: "1:623084156328:web:8f1619e1380db4502e199d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app)
export {app, firestore}