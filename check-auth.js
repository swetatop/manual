// check-auth.js - модуль для проверки авторизации
import { db, ADMIN_ID } from './firebase-app.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export async function checkAuth() {
    console.log('🔐 Проверка авторизации...');
    
    // Проверяем разные способы хранения данных
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    const userName = sessionStorage.getItem('user_name') || localStorage.getItem('user_name');
    const authToken = localStorage.getItem('authToken');
    
    console.log('📊 Данные пользователя:');
    console.log('  User ID:', userId);
    console.log('  User Name:', userName);
    console.log('  Auth Token:', authToken ? '✅ есть' : '❌ нет');
    
    if (!userId || !userName) {
        console.log('❌ Нет данных пользователя, перенаправляем на login.html');
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        // Проверяем в Firebase
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (!userDoc.exists()) {
            console.log('❌ Пользователь не найден в Firebase');
            
            // Пробуем демо-режим для админа
            if (userId === ADMIN_ID) {
                console.log('👑 Активируем демо-режим для админа');
                return {
                    telegram_id: ADMIN_ID,
                    first_name: 'Адміністратор',
                    username: 'admin',
                    isAdmin: true,
                    status: 'approved'
                };
            }
            
            alert('❌ Ваш аккаунт не найден в системе. Пожалуйста, зарегистрируйтесь снова.');
            clearAuthData();
            window.location.href = 'login.html';
            return false;
        }
        
        const userData = userDoc.data();
        console.log('📋 Данные из Firebase:', userData);
        
        // Проверяем статус
        if (userData.status !== 'approved' && !userData.isAdmin) {
            console.log('❌ Доступ не подтвержден или отклонен');
            
            if (userData.status === 'pending') {
                alert('⏳ Ваш доступ еще не подтвержден администратором. Пожалуйста, подождите.');
                window.location.href = 'auth-handler.html';
            } else if (userData.status === 'rejected') {
                alert('❌ Ваш доступ был отклонен администратором.');
                clearAuthData();
                window.location.href = 'login.html';
            }
            return false;
        }
        
        console.log('✅ Авторизация успешна!');
        console.log('👤 Пользователь:', userData.first_name);
        console.log('🆔 ID:', userId);
        console.log('👑 Админ:', userData.isAdmin ? 'Да' : 'Нет');
        console.log('✅ Статус:', userData.status);
        
        // Обновляем данные в sessionStorage
        sessionStorage.setItem('user_id', userId);
        sessionStorage.setItem('user_name', userData.first_name);
        sessionStorage.setItem('user_username', userData.username || '');
        sessionStorage.setItem('is_admin', userData.isAdmin ? 'true' : 'false');
        
        // Сохраняем в localStorage для проверки auth
        localStorage.setItem('authToken', Date.now().toString());
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('isAdmin', userData.isAdmin ? 'true' : 'false');
        
        return userData;
        
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        
        // В демо-режиме разрешаем доступ
        console.log('🔄 Включаем демо-режим из-за ошибки');
        
        const demoUser = {
            telegram_id: userId,
            first_name: userName,
            username: sessionStorage.getItem('user_username') || localStorage.getItem('user_username') || '',
            isAdmin: sessionStorage.getItem('is_admin') === 'true' || localStorage.getItem('isAdmin') === 'true',
            status: 'approved'
        };
        
        // Сохраняем для использования
        localStorage.setItem('userData', JSON.stringify(demoUser));
        localStorage.setItem('isAdmin', demoUser.isAdmin ? 'true' : 'false');
        
        return demoUser;
    }
}

// Очистка данных авторизации
export function clearAuthData() {
    console.log('🧹 Очистка данных авторизации...');
    
    sessionStorage.clear();
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userUsername');
    
    // Удаляем все access_ записи
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('access_')) {
            localStorage.removeItem(key);
        }
    });
}

// Функция для выхода
export function logout() {
    clearAuthData();
    window.location.href = 'login.html';
}

// Проверяем на всех страницах кроме login и auth-handler
if (!window.location.pathname.includes('login.html') && 
    !window.location.pathname.includes('auth-handler.html') &&
    !window.location.pathname.includes('bot-handler.html')) {
    
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🔍 Проверяем авторизацию для страницы:', window.location.pathname);
        
        const userData = await checkAuth();
        
        if (userData) {
            // Сохраняем в глобальной переменной для использования в других скриптах
            window.currentUser = userData;
            
            console.log('🎉 Добро пожаловать, ' + userData.first_name + '!');
            
            // Обновляем заголовок страницы
            document.title = `Посібник модератора | ${userData.first_name}`;
            
            // Вызываем функцию обновления информации о пользователе, если она существует
            if (window.updateUserInfo) {
                window.updateUserInfo(userData);
            }
        }
    });
}
