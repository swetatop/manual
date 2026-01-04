// Файл: check-auth.js
// Проверка авторизации

function checkAuth() {
    console.log('🔐 Проверка авторизации...');
    
    // Проверяем данные в localStorage
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!authToken || !userData) {
        console.log('❌ Нет авторизации');
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        const userId = user.id;
        const access = localStorage.getItem(`access_${userId}`);
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        console.log('👤 Пользователь:', user.first_name);
        console.log('🆔 ID:', userId);
        console.log('👑 Админ:', isAdmin);
        console.log('✅ Доступ:', access);
        
        // Проверяем доступ
        if (access !== 'approved' && !isAdmin) {
            console.log('❌ Доступ не подтвержден');
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('✅ Авторизация успешна');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка проверки:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Проверяем на всех страницах кроме login и auth-handler
if (!window.location.pathname.includes('login.html') && 
    !window.location.pathname.includes('auth-handler.html')) {
    
    document.addEventListener('DOMContentLoaded', checkAuth);
}
