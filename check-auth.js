// check-auth.js - модуль для проверки авторизации
import { db, ADMIN_ID } from './firebase-app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export async function checkAuth() {
    const userId = sessionStorage.getItem('user_id');
    const userName = sessionStorage.getItem('user_name');
    
    if (!userId || !userName) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (!userDoc.exists()) {
            sessionStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        
        const userData = userDoc.data();
        
        if (userData.status !== 'approved' && !userData.isAdmin) {
            sessionStorage.clear();
            window.location.href = 'login.html';
            return false;
        }
        
        return userData;
        
    } catch (error) {
        console.error('Помилка перевірки авторизації:', error);
        return false;
    }
}
