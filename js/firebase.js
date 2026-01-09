// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE",
  authDomain: "manual-moderation-ukraine-gta5.firebaseapp.com",
  projectId: "manual-moderation-ukraine-gta5",
  storageBucket: "manual-moderation-ukraine-gta5.firebasestorage.app",
  messagingSenderId: "28969074318",
  appId: "1:28969074318:web:ad85a4163a0d811de4d3df"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
