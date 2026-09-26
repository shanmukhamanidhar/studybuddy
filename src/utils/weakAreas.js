const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

/**
 * Aggregates raw Firestore data into per-subject metrics for weak-area analysis.
 */
export function aggregatePerformanceData({ subjects = [], sessions = [], quizzes = [], exams = [], assignments = [], marks = {}, gamification = {} }) {
  const subjectMap = {};

  subjects.forEach((s) => {
    subjectMap[s.id] = {
      id: s.id,
      name: s.name,
      difficulty: s.difficulty || "Medium",
      totalStudyMinutes: s.totalStudyMinutes || 0,
      credits: s.credits || 0,
      quizzes: 0,
      quizCorrect: 0,
      quizTotal: 0,
      examScore: 0,
      examTotal: 0,
      assignmentDone: 0,
      assignmentTotal: 0,
      sessions: 0,
      lastStudiedAt: s.lastStudiedAt || null,
      marksData: marks[s.id] || null,
    };
  });

  sessions.forEach((s) => {
    if (!s.subjectId || !subjectMap[s.subjectId]) return;
    subjectMap[s.subjectId].sessions += 1;
    subjectMap[s.subjectId].totalStudyMinutes += s.actualMinutes || 0;
  });

  quizzes.forEach((q) => {
    if (q.type !== "quiz") return;
    const sub = subjectMap[q.subjectId];
    if (!sub) return;
    sub.quizzes += 1;
    sub.quizCorrect += q.score || 0;
    sub.quizTotal += q.total || 0;
  });

  exams.forEach((e) => {
    if (e.type !== "exam") return;
    const sub = subjectMap[e.subjectId];
    if (!sub) return;
    sub.examScore += e.score || 0;
    sub.examTotal += e.total || 0;
  });

  assignments.forEach((a) => {
    const sub = subjectMap[a.subjectId];
    if (!sub) return;
    sub.assignmentTotal += 1;
    if (a.status === "Done") sub.assignmentDone += 1;
  });

  return Object.values(subjectMap);
}

/**
 * Compute a 0-100 strength score per subject from aggregated metrics.
 */
export function computeStrengthScores(perfData) {
  return perfData.map((s) => {
    let score = 50;

    const quizPct = s.quizTotal > 0 ? (s.quizCorrect / s.quizTotal) * 100 : null;
    if (quizPct !== null) {
      score += (quizPct - 50) * 0.3;
    }

    const examPct = s.examTotal > 0 ? (s.examScore / s.examTotal) * 100 : null;
    if (examPct !== null) {
      score += (examPct - 50) * 0.25;
    }

    const assignPct = s.assignmentTotal > 0 ? (s.assignmentDone / s.assignmentTotal) * 100 : 50;
    score += (assignPct - 50) * 0.15;

    if (s.totalStudyMinutes > 0) {
      const studyNorm = Math.min(s.totalStudyMinutes / 120, 1);
      score += (studyNorm * 10 - 5) * 0.2;
    }

    const now = Date.now();
    const last = s.lastStudiedAt ? new Date(s.lastStudiedAt).getTime() : 0;
    const daysSince = last ? (now - last) / 86400000 : 30;
    if (daysSince > 14) score -= 8;
    else if (daysSince > 7) score -= 4;

    if (s.difficulty === "Hard") score -= 3;
    if (s.difficulty === "Easy") score += 3;

    return {
      ...s,
      quizPct,
      examPct,
      assignPct,
      strengthScore: Math.max(0, Math.min(100, Math.round(score))),
    };
  });
}

/**
 * Build the Gemini prompt to analyze weak areas and return structured JSON.
 */
export function buildWeakAreaPrompt(perfData, userProfile) {
  const subjectSummaries = perfData.map((s) => {
    const lines = [`Subject: ${s.name} (Difficulty: ${s.difficulty}, Credits: ${s.credits})`];
    lines.push(`  Study time: ${s.totalStudyMinutes} minutes across ${s.sessions} sessions`);
    if (s.quizPct !== null) lines.push(`  Quiz accuracy: ${Math.round(s.quizPct)}% (${s.quizCorrect}/${s.quizTotal} correct across ${s.quizzes} quizzes)`);
    if (s.examPct !== null) lines.push(`  Exam performance: ${Math.round(s.examPct)}% (${s.examScore}/${s.examTotal} marks)`);
    lines.push(`  Assignments: ${s.assignmentDone}/${s.assignmentTotal} completed`);
    if (s.lastStudiedAt) lines.push(`  Last studied: ${s.lastStudiedAt}`);
    return lines.join("\n");
  }).join("\n\n");

  const marksSummaries = [];
  Object.entries(perfData).forEach(([, s]) => {
    if (!s.marksData) return;
    const entries = Object.entries(s.marksData).filter(([k]) => k !== "attendance");
    if (entries.length === 0) return;
    const detail = entries.map(([k, v]) => `    ${k}: ${v.obtained || "?"}/${v.max || "?"}`).join("\n");
    marksSummaries.push(`  ${s.name}:\n${detail}`);
  });

  const goals = userProfile?.goals || {};
  const academic = userProfile?.academicInfo || {};

  return `You are an expert academic performance analyst. Analyze this student's performance data and identify weak areas, strengths, and provide personalized recommendations.

STUDENT PROFILE:
- Name: ${userProfile?.aboutYou?.preferredName || "Student"}
- Program: ${academic.program || "N/A"} ${academic.branch || ""} (Semester ${academic.semester || "N/A"})
- CGPA: ${academic.cgpa || "N/A"}
- Target SGPA: ${goals.targetSGPA || "N/A"}
- Target CGPA: ${goals.targetCGPA || "N/A"}
- Daily study goal: ${goals.studyHours || "2"} hours

PER-SUBJECT PERFORMANCE DATA:
${subjectSummaries || "No subject data available yet."}

${marksSummaries.length > 0 ? `ACADEMIC MARKS:\n${marksSummaries.join("\n")}` : ""}

OVERALL STATS:
- Total quizzes taken: ${gamification.totalQuizzes || 0}
- Overall quiz accuracy: ${gamification.totalQuizzes > 0 ? Math.round(((gamification.totalCorrect || 0) / gamification.totalQuizzes) * 100) : "N/A"}%
- Total focus minutes: ${gamification.totalFocusMinutes || 0}
- Current streak: ${gamification.currentStreak || 0} days
- Exams completed: ${gamification.totalExams || 0}

TASK: Analyze this data and return a JSON object with this EXACT structure (no markdown fences, just raw JSON):
{
  "subjects": [
    {
      "name": "Subject Name",
      "strengthScore": 75,
      "strengths": ["list of specific strengths"],
      "weaknesses": ["list of specific weaknesses"],
      "verdict": "One-line verdict about this subject's status"
    }
  ],
  "topWeakAreas": [
    {
      "topic": "Specific weak topic or skill",
      "subject": "Which subject",
      "severity": "high|medium|low",
      "reason": "Why this is a weak area based on the data",
      "action": "What to do about it"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed actionable recommendation",
      "priority": "high|medium|low",
      "impact": "Expected impact if followed"
    }
  ],
  "studyPlan": {
    "focusSubject": "Which subject needs the most attention right now",
    "dailyMinutes": 45,
    "weeklyGoal": "Complete 3 quizzes on weak topics"
  }
}

Rules:
- Score each subject 0-100 (0=severe weakness, 100=excellent mastery)
- Be specific — reference actual scores, percentages, and data from the student's records
- Provide 3-6 topWeakAreas ordered by severity (high first)
- Provide 4-6 personalized recommendations
- Only include subjects the student actually has data for
- Be honest about weaknesses — don't sugarcoat
- If there is very little data, say so and recommend the student take more quizzes and study sessions first`;
}

/**
 * Calls Gemini to get weak-area analysis. Returns parsed JSON.
 */
export async function analyzeWeakAreas(perfData, userProfile) {
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in .env.");
  }

  const prompt = buildWeakAreaPrompt(perfData, userProfile);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return parsed;
}
