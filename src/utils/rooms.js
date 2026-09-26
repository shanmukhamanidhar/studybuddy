import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, query, where, getDocs, deleteDoc,
  serverTimestamp, arrayUnion, increment,
} from "firebase/firestore";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(hostUid, hostName, config) {
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await getDoc(doc(db, "rooms", code));
    if (!existing.exists()) break;
    code = generateRoomCode();
    attempts++;
  }

  const roomData = {
    code,
    host: hostUid,
    createdAt: serverTimestamp(),
    config: {
      topics: config.topics || "",
      questionCount: parseInt(config.questionCount) || 5,
      timePerQuestion: parseInt(config.timePerQuestion) || 30,
      difficulty: config.difficulty || "Medium",
    },
    status: "lobby",
    participants: [{ uid: hostUid, name: hostName, ready: false }],
    questions: [],
    startedAt: null,
  };

  await setDoc(doc(db, "rooms", code), roomData);
  return code;
}

export async function joinRoom(code, uid, name) {
  const roomRef = doc(db, "rooms", code.toUpperCase());
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Room not found. Check the code and try again.");

  const room = roomSnap.data();
  if (room.status !== "lobby") throw new Error("Room already in session or finished.");
  if (room.participants.length >= 10) throw new Error("Room is full (max 10 players).");

  const alreadyJoined = room.participants.find((p) => p.uid === uid);
  if (!alreadyJoined) {
    await updateDoc(roomRef, {
      participants: [...room.participants, { uid, name, ready: false }],
    });
  }
  return room;
}

export async function toggleReady(code, uid) {
  const roomRef = doc(db, "rooms", code);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const room = roomSnap.data();
  const updated = room.participants.map((p) =>
    p.uid === uid ? { ...p, ready: !p.ready } : p
  );
  await updateDoc(roomRef, { participants: updated });
}

export async function leaveRoom(code, uid) {
  const roomRef = doc(db, "rooms", code);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const room = roomSnap.data();
  const updated = room.participants.filter((p) => p.uid !== uid);
  if (updated.length === 0) {
    await deleteDoc(roomRef);
    return;
  }
  await updateDoc(roomRef, { participants: updated });
}

export async function startBattle(code, questions) {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, {
    status: "active",
    questions,
    startedAt: serverTimestamp(),
  });
}

export async function submitAnswer(code, uid, questionIndex, answerIndex) {
  const pRef = doc(db, "rooms", code, "answers", uid);
  await setDoc(pRef, {
    uid,
    [`q${questionIndex}`]: answerIndex,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function finishBattle(code) {
  const roomRef = doc(db, "rooms", code);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return null;

  const room = roomSnap.data();

  const answersSnap = await getDocs(collection(db, "rooms", code, "answers"));
  const allAnswers = {};
  answersSnap.forEach((d) => { allAnswers[d.id] = d.data(); });

  const results = room.participants.map((p) => {
    const ans = allAnswers[p.uid] || {};
    let score = 0;
    let total = room.questions.length;
    const details = room.questions.map((q, i) => {
      const userAns = ans["q" + i];
      const correct = userAns === q.correctIndex;
      if (correct) score++;
      return { questionIndex: i, correct, userAnswer: userAns ?? null };
    });
    return { uid: p.uid, name: p.name, score, total, details };
  });

  results.sort((a, b) => b.score - a.score);

  await updateDoc(roomRef, {
    status: "finished",
    results,
  });

  return { room, results };
}

export function listenToRoom(code, callback) {
  return onSnapshot(doc(db, "rooms", code), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  });
}

export function listenToAnswers(code, callback) {
  return onSnapshot(collection(db, "rooms", code, "answers"), (snap) => {
    const answers = {};
    snap.forEach((d) => { answers[d.id] = d.data(); });
    callback(answers);
  });
}
