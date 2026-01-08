import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMVwxsB4p_3K3wQK_Thq7sOr7Oxl91eOo",
    authDomain: "moderator-manual-5e90a.firebaseapp.com",
    projectId: "moderator-manual-5e90a",
    storageBucket: "moderator-manual-5e90a.firebasestorage.app",
    messagingSenderId: "242155394117",
    appId: "1:242155394117:web:6724769f402830c34894a7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
