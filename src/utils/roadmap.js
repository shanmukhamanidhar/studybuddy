const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_FALLBACK_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

async function callGemini(prompt, apiKey) {
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  const headers = { "Content-Type": "application/json" };

  let res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) {
    res = await fetch(`${GEMINI_FALLBACK_URL}?key=${apiKey}`, {
      method: "POST",
      headers,
      body,
    });
  }
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API returned ${res.status}: ${errBody}`);
  }
  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini returned an empty response.");
  return rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function generateRoadmap(
  userProfile,
  subjects,
  previousSessions,
  focusSubject,
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

  const sessionHistory =
    previousSessions
      .slice(0, 20)
      .map((s) => {
        const date = s.createdAt?.toDate?.()
          ? new Date(s.createdAt.toDate()).toLocaleDateString()
          : "recent";
        return `${date}: ${s.subjectName || "General"} - learned: ${s.learned || "none"} - wished: ${s.wishedLearned || "none"}`;
      })
      .join("\n") || "No previous sessions";

  const goals =
    userProfile?.goals?.selectedGoals?.join(", ") || "General improvement";
  const targetSGPA = userProfile?.goals?.targetSGPA || "not set";
  const studyHours = userProfile?.goals?.studyHours || "not set";
  const program = userProfile?.academicInfo?.program || "unknown";
  const branch = userProfile?.academicInfo?.branch || "unknown";
  const semester = userProfile?.academicInfo?.semester || "unknown";
  const cgpa = userProfile?.academicInfo?.cgpa || "not set";
  const personality =
    userProfile?.aboutYou?.personalityTraits?.join(", ") || "none";

  const focusLine = focusSubject?.trim()
    ? `\nThe user wants a roadmap specifically for: "${focusSubject.trim()}". Generate a detailed roadmap for this subject only.`
    : "\nGenerate a comprehensive roadmap covering ALL enrolled subjects, prioritized by weak areas and goals.";

  const prompt = `You are an academic learning roadmap generator for a college student. Create a visual, step-by-step learning roadmap similar to roadmap.sh.

STUDENT PROFILE:
- Program: ${program}, Branch: ${branch}, ${semester}
- CGPA: ${cgpa}
- Goals: ${goals} (Target SGPA: ${targetSGPA})
- Daily study hours: ${studyHours}
- Personality: ${personality}${focusLine}

ENROLLED SUBJECTS:
${subjectList}

CURRENT MARKS:
${marksInfo}

RECENT STUDY HISTORY (what was learned, what was skipped):
${sessionHistory}

INSTRUCTIONS:
1. Generate a learning roadmap with interconnected nodes representing topics/milestones.
2. Each node should have a clear title, brief description, and estimated time to complete.
3. Nodes should have dependencies (prerequisites) shown via "dependsOn" array of node IDs.
4. Mark nodes as "available" (can start now), "locked" (prerequisites not met), or "completed" (already learned based on session history).
5. Organize nodes in logical layers/tiers from foundational to advanced.
6. Include resources (URLs) for each node where possible.
7. Prioritize subjects where marks are weak.
8. If a subject has been studied before (check session history), mark relevant nodes as completed.
9. Generate 15-30 nodes for a comprehensive roadmap.
10. Each node needs a unique numeric "id" field.

Return ONLY a valid raw JSON object (no markdown, no backticks):
{
  "title": "Roadmap title (e.g. 'CSE Semester 5 Learning Path')",
  "description": "Brief description of the roadmap",
  "subject": "Subject name or 'All Subjects'",
  "nodes": [
    {
      "id": 1,
      "title": "Node title",
      "description": "Brief description of what this node covers",
      "subject": "Subject name this belongs to",
      "estimatedHours": 5,
      "status": "available",
      "tier": 1,
      "resources": [
        {"title": "Resource title", "url": "https://...", "type": "video|article|docs|practice"}
      ],
      "tags": ["tag1", "tag2"],
      "dependsOn": []
    }
  ],
  "totalEstimatedHours": 120,
  "suggestedTimeline": "6 weeks"
}`;

  const jsonText = await callGemini(prompt, apiKey);
  return JSON.parse(jsonText);
}
