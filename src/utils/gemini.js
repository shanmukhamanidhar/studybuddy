// Gemini AI client using native fetch — NO mock data, NO fallbacks. Errors are surfaced directly.

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

/**
 * Generates AI responses via Gemini API based on real user academic context.
 * Throws or returns error string if Gemini fails — no silent fallbacks.
 * @param {string} prompt - User query or request
 * @param {object} userContext - Real academic context from Firestore
 * @returns {Promise<string>} AI generated response
 */
export async function generateAcademicAiResponse(prompt, userContext = {}) {
  const {
    name = "Student",
    program = "",
    branch = "",
    semester = "",
    subjects = [],
    assignments = [],
    exams = [],
    goals = {},
  } = userContext;

  const subjectList = subjects.map((s) => s.name || s).join(", ");
  const pendingAssignments = assignments
    .filter((a) => a.status !== "Completed")
    .map((a) => `${a.title} (${a.subjectName}, Due: ${a.deadline})`)
    .join("; ");
  const upcomingExams = exams
    .map((e) => `${e.examName} in ${e.subjectName} on ${e.date}`)
    .join("; ");

  const systemContext = `
You are StudyBuddy AI, an intelligent Academic Assistant embedded into StudyBuddy - an Academic Management Platform.
You possess real-time context about this student:
- Name: ${name}
- Academic Info: ${program} ${branch} (Semester ${semester})
- Enrolled Subjects: ${subjectList || "None listed"}
- Target SGPA: ${goals.targetSGPA || "Not set"}
- Target CGPA: ${goals.targetCGPA || "Not set"}
- Daily Study Goal: ${goals.studyHours || "2"} hours/day
- Pending Assignments: ${pendingAssignments || "No pending assignments"}
- Upcoming Exams: ${upcomingExams || "No upcoming exams"}

Guidelines:
- Provide clear, concise, actionable academic advice.
- Speak in a supportive, intelligent, and focused tone.
- Keep responses focused and readable using clean markdown formatting.
`;

  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set in .env. Get a free key at aistudio.google.com/apikey and restart the dev server.",
    );
  }

  const fullPrompt = `${systemContext}\n\nUser Question/Request: ${prompt}`;

  // Try gemini-2.0-flash first, then gemini-3.5-flash
  let response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
    },
  );

  if (!response.ok) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
      },
    );
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error(
      "Gemini returned an empty response — no candidates or text in API response.",
    );
  }

  return generatedText;
}
