import { generateAcademicAiResponse } from "./gemini";

export async function generateDailyPlan(
  userProfile,
  subjects,
  previousSessions,
  topicPreference,
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set.");

  const subjectList = subjects
    .map(
      (s) =>
        `${s.name} (${s.credits} credits, ${s.type}, difficulty: ${s.difficulty || "Medium"}, studyMinutes: ${s.totalStudyMinutes || 0})`,
    )
    .join("\n");

  const marksInfo = userProfile?.marks
    ? Object.entries(userProfile.marks)
        .map(([subId, marks]) => {
          const sub = subjects.find((s) => s.id === subId);
          const entries = Object.entries(marks)
            .filter(([k]) => k !== "attendance")
            .map(([k, v]) => `${k}: ${v.obtained || "NA"}/${v.max}`)
            .join(", ");
          return `${sub?.name || subId}: ${entries}`;
        })
        .join("\n")
    : "No marks data available";

  const recentSessions =
    previousSessions
      .slice(0, 10)
      .map(
        (s) =>
          `${s.createdAt?.toDate?.() ? new Date(s.createdAt.toDate()).toLocaleDateString() : "recent"}: ${s.subjectName || "General"} - learned: ${s.learned || "none"} - wished: ${s.wishedLearned || "none"}`,
      )
      .join("\n") || "No previous sessions";

  const goals =
    userProfile?.goals?.selectedGoals?.join(", ") || "General improvement";
  const targetSGPA = userProfile?.goals?.targetSGPA || "not set";
  const studyHours = userProfile?.goals?.studyHours || "not set";
  const program = userProfile?.academicInfo?.program || "unknown";
  const branch = userProfile?.academicInfo?.branch || "unknown";
  const semester = userProfile?.academicInfo?.semester || "unknown";
  const personality =
    userProfile?.aboutYou?.personalityTraits?.join(", ") || "none";

  const topicLine = topicPreference?.trim()
    ? `\nThe user specifically wants to study: "${topicPreference.trim()}" today.`
    : "";

  const prompt = `You are an academic study planner AI for a college student. Generate a personalized daily study plan.

STUDENT PROFILE:
- Program: ${program}, Branch: ${branch}, ${semester}
- Goals: ${goals} (Target SGPA: ${targetSGPA})
- Daily study hours available: ${studyHours}
- Personality traits: ${personality}${topicLine}

SUBJECTS (with credits and type):
${subjectList}

CURRENT MARKS:
${marksInfo}

RECENT STUDY SESSIONS (last 10, to avoid repetition):
${recentSessions}

INSTRUCTIONS:
1. Prioritize subjects where marks are weak or credits are high.
2. DO NOT repeat topics already covered in recent sessions (check "learned" field).
3. If the user specified a topic preference, prioritize that topic.
4. Break the plan into focused study blocks (each 25-45 minutes).
5. Include specific topics/subtopics to study, not just subject names.
6. Suggest 2-3 free online resources (YouTube videos, articles, docs) for each topic.
7. Estimate time for each block.
8. Keep total study time within the student's available daily hours.
9. Suggest which subject to start with based on priority.

Return ONLY a valid raw JSON object (no markdown, no backticks):
{
  "summary": "Brief 1-line overview of today's plan",
  "prioritySubject": "Name of the most important subject today",
  "blocks": [
    {
      "subject": "Subject Name",
      "topic": "Specific topic to study",
      "subtopics": ["subtopic 1", "subtopic 2"],
      "estimatedMinutes": 25,
      "resources": [
        {"title": "Resource title", "url": "https://...", "type": "video|article|docs"}
      ],
      "reason": "Why this is prioritized"
    }
  ],
  "totalEstimatedMinutes": 120,
  "quizSuggestion": "Suggested quiz topic after completing the plan"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!res.ok) {
    const fallback = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (!fallback.ok) {
      const errBody = await fallback.text();
      throw new Error(`Gemini API returned ${fallback.status}: ${errBody}`);
    }
    const data = await fallback.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Gemini returned an empty response.");
    const jsonText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonText);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini returned an empty response.");
  const jsonText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(jsonText);
}
