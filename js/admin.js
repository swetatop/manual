import { auth, db } from "./firebase.js";
import {
  collection, getDocs, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

async function load() {
  const snap = await getDocs(collection(db, "users"));
  const tbody = document.getElementById("users");

  tbody.innerHTML = "";
  snap.forEach(d => {
    const u = d.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.nickname}</td>
      <td>${u.status}</td>
      <td>
        <button onclick="approve('${d.id}')">Approve</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.approve = async function (uid) {
  await updateDoc(doc(db, "users", uid), {
    status: "approved"
  });
  load();
};

load();
