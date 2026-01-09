import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

function statusText(status) {
  if (status === "pending") return "⏳ Очікує підтвердження";
  if (status === "rejected") return "❌ Відхилено";
  if (status === "banned") return "🚫 Заблоковано";
  return String(status || "—");
}

function showAccessDenied(status) {
  const main = document.querySelector(".main-content");
  const footer = document.querySelector(".footer");
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("menuToggle");
  const adminBtn = document.getElementById("adminControlBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (main) main.style.display = "none";
  if (footer) footer.style.display = "none";
  if (sidebar) sidebar.style.display = "none";
  if (toggle) toggle.style.display = "none";
  if (adminBtn) adminBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "none";

  const denied = document.getElementById("accessDenied");
  if (denied) denied.style.display = "block";

  const st = document.getElementById("pendingStatus");
  if (st) st.textContent = statusText(status);
}

function updateUserInfo(data) {
  const userName = data.nickname || (data.email ? data.email.split("@")[0] : "Користувач");

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("userName", userName);
  set("userFullName", userName);
  set("creatorName", userName);
  set("userId", (data.uid || "").slice(0, 8) + ".");
  set("userEmail", data.email || ".");
  set("userRole", data.role === "admin" ? "Адміністратор" : "Модератор");

  // приветствие на странице статута
  const st = document.querySelector("#userGreetingStatute span");
  if (st) st.textContent = userName;

  const infoBlock = document.getElementById("userInfoBlock");
  if (infoBlock) infoBlock.style.display = "block";

  // админские кнопки
  const isAdmin = data.role === "admin";
  const adminControlBtn = document.getElementById("adminControlBtn");
  const adminManageBtn = document.getElementById("adminManageBtn");
  if (isAdmin) {
    if (adminControlBtn) adminControlBtn.style.display = "flex";
    if (adminManageBtn) adminManageBtn.style.display = "inline-block";
  } else {
    if (adminControlBtn) adminControlBtn.style.display = "none";
    if (adminManageBtn) adminManageBtn.style.display = "none";
  }
}

window.logout = async function () {
  try { await signOut(auth); } catch {}
  window.location.href = "login.html";
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  let profile = null;
  try {
    profile = await loadProfile(user.uid);
  } catch (e) {
    console.error(e);
  }

  if (!profile) {
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  if (profile.status !== "approved") {
    await signOut(auth);
    showAccessDenied(profile.status);
    return;
  }

  updateUserInfo({ ...profile, uid: user.uid });
});
