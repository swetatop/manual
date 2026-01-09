import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `message message-${type}`;
  el.style.display = "block";
}

function clearMessages() {
  const a = document.getElementById("loginMessage");
  const b = document.getElementById("registerMessage");
  if (a) a.style.display = "none";
  if (b) b.style.display = "none";
}

window.showRegisterForm = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  clearMessages();
};

window.showLoginForm = function () {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  clearMessages();
};

window.register = async function () {
  const email = document.getElementById("registerEmail").value.trim();
  const nickname = document.getElementById("registerNickname").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirmPassword").value;

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
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      email,
      nickname,
      role: "user",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await addDoc(collection(db, "notifications"), {
      type: "new_user",
      userId: uid,
      userEmail: email,
      userNickname: nickname,
      message: `Нова заявка на реєстрацію від ${nickname} (${email})`,
      created_at: new Date().toISOString(),
      read: false
    });

    await signOut(auth);

    showMessage(
      "registerMessage",
      "✅ Реєстрація успішна! Очікуйте підтвердження адміністратора.",
      "success"
    );

    document.getElementById("registerEmail").value = "";
    document.getElementById("registerNickname").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerConfirmPassword").value = "";

    setTimeout(() => window.showLoginForm(), 2000);
  } catch (e) {
    console.error(e);
    const msg =
      e.code === "auth/email-already-in-use"
        ? "Ця електронна пошта вже використовується"
        : "Помилка реєстрації";
    showMessage("registerMessage", msg, "error");
  }
};

window.login = async function () {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showMessage("loginMessage", "Будь ласка, заповніть всі поля", "error");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      await signOut(auth);
      showMessage("loginMessage", "Користувача не знайдено", "error");
      return;
    }

    const data = snap.data();
    if (data.status !== "approved") {
      await signOut(auth);
      showMessage("loginMessage", "⏳ Ваш акаунт очікує підтвердження адміністратора.", "error");
      return;
    }

    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    showMessage("loginMessage", "Невірна електронна пошта або пароль", "error");
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().status === "approved") {
      window.location.href = "index.html";
    }
  } catch {}
});
