import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  clearMessages();
}

function showLoginForm() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  clearMessages();
}

function clearMessages() {
  document.getElementById('loginMessage').style.display = 'none';
  document.getElementById('registerMessage').style.display = 'none';
}

function showMessage(elementId, text, type) {
  const element = document.getElementById(elementId);
  element.textContent = text;
  element.className = `message message-${type}`;
  element.style.display = 'block';
}

async function register() {
  const email = document.getElementById('registerEmail').value;
  const nickname = document.getElementById('registerNickname').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (!email || !nickname || !password || !confirmPassword) {
    showMessage('registerMessage', 'Будь ласка, заповніть всі поля', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('registerMessage', 'Паролі не співпадають', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('registerMessage', 'Пароль має містити мінімум 6 символів', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email: email,
      nickname: nickname,
      role: 'user',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, "notifications"), {
      type: 'new_user',
      userId: user.uid,
      userEmail: email,
      userNickname: nickname,
      message: `Нова заявка на реєстрацію від ${nickname} (${email})`,
      createdAt: serverTimestamp(),
      read: false
    });

    showMessage(
      'registerMessage',
      '✅ Реєстрація успішна! Очікуйте підтвердження адміністратора.',
      'success'
    );

    document.getElementById('registerEmail').value = '';
    document.getElementById('registerNickname').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';

    setTimeout(() => {
      showLoginForm();
    }, 3000);
  } catch (error) {
    console.error('Помилка реєстрації:', error);

    let errorMessage = 'Помилка реєстрації';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Ця електронна пошта вже використовується';
    }

    showMessage('registerMessage', errorMessage, 'error');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showMessage('loginMessage', 'Будь ласка, заповніть всі поля', 'error');
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      showMessage('loginMessage', 'Користувача не знайдено', 'error');
      await signOut(auth);
      return;
    }

    const userData = userDoc.data();

    if (userData.status !== 'approved') {
      showMessage(
        'loginMessage',
        '⏳ Ваш акаунт очікує підтвердження адміністратора.',
        'error'
      );
      await signOut(auth);
      return;
    }

    localStorage.setItem('user_data', JSON.stringify({
      id: user.uid,
      email: userData.email,
      nickname: userData.nickname,
      role: userData.role,
      status: userData.status
    }));

    localStorage.setItem('auth_time', Date.now().toString());
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Помилка входу:', error);

    const errorMessage = 'Невірна електронна пошта або пароль';
    showMessage('loginMessage', errorMessage, 'error');
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (userData.status === 'approved') {
        localStorage.setItem('user_data', JSON.stringify({
          id: user.uid,
          email: userData.email,
          nickname: userData.nickname,
          role: userData.role,
          status: userData.status
        }));

        localStorage.setItem('auth_time', Date.now().toString());
        window.location.href = 'index.html';
      }
    }
  }
});

window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.register = register;
window.login = login;
