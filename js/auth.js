import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

window.register = async function () {
  const email = registerEmail.value;
  const nick = registerNickname.value;
  const pass = registerPassword.value;
  const pass2 = registerConfirmPassword.value;

  if (!email || !nick || !pass || !pass2) {
    alert("Заповни всі поля");
    return;
  }
  if (pass !== pass2) {
    alert("Паролі не співпадають");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      nickname: nick,
      role: "user",
      status: "pending",
      created_at: new Date().toISOString()
    });

    alert("Реєстрація успішна. Очікуй підтвердження.");
  } catch (e) {
    alert(e.code);
  }
};

window.login = async function () {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      loginEmail.value,
      loginPassword.value
    );

    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      alert("Профіль не знайдено");
      return;
    }

    const user = snap.data();
    if (user.status !== "approved") {
      alert("Акаунт не підтверджено");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    location.href = "index.html";

  } catch (e) {
    alert("Невірний логін або пароль");
  }
};
