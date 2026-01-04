// firebase-app.js - МОДУЛЬ для Firebase v12+
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE",
    authDomain: "manual-moderation-ukraine-gta5.firebaseapp.com",
    projectId: "manual-moderation-ukraine-gta5",
    storageBucket: "manual-moderation-ukraine-gta5.firebasestorage.app",
    messagingSenderId: "28969074318",
    appId: "1:28969074318:web:ad85a4163a0d811de4d3df"
};

// Инициализируем и экспортируем
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
export const ADMIN_ID = "5316593741";
