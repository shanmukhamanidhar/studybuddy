import { useState, useEffect } from "react";
import { studySessionsDb } from "../lib/supabaseDb";

export function useStudySessions(uid) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const unsub = studySessionsDb.subscribe(uid, (items) => {
      setSessions(items);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const saveSession = async (data) => {
    if (!uid) return;
    return await studySessionsDb.add(uid, data);
  };

  return { sessions, loading, saveSession };
}
