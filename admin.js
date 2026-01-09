// /js/admin.js
import { auth, db } from './firebase.js';

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

/* =========================
   ПРОВЕРКА АДМИНА
========================= */

async function checkAdmin(user) {
  const token = await user.getIdTokenResult();
  return token.claims.admin === true;
}

/* =========================
   DOM
========================= */

const tbody = document.getElementById('usersTableBody');
const totalEl = document.getElementById('totalUsers');
const pendingEl = document.getElementById('pendingUsers');
const approvedEl = document.getElementById('approvedUsers');
const messageEl = document.getElementById('message');

/* =========================
   УТИЛИТЫ
========================= */

function showMessage(text, type = 'success') {
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

function formatDate(ts) {
  if (!ts) return '—';
  return ts.toDate().toLocaleString('uk-UA');
}

/* =========================
   РЕНДЕР
========================= */

function renderUsers(users) {
  tbody.innerHTML = '';

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#94A3B8;padding:30px">
          Користувачів немає
        </td>
      </tr>
    `;
    return;
  }

  let total = users.length;
  let pending = 0;
  let approved = 0;

  users.forEach(u => {
    if (u.status === 'pending') pending++;
    if (u.status === 'approved') approved++;

    let statusBadge = '';
    if (u.status === 'pending') statusBadge = '<span class="status-badge status-pending">Очікує</span>';
    if (u.status === 'approved') statusBadge = '<span class="status-badge status-approved">Підтверджено</span>';
    if (u.status === 'banned') statusBadge = '<span class="status-badge status-banned">Заблоковано</span>';

    let actions = '';
    if (u.status === 'pending') {
      actions = `
        <button class="btn btn-success btn-sm" data-action="approve" data-id="${u.id}">✔</button>
        <button class="btn btn-danger btn-sm" data-action="ban" data-id="${u.id}">✖</button>
      `;
    } else if (u.status === 'approved') {
      actions = `
        <button class="btn btn-warning btn-sm" data-action="ban" data-id="${u.id}">🚫</button>
      `;
    } else if (u.status === 'banned') {
      actions = `
        <button class="btn btn-success btn-sm" data-action="approve" data-id="${u.id}">🔓</button>
      `;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id.slice(0, 8)}...</td>
      <td>${u.email}</td>
      <td>${u.nickname || '—'}</td>
      <td>${statusBadge}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <div class="action-buttons">
          ${actions}
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${u.id}">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  totalEl.textContent = total;
  pendingEl.textContent = pending;
  approvedEl.textContent = approved;
}

/* =========================
   ДЕЙСТВИЯ
========================= */

async function updateStatus(userId, status) {
  await updateDoc(doc(db, 'users', userId), {
    status,
    updatedAt: new Date()
  });
}

async function deleteUser(userId) {
  // ⚠️ Auth пользователь тут НЕ удаляется
  // Это делается через Cloud Function (следующий шаг)
  await deleteDoc(doc(db, 'users', userId));
}

/* =========================
   ОБРАБОТКА КНОПОК
========================= */

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const userId = btn.dataset.id;
  const action = btn.dataset.action;

  try {
    if (action === 'approve') {
      await updateStatus(userId, 'approved');
      showMessage('Користувача підтверджено');
    }

    if (action === 'ban') {
      await updateStatus(userId, 'banned');
      showMessage('Користувача заблоковано');
    }

    if (action === 'delete') {
      if (!confirm('Видалити користувача?')) return;
      await deleteUser(userId);
      showMessage('Користувача видалено');
    }

  } catch (err) {
    console.error(err);
    showMessage('Помилка дії', 'error');
  }
});

/* =========================
   ЗАГРУЗКА ДАННЫХ (REALTIME)
========================= */

function subscribeUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

  onSnapshot(q, (snap) => {
    const users = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    renderUsers(users);
  });
}

/* =========================
   INIT
========================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const isAdmin = await checkAdmin(user);
  if (!isAdmin) {
    alert('Доступ заборонено');
    window.location.href = 'index.html';
    return;
  }

  subscribeUsers();
});
