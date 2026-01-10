import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let me = null;

async function requireAdmin(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  const u = snap.data();
  me = u;
  return u.role === "admin" && u.status === "approved";
}

function badge(status) {
  if (status === "approved") return "✅ approved";
  if (status === "pending") return "⏳ pending";
  if (status === "rejected") return "❌ rejected";
  if (status === "banned") return "⛔ banned";
  return status || "—";
}

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  const snap = await getDocs(collection(db, "users"));
  const users = [];
  snap.forEach(d => users.push({ id: d.id, ...d.data() }));
  users.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || ""));

  tbody.innerHTML = "";

  for (const u of users) {
    const tr = document.createElement("tr");

    const actions = [];
    if (u.status === "pending") {
      actions.push(`<button class="btn btn-success btn-sm" data-act="approve" data-id="${u.id}">Approve</button>`);
      actions.push(`<button class="btn btn-danger btn-sm" data-act="reject" data-id="${u.id}">Reject</button>`);
    } else if (u.status === "approved") {
      actions.push(`<button class="btn btn-warning btn-sm" data-act="ban" data-id="${u.id}">Ban</button>`);
    } else if (u.status === "banned") {
      actions.push(`<button class="btn btn-success btn-sm" data-act="unban" data-id="${u.id}">Unban</button>`);
    }
    actions.push(`<button class="btn btn-danger btn-sm" data-act="delete" data-id="${u.id}">Delete</button>`);

    tr.innerHTML = `
      <td title="${u.id}">${u.id.slice(0,8)}...</td>
      <td>${u.email || "—"}</td>
      <td>${u.nickname || "—"}</td>
      <td>${badge(u.status)}</td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleString() : "—"}</td>
      <td><div class="action-buttons">${actions.join(" ")}</div></td>
    `;

    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const act = btn.dataset.act;
      const uid = btn.dataset.id;

      if (!uid) return;

      if (act === "approve") {
        await updateDoc(doc(db, "users", uid), { status: "approved", updated_at: new Date().toISOString() });
      } else if (act === "reject") {
        await updateDoc(doc(db, "users", uid), { status: "rejected", updated_at: new Date().toISOString() });
      } else if (act === "ban") {
        await updateDoc(doc(db, "users", uid), { status: "banned", updated_at: new Date().toISOString() });
      } else if (act === "unban") {
        await updateDoc(doc(db, "users", uid), { status: "approved", updated_at: new Date().toISOString() });
      } else if (act === "delete") {
        await deleteDoc(doc(db, "users", uid));
      }

      await loadUsers();
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const ok = await requireAdmin(user.uid);
  if (!ok) {
    alert("Доступ заборонено");
    location.href = "index.html";
    return;
  }

  await loadUsers();
});
