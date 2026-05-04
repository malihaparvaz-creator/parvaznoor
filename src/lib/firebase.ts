// Parvaz Noor — Firebase
// Syncs all user data (XP, streak, prayers, bookmarks, settings) to Firestore.
// Works offline via Zustand persist + syncs to cloud when online.

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBQVx_UJYxgojBny8YaiVLssIrnRhjdOv4",
  authDomain: "parvaz-noor.firebaseapp.com",
  projectId: "parvaz-noor",
  storageBucket: "parvaz-noor.firebasestorage.app",
  messagingSenderId: "885788048875",
  appId: "1:885788048875:web:dd399f6e26e05ad4f26dae",
  measurementId: "G-WPBBLG8TVV",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

const OWNER_KEY = 'parvaz-noor-owner';

export function getUserId(): string {
  let id = localStorage.getItem(OWNER_KEY);
  if (!id) {
    id = 'noor-owner-main';
    localStorage.setItem(OWNER_KEY, id);
  }
  return id;
}

function hydrateDates(obj: any): any {
  if (obj instanceof Timestamp) return obj.toDate();
  if (Array.isArray(obj)) return obj.map(hydrateDates);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) out[k] = hydrateDates(obj[k]);
    return out;
  }
  return obj;
}

export async function loadFromFirestore(): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'users', getUserId()));
    if (!snap.exists()) return null;
    return hydrateDates(snap.data()?.state ?? null);
  } catch {
    return null;
  }
}

export function saveToFirestore(state: any): void {
  try {
    setDoc(
      doc(db, 'users', getUserId()),
      { state: JSON.parse(JSON.stringify(state)), updatedAt: Timestamp.now() },
      { merge: true }
    ).catch(() => {});
  } catch {}
}
