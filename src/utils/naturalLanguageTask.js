/**
 * Natural Language Parser for Assignments & Tasks
 * Uses algorithmic keyword parsing — no API key needed.
 */

const SUBJECT_KEYWORDS = {
  "operating system": ["os", "operating system", "deadlock", "process", "thread", "scheduling", "memory", "paging", "virtual memory"],
  "database": ["dbms", "database", "sql", "query", "normalization", "transaction", "acids", "relational", "nosql"],
  "computer networks": ["network", "tcp", "udp", "dns", "http", "osi", "ip", "router", "switch", "socket"],
  "data structures": ["array", "linked list", "stack", "queue", "tree", "graph", "hash", " bst", "sorting"],
  "algorithms": ["algorithm", "complexity", "big o", "dynamic programming", "greedy", "binary search", "merge sort", "quicksort"],
  "mathematics": ["math", "calculus", "algebra", "probability", "statistics", "matrix", "derivative", "integral"],
  "physics": ["physics", "mechanics", "thermodynamics", "optics", "electromagnetic", "quantum"],
  "chemistry": ["chemistry", "organic", "inorganic", "reaction", "molecule", "bond", "element"],
  "english": ["essay", "grammar", "writing", "literature", "report", "presentation"],
};

const PRIORITY_KEYWORDS = {
  High: ["urgent", "asap", "immediately", "today", "tomorrow", "due soon", "critical", "important", "deadline"],
  Low: ["whenever", "eventually", "no rush", "low priority", "sometime", "flexible"],
};

const RECURRENCE_KEYWORDS = {
  Daily: ["daily", "every day", "each day"],
  Weekly: ["weekly", "every week", "each week"],
  "Bi-weekly": ["biweekly", "bi-weekly", "every two weeks", "fortnightly"],
  Monthly: ["monthly", "every month", "each month"],
};

function parseRelativeDate(text) {
  const today = new Date();
  const lower = text.toLowerCase();

  if (lower.match(/\b(tomorrow|next day)\b/)) {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  }
  if (lower.match(/\b(today|tonight)\b/)) {
    return today.toISOString().split("T")[0];
  }
  if (lower.match(/\b(day after tomorrow)\b/)) {
    today.setDate(today.getDate() + 2);
    return today.toISOString().split("T")[0];
  }
  if (lower.match(/\bnext week\b/)) {
    today.setDate(today.getDate() + 7);
    return today.toISOString().split("T")[0];
  }

  const inDays = lower.match(/\bin (\d+) days?\b/);
  if (inDays) {
    today.setDate(today.getDate() + parseInt(inDays[1]));
    return today.toISOString().split("T")[0];
  }

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const currentDay = today.getDay();
      let diff = (i - currentDay + 7) % 7;
      if (diff === 0) diff = 7;
      today.setDate(today.getDate() + diff);
      return today.toISOString().split("T")[0];
    }
  }

  const dateMatch = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();
    const d = new Date(year < 100 ? 2000 + year : year, month, day);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }

  today.setDate(today.getDate() + 3);
  return today.toISOString().split("T")[0];
}

function detectPriority(text) {
  const lower = text.toLowerCase();
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return priority;
  }
  return "Medium";
}

function detectRecurrence(text) {
  const lower = text.toLowerCase();
  for (const [rec, keywords] of Object.entries(RECURRENCE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return rec;
  }
  return "None";
}

function detectSubject(text, availableSubjects) {
  const lower = text.toLowerCase();

  for (const subject of availableSubjects) {
    const name = (subject.name || "").toLowerCase();
    if (lower.includes(name)) {
      return { id: subject.id, name: subject.name };
    }
  }

  for (const [subjectName, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      const matched = availableSubjects.find(
        (s) => (s.name || "").toLowerCase().includes(subjectName)
      );
      if (matched) return { id: matched.id, name: matched.name };
      return { id: "general", name: subjectName.charAt(0).toUpperCase() + subjectName.slice(1) };
    }
  }

  return { id: "general", name: "General Academic" };
}

function extractTitle(text) {
  let cleaned = text
    .replace(/\b(due|submit|complete|finish|do|work on|start|begin)\b/gi, "")
    .replace(/\b(tomorrow|today|next week|in \d+ days?)\b/gi, "")
    .replace(/\b(urgent|asap|important|critical|whenever|low priority|no rush)\b/gi, "")
    .replace(/\b(daily|weekly|monthly|biweekly)\b/gi, "")
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (cleaned.length < 3) cleaned = text.trim();

  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (cleaned.length > 80) cleaned = cleaned.slice(0, 77) + "...";

  return cleaned || "Untitled Task";
}

export async function parseTaskWithGemini(input, availableSubjects = []) {
  if (!input || !input.trim()) {
    throw new Error("No input provided to parse.");
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const subject = detectSubject(input, availableSubjects);
      const deadline = parseRelativeDate(input);
      const priority = detectPriority(input);
      const recurrence = detectRecurrence(input);
      const title = extractTitle(input);

      resolve({
        title,
        subjectId: subject.id,
        subjectName: subject.name,
        deadline,
        priority,
        status: "To-do",
        recurrence,
        reminderOffset: "1_day_before",
        isAiParsed: true,
      });
    }, 200);
  });
}
