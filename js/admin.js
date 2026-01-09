import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let allUsers = [];

function showMessage(text, type) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.className = `message message-${type}`;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2500);
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("uk-UA", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  } catch { return "—"; }
}

function badge(status){
  if(status==="pending") return '<span class="status-badge status-pending">Очікує</span>';
  if(status==="approved") return '<span class="status-badge status-approved">Підтверджено</span>';
  if(status==="rejected") return '<span class="status-badge status-rejected">Відхилено</span>';
  if(status==="banned") return '<span class="status-badge status-banned">Заблоковано</span>';
  return `<span class="status-badge">${status||"—"}</span>`;
}

function updateStats(){
  document.getElementById("totalUsers").textContent = allUsers.length;
  document.getElementById("pendingUsers").textContent = allUsers.filter(u=>u.status==="pending").length;
  document.getElementById("approvedUsers").textContent = allUsers.filter(u=>u.status==="approved").length;
}

function displayUsers(users){
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";
  if(!users.length){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:35px; color:#94A3B8;">Користувачів не знайдено</td></tr>`;
    return;
  }

  for(const u of users){
    const idShort = (u.id||"").slice(0,8)+"...";
    let actions = "";
    if(u.status==="pending"){
      actions = `
        <button class="btn btn-success btn-sm" data-act="approve" data-id="${u.id}"><i class="fas fa-check"></i> Підтвердити</button>
        <button class="btn btn-danger btn-sm" data-act="reject" data-id="${u.id}"><i class="fas fa-times"></i> Відхилити</button>
      `;
    } else if(u.status==="approved"){
      actions = `<button class="btn btn-warning btn-sm" data-act="ban" data-id="${u.id}"><i class="fas fa-ban"></i> Заблокувати</button>`;
    } else if(u.status==="banned"){
      actions = `<button class="btn btn-success btn-sm" data-act="approve" data-id="${u.id}"><i class="fas fa-unlock"></i> Розблокувати</button>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td title="${u.id}">${idShort}</td>
      <td>${u.email||"—"}</td>
      <td>${u.nickname||"—"}</td>
      <td>${badge(u.status)}</td>
      <td>${fmtDate(u.created_at)}</td>
      <td>
        <div class="action-buttons">
          ${actions}
          <button class="btn btn-danger btn-sm" data-act="delete" data-id="${u.id}">
            <i class="fas fa-trash"></i> Видалити
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function loadUsers(){
  const snap = await getDocs(collection(db,"users"));
  allUsers = [];
  snap.forEach(d=>allUsers.push({id:d.id, ...d.data()}));
  allUsers.sort((a,b)=> new Date(b.created_at||0)-new Date(a.created_at||0));
  updateStats();
  displayUsers(allUsers);
}

window.searchUsers = function(){
  const term = (document.getElementById("searchInput").value||"").toLowerCase().trim();
  if(!term) return displayUsers(allUsers);
  displayUsers(allUsers.filter(u =>
    (u.email||"").toLowerCase().includes(term) ||
    (u.nickname||"").toLowerCase().includes(term) ||
    (u.id||"").toLowerCase().includes(term)
  ));
};

window.refreshUsers = async function(){
  await loadUsers();
  showMessage("Список оновлено", "success");
};

async function doAction(action, userId){
  const ref = doc(db,"users", userId);
  if(action==="approve") await updateDoc(ref, { status:"approved", updated_at:new Date().toISOString() });
  if(action==="reject") await updateDoc(ref, { status:"rejected", updated_at:new Date().toISOString() });
  if(action==="ban") await updateDoc(ref, { status:"banned", updated_at:new Date().toISOString() });
  if(action==="delete") await deleteDoc(ref);
}

function modal(title, text, onConfirm){
  const m = document.getElementById("confirmModal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalText").textContent = text;
  m.style.display = "flex";
  const btn = document.getElementById("confirmBtn");
  btn.onclick = async () => { await onConfirm(); closeModal(); };
}

window.closeModal = function(){
  document.getElementById("confirmModal").style.display = "none";
};

document.addEventListener("click", async (e)=>{
  const btn = e.target.closest("button[data-act]");
  if(!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if(act==="approve") modal("Підтвердити користувача","Ви дійсно хочете підтвердити доступ цьому користувачу?", async ()=>{
    await doAction("approve", id); await loadUsers(); showMessage("Користувача підтверджено","success");
  });

  if(act==="reject") modal("Відхилити заявку","Ви дійсно хочете відхилити заявку цього користувача?", async ()=>{
    await doAction("reject", id); await loadUsers(); showMessage("Заявку відхилено","success");
  });

  if(act==="ban") modal("Заблокувати користувача","Ви дійсно хочете заблокувати цього користувача?", async ()=>{
    await doAction("ban", id); await loadUsers(); showMessage("Користувача заблоковано","success");
  });

  if(act==="delete") modal("Видалити користувача","Ви дійсно хочете видалити цього користувача? Цю дію неможливо скасувати.", async ()=>{
    await doAction("delete", id); await loadUsers(); showMessage("Користувача видалено","success");
  });
});

window.logout = async function(){
  try{ await signOut(auth); }catch{}
  window.location.href="login.html";
};

onAuthStateChanged(auth, async (user)=>{
  if(!user){ window.location.href="login.html"; return; }
  const snap = await getDoc(doc(db,"users", user.uid));
  if(!snap.exists()){ await signOut(auth); window.location.href="login.html"; return; }
  const me = snap.data();
  if(me.status!=="approved" || me.role!=="admin"){
    await signOut(auth);
    alert("Доступ заборонено");
    window.location.href="index.html";
    return;
  }
  await loadUsers();
});

