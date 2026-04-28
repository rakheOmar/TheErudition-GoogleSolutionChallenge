import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
}

export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logOut() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function saveToCollection(col, data) {
  const ref = doc(collection(db, col));
  await setDoc(ref, data);
  return ref.id;
}

export async function saveWithId(col, id, data) {
  const ref = doc(db, col, id);
  await setDoc(ref, data);
}

export async function getAll(col) {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getById(col, id) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function remove(col, id) {
  await deleteDoc(doc(db, col, id));
}

export async function saveUserData(userId, data) {
  const ref = doc(db, "users", userId);
  await setDoc(ref, data, { merge: true });
}

export async function getUserData(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : null;
}

export async function saveShipment(userId, shipment) {
  const ref = doc(db, "users", userId, "shipments", shipment.id || Date.now().toString());
  await setDoc(ref, shipment);
}

export async function getShipments(userId) {
  const snap = await getDocs(collection(db, "users", userId, "shipments"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveDisruption(userId, disruption) {
  const ref = doc(db, "users", userId, "disruptions", disruption.id || Date.now().toString());
  await setDoc(ref, disruption);
}

export async function getDisruptions(userId) {
  const snap = await getDocs(collection(db, "users", userId, "disruptions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function savePolicy(userId, policy) {
  const ref = doc(db, "users", userId, "policies", policy.id || Date.now().toString());
  await setDoc(ref, policy);
}

export async function getPolicies(userId) {
  const snap = await getDocs(collection(db, "users", userId, "policies"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
