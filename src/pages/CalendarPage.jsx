import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { assignmentsDb, examsDb } from "../lib/supabaseDb";
import { PageHeaderSkeleton, ListItemSkeleton } from "../components/studyspace/SkeletonLoader";

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let loaded = 0;
    const done = () => { loaded++; if (loaded >= 2) setLoading(false); };
    const unsubA = assignmentsDb.subscribe(currentUser.uid, (items) => {
      setAssignments(items);
      done();
    });
    const unsubE = examsDb.subscribe(currentUser.uid, (items) => {
      setExams(items);
      done();
    });
    return () => { unsubA(); unsubE(); };
  }, [currentUser]);

  const allEvents = [
    ...assignments.map((a) => ({ title: `📝 ${a.title}`, date: a.deadline, type: "Assignment", subject: a.subjectName })),
    ...exams.map((e) => ({ title: `🎯 ${e.examName}`, date: e.date, type: "Exam", subject: e.subjectName })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
          Unified Academic Calendar
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 36px" }}>
          Unified schedule of upcoming coursework deadlines, midterm exams, and academic milestones.
        </p>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)}
          </div>
        ) : allEvents.length === 0 ? (
          <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center", color: "#888888" }}>
            No scheduled calendar events. Add assignments or exams to populate your calendar.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {allEvents.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid #222",
                  borderRadius: 14,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#FAFAFA" }}>{ev.title}</h4>
                  <span style={{ fontSize: 12, color: "#888888" }}>{ev.subject} • {ev.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#D4A017", backgroundColor: "rgba(212,160,23,0.1)", padding: "6px 14px", borderRadius: 8 }}>
                  📅 {ev.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
