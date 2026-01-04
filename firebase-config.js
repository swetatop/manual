// firebase-config.js
// ЗАМЕНИ ЭТИ ДАННЫЕ НА СВОИ С FIREBASE!

const firebaseConfig = {
    apiKey: "AIzaSyABC123456",
    authDomain: "ukraine-gta-5.firebaseapp.com",
    projectId: "ukraine-gta-5",
    storageBucket: "ukraine-gta-5.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Инициализация Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');
    }
} catch (error) {
    console.error('❌ Ошибка Firebase:', error);
}

// Глобальные переменные
const db = firebase.firestore();
const auth = firebase.auth();

// Коллекции Firestore
const USERS_COLLECTION = "users";
const REQUESTS_COLLECTION = "access_requests";
const ADMINS_COLLECTION = "admins";

// ID админа (ты)
const ADMIN_ID = "5316593741";
