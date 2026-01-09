import { db, auth } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// ID админа - замените на свой email или UID
const ADMIN_EMAIL = 'ваш_email@админ.com'; // ИЛИ const ADMIN_ID = 'ваш_uid';

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
async function checkAuth() {
  console.log('🔍 Проверка авторизации...');

  const userData = localStorage.getItem('user_data');
  const authTime = localStorage.getItem('auth_time');

  if (!userData || !authTime) {
    console.log('❌ Нет данных в localStorage');
    window.location.href = 'login.html';
    return null;
  }

  const timeDiff = Date.now() - parseInt(authTime, 10);
  if (timeDiff > 86400000) { // 24 часа
    console.log('❌ Сессия устарела');
    localStorage.clear();
    window.location.href = 'login.html';
    return null;
  }

  const user = JSON.parse(userData);
  console.log('✅ Данные из localStorage:', user.nickname);

  // Проверяем статус в Firebase
  try {
    const userDoc = await getDoc(doc(db, "users", user.id));

    if (!userDoc.exists()) {
      console.log('❌ Пользователя нет в базе');
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }

    const dbData = userDoc.data();

    // Если пользователь не подтверждён
    if (dbData.status !== 'approved') {
      console.log('❌ Пользователь не подтверждён');
      showAccessDenied(user.id, dbData.status);
      return null;
    }

    console.log('✅ Авторизация успешна!');
    return { ...user, ...dbData };
  } catch (error) {
    console.error('❌ Ошибка Firebase:', error);
    // В случае ошибки Firebase всё равно показываем интерфейс
    return user;
  }
}

// ========== ПОКАЗАТЬ БЛОК ДОСТУПА ЗАПРЕЩЕН ==========
function showAccessDenied(userId, status) {
  // Скрываем основной контент
  document.querySelector('.main-content').style.display = 'none';
  document.querySelector('.footer').style.display = 'none';
  document.getElementById('adminControlBtn').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('menuToggle').style.display = 'none';

  // Показываем блок доступа
  document.getElementById('accessDenied').style.display = 'block';

  // Устанавливаем статус
  let statusText = 'Очікування';
  if (status === 'pending') statusText = '⏳ Очікує підтвердження';
  else if (status === 'rejected') statusText = '❌ Відхилено';
  else if (status === 'banned') statusText = '🚫 Заблоковано';

  document.getElementById('pendingStatus').textContent = statusText;
}

// ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
function updateUserInfo(userData) {
  console.log('🔄 Обновление интерфейса:', userData.nickname);

  // Обновляем имя
  const userName = userData.nickname || userData.email?.split('@')[0] || 'Користувач';
  document.getElementById('userName').textContent = userName;
  document.getElementById('userFullName').textContent = userName;
  document.getElementById('creatorName').textContent = userName;

  // Обновляем ID
  document.getElementById('userId').textContent = userData.id?.substring(0, 8) + '...' || '...';

  // Обновляем Email
  document.getElementById('userEmail').textContent = userData.email || '...';

  // Обновляем роль
  const isAdmin = userData.email === ADMIN_EMAIL || userData.role === 'admin';
  document.getElementById('userRole').textContent = isAdmin ? 'Адміністратор' : 'Модератор';

  // Обновляем приветствие на странице статута
  const statuteGreeting = document.querySelector('#userGreetingStatute span');
  if (statuteGreeting) {
    statuteGreeting.textContent = userName;
  }

  // Показываем блок информации о пользователе
  document.getElementById('userInfoBlock').style.display = 'block';

  // Показываем кнопку админ-панели для админов
  if (isAdmin) {
    document.getElementById('adminControlBtn').style.display = 'flex';
    document.getElementById('adminManageBtn').style.display = 'inline-block';
  }

  // Обновляем заголовок
  document.title = `Посібник модератора | ${userName}`;

  console.log('✅ Интерфейс обновлён');
}

// ========== ФУНКЦИИ ИНТЕРФЕЙСА ==========
function showPage(pageId) {
  // Приховати всі сторінки
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.remove('active');
  });

  // Показати вибрану сторінку
  const pageToShow = document.getElementById(pageId + 'Page');
  if (pageToShow) {
    pageToShow.classList.add('active');
  }

  // Оновити активний пункт меню
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick') === `showPage('${pageId}')`) {
      item.classList.add('active');
    }
  });

  // Закрити меню на мобільних
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }

  // Прокрутити вгору
  window.scrollTo({ top: 0, behavior: 'smooth' });

  return false;
}

function initializeUI() {
  console.log('🔄 Ініціалізація інтерфейсу...');

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogout = document.getElementById('confirmLogout');
  const cancelLogout = document.getElementById('cancelLogout');
  const adminControlBtn = document.getElementById('adminControlBtn');
  const adminManageBtn = document.getElementById('adminManageBtn');
  const statsBtn = document.getElementById('statsBtn');
  const cabinetBtn = document.getElementById('cabinetBtn');

  // Меню
  if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
      sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Выход
  if (logoutBtn && logoutModal && confirmLogout && cancelLogout) {
    logoutBtn.addEventListener('click', () => {
      logoutModal.style.display = 'flex';
    });

    confirmLogout.addEventListener('click', () => {
      logout();
    });

    cancelLogout.addEventListener('click', () => {
      logoutModal.style.display = 'none';
    });
  }

  // Админ-панель
  if (adminControlBtn) {
    adminControlBtn.addEventListener('click', () => {
      window.open('admin-panel.html', '_blank');
    });
  }

  if (adminManageBtn) {
    adminManageBtn.addEventListener('click', () => {
      window.open('admin-panel.html', '_blank');
    });
  }

  // Заглушки для кнопок
  if (statsBtn) {
    statsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Система статистики знаходиться в розробці. Скоро буде доступна!');
    });
  }

  if (cabinetBtn) {
    cabinetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Особистий кабінет знаходиться в розробці. Скоро буде доступний!');
    });
  }

  console.log('✅ Интерфейс инициализирован');
}

// Функция выхода
async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Ошибка при выходе:', error);
  }

  localStorage.clear();
  window.location.href = 'login.html';
}

window.logout = logout;
window.showPage = showPage;

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Запуск посібника...');

  // Проверяем авторизацию
  const userData = await checkAuth();

  if (!userData) {
    console.log('❌ Нет авторизации или не подтверждён');
    return;
  }

  console.log('✅ Пользователь авторизован:', userData.nickname);

  // Обновляем интерфейс
  updateUserInfo(userData);

  // Инициализируем UI
  initializeUI();

  // Показываем главную
  showPage('home');

  console.log('✅ Система готова');
});
