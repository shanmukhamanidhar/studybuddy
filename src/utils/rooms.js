import { supabase, isSupabaseConfigured } from "../lib/supabase";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(hostUid, hostName, config) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", code)
      .maybeSingle();

    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const roomData = {
    code,
    host: hostUid,
    config: {
      topics: config.topics || "",
      questionCount: parseInt(config.questionCount, 10) || 5,
      timePerQuestion: parseInt(config.timePerQuestion, 10) || 30,
      difficulty: config.difficulty || "Medium",
    },
    status: "lobby",
    participants: [{ uid: hostUid, name: hostName, ready: false }],
    questions: [],
    created_at: new Date().toISOString(),
    started_at: null,
  };

  const { error } = await supabase.from("rooms").insert(roomData);
  if (error) throw error;
  return code;
}

export async function joinRoom(code, uid, name) {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured.");
  const roomCode = code.toUpperCase();

  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .maybeSingle();

  if (error || !room) throw new Error("Room not found. Check the code and try again.");
  if (room.status !== "lobby") throw new Error("Room already in session or finished.");
  const participants = Array.isArray(room.participants) ? room.participants : [];
  if (participants.length >= 10) throw new Error("Room is full (max 10 players).");

  const alreadyJoined = participants.find((p) => p.uid === uid);
  if (!alreadyJoined) {
    const updated = [...participants, { uid, name, ready: false }];
    const { error: updateErr } = await supabase
      .from("rooms")
      .update({ participants: updated })
      .eq("code", roomCode);
    if (updateErr) throw updateErr;
    room.participants = updated;
  }
  return room;
}

export async function toggleReady(code, uid) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: room } = await supabase
    .from("rooms")
    .select("participants")
    .eq("code", code)
    .maybeSingle();

  if (!room) return;
  const participants = Array.isArray(room.participants) ? room.participants : [];
  const updated = participants.map((p) =>
    p.uid === uid ? { ...p, ready: !p.ready } : p
  );

  await supabase.from("rooms").update({ participants: updated }).eq("code", code);
}

export async function leaveRoom(code, uid) {
  if (!isSupabaseConfigured || !supabase) return;
  const { data: room } = await supabase
    .from("rooms")
    .select("participants")
    .eq("code", code)
    .maybeSingle();

  if (!room) return;
  const participants = (room.participants || []).filter((p) => p.uid !== uid);
  if (participants.length === 0) {
    await supabase.from("rooms").delete().eq("code", code);
    return;
  }
  await supabase.from("rooms").update({ participants }).eq("code", code);
}

export async function startBattle(code, questions) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from("rooms").update({
    status: "active",
    questions,
    started_at: new Date().toISOString(),
  }).eq("code", code);
}

export async function submitAnswer(code, uid, questionIndex, answerIndex) {
  if (!isSupabaseConfigured || !supabase) return;
  // Fetch existing answers row for user
  const { data: existing } = await supabase
    .from("room_answers")
    .select("answers")
    .eq("room_code", code)
    .eq("user_id", uid)
    .maybeSingle();

  const answers = existing?.answers || {};
  answers[`q${questionIndex}`] = answerIndex;

  await supabase.from("room_answers").upsert(
    {
      room_code: code,
      user_id: uid,
      answers,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_code,user_id" }
  );
}

export async function finishBattle(code) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (!room) return null;

  const { data: answersRows } = await supabase
    .from("room_answers")
    .select("user_id, answers")
    .eq("room_code", code);

  const allAnswers = {};
  (answersRows || []).forEach((row) => {
    allAnswers[row.user_id] = row.answers || {};
  });

  const participants = Array.isArray(room.participants) ? room.participants : [];
  const questions = Array.isArray(room.questions) ? room.questions : [];

  const results = participants.map((p) => {
    const ans = allAnswers[p.uid] || {};
    let score = 0;
    const total = questions.length;
    const details = questions.map((q, i) => {
      const userAns = ans["q" + i];
      const correct = userAns === q.correctIndex;
      if (correct) score++;
      return { questionIndex: i, correct, userAnswer: userAns ?? null };
    });
    return { uid: p.uid, name: p.name, score, total, details };
  });

  results.sort((a, b) => b.score - a.score);

  await supabase
    .from("rooms")
    .update({ status: "finished", results })
    .eq("code", code);

  return { room, results };
}

export function listenToRoom(code, callback) {
  if (!isSupabaseConfigured || !supabase) {
    callback(null);
    return () => {};
  }

  let active = true;

  const fetchRoom = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (active) callback(data ? { id: data.code, ...data } : null);
  };

  fetchRoom();

  const channel = supabase
    .channel(`room:${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `code=eq.${code}`,
      },
      (payload) => {
        if (!active) return;
        if (payload.eventType === "DELETE") {
          callback(null);
        } else {
          callback({ id: payload.new.code, ...payload.new });
        }
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export function listenToAnswers(code, callback) {
  if (!isSupabaseConfigured || !supabase) {
    callback({});
    return () => {};
  }

  let active = true;

  const fetchAnswers = async () => {
    const { data } = await supabase
      .from("room_answers")
      .select("user_id, answers")
      .eq("room_code", code);

    const answersMap = {};
    (data || []).forEach((d) => {
      answersMap[d.user_id] = d.answers || {};
    });
    if (active) callback(answersMap);
  };

  fetchAnswers();

  const channel = supabase
    .channel(`room_answers:${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_answers",
        filter: `room_code=eq.${code}`,
      },
      () => {
        if (active) fetchAnswers();
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
