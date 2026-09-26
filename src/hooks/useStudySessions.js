import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export function useStudySessions(uid) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", uid, "studySessions"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const saveSession = async (data) => {
    if (!uid) return;
    return addDoc(collection(db, "users", uid, "studySessions"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  };

  return { sessions, loading, saveSession };
}
