import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

window.logout = async function () {
  try { await signOut(auth); } catch {}
  localStorage.clear();
  location.href = "login.html";
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    await window.logout();
    return;
  }

  const u = snap.data();
  if (u.status !== "approved") {
    await window.logout();
    return;
  }

  localStorage.setItem("user_data", JSON.stringify({
    id: user.uid,
    email: u.email,
    nickname: u.nickname,
    role: u.role,
    status: u.status
  }));
});
