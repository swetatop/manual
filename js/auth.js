import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- переключение форм (чтобы работали кнопки) ---
window.showRegisterForm = function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "block";
  hideMessages();
};

window.showLoginForm = function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.style.display = "none";
  if (loginForm) loginForm.style.display = "block";
  hideMessages();
};

function hideMessages() {
  const a = document.getElementById("loginMessage");
  const b = document.getElementById("registerMessage");
  if (a) a.style.display = "none";
  if (b) b.style.display = "none";
}

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `message message-${type}`;
  el.style.display = "block";
}

// --- регистрация ---
window.register = async function () {
  const email = document.getElementById("registerEmail")?.value?.trim();
  const nickname = document.getElementById("registerNickname")?.value?.trim();
  const password = document.getElementById("registerPassword")?.value;
  const confirm = document.getElementById("registerConfirmPassword")?.value;

  if (!email || !nickname || !password || !confirm) {
    showMessage("registerMessage", "Будь ласка, заповніть всі поля", "error");
    return;
  }
  if (password !== confirm) {
    showMessage("registerMessage", "Паролі не співпадають", "error");
    return;
  }
  if (password.length < 6) {
    showMessage("registerMessage", "Пароль має містити мінімум 6 символів", "error");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      nickname,
      role: "user",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // чтобы pending-пользователь не оставался “внутри”
    await signOut(auth);

    showMessage("registerMessage", "✅ Реєстрація успішна! Очікуйте підтвердження адміністратора.", "success");
    setTimeout(() => window.showLoginForm(), 1500);

  } catch (e) {
    console.error("register error:", e);

    let msg = "Помилка реєстрації";
    if (e.code === "auth/email-already-in-use") msg = "Цей email вже зареєстрований";
    else if (e.code === "auth/operation-not-allowed") msg = "Увімкни Email/Password в Authentication";
    else if (e.code === "auth/unauthorized-domain") msg = "Додай домен у Authorized domains";
    else if (e.code === "auth/weak-password") msg = "Пароль слабкий (мін. 6 символів)";
    else if (e.code === "auth/invalid-email") msg = "Невірний формат email";

    showMessage("registerMessage", msg, "error");
  }
};

// --- логин ---
window.login = async function () {
  const email = document.getElementById("loginEmail")?.value?.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    showMessage("loginMessage", "Будь ласка, заповніть всі поля", "error");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      showMessage("loginMessage", "Профіль не знайдено", "error");
      return;
    }

    const u = snap.data();
    if (u.status !== "approved") {
      await signOut(auth);
      showMessage("loginMessage", "⏳ Ваш акаунт очікує підтвердження адміністратора.", "error");
      return;
    }

    // можно хранить кешом
    localStorage.setItem("user_data", JSON.stringify({
      id: cred.user.uid,
      email: u.email,
      nickname: u.nickname,
      role: u.role,
      status: u.status
    }));

    location.href = "index.html";

  } catch (e) {
    console.error("login error:", e);
    showMessage("loginMessage", "Невірна електронна пошта або пароль", "error");
  }
};
