import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// REGISTER
export async function register(email, password, nickname) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    nickname,
    role: "user",
    status: "pending",
    createdAt: serverTimestamp()
  });

  await signOut(auth);
}

// LOGIN
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) throw new Error("NO_PROFILE");

  const data = snap.data();
  if (data.status !== "approved") {
    await signOut(auth);
    throw new Error("NOT_APPROVED");
  }

  return data;
}
