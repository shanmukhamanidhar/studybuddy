import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { useSubjects } from "../hooks/useSubjects";
import { useGamification } from "../hooks/useGamification";
import { parseTaskWithGemini } from "../utils/naturalLanguageTask";
import { ListItemSkeleton, StatsRowSkeleton, TabBarSkeleton } from "../components/studyspace/SkeletonLoader";

export default function AssignmentsPage() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const { award } = useGamification(currentUser?.uid);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Natural Language & Gemini
  const [nlInput, setNlInput] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);

  // Manual Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("To-do");
  const [recurrence, setRecurrence] = useState("None");
  const [reminderOffset, setReminderOffset] = useState("1_day_before");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState("All");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("All");

  // Reminders Notification
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [toastMessage, setToastMessage] = useState(null);

  // Firestore Realtime Subscription
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "assignments"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            subjectId: data.subjectId || "general",
            subjectName: data.subjectName || "General Academic",
            deadline: data.deadline || new Date().toISOString().split("T")[0],
            priority: data.priority || "Medium",
            status: data.status || (data.status === "Completed" ? "Done" : "To-do"),
            recurrence: data.recurrence || "None",
            reminderOffset: data.reminderOffset || "1_day_before",
            createdAt: data.createdAt,
          };
        });
        setAssignments(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // Request Notification Permission
  const handleEnableNotifications = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === "granted") {
        new Notification("Smart Reminders Active 🔔", {
          body: `Reminders enabled for ${currentUser?.email || "your account"}.`,
        });
      }
    }
  };

  // Immediate Alert Trigger
  const triggerAlert = (item) => {
    setToastMessage(`🔔 Reminder sent to ${currentUser?.email} for "${item.title}"`);
    setTimeout(() => setToastMessage(null), 4000);
    if (Notification.permission === "granted") {
      new Notification(`Reminder: ${item.title}`, {
        body: `${item.subjectName} • Priority: ${item.priority} • Due: ${item.deadline}`,
      });
    }
  };

  // Quick Add via Gemini AI
  const handleGeminiQuickAdd = async (e) => {
    e.preventDefault();
    if (!nlInput.trim() || !currentUser) return;

    setIsAiParsing(true);
    try {
      const task = await parseTaskWithGemini(nlInput, subjects);
      await addDoc(collection(db, "users", currentUser.uid, "assignments"), {
        title: task.title,
        subjectId: task.subjectId,
        subjectName: task.subjectName,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        recurrence: task.recurrence,
        reminderOffset: task.reminderOffset,
        createdAt: serverTimestamp(),
      });

      setToastMessage(`✨ Added "${task.title}" via Gemini AI`);
      setTimeout(() => setToastMessage(null), 3500);
      setNlInput("");
      setParsedPreview(null);
    } catch (err) {
      console.error("Gemini Quick Add error:", err);
      setToastMessage(`❌ Gemini Error: ${err.message || String(err)}`);
    } finally {
      setIsAiParsing(false);
    }
  };

  // Simple input handler — no local parsing, Gemini does all the work on submit
  const handleInputChange = (e) => {
    setNlInput(e.target.value);
  };

  // Save Modal Form (Manual Add / Edit)
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    const selectedSub = subjects.find((s) => s.id === subjectId);
    const subName = selectedSub?.name || "General Academic";

    if (editingItem) {
      await updateDoc(
        doc(db, "users", currentUser.uid, "assignments", editingItem.id),
        {
          title: title.trim(),
          subjectId: subjectId || "general",
          subjectName: subName,
          deadline: deadline || new Date().toISOString().split("T")[0],
          priority,
          status,
          recurrence,
          reminderOffset,
        }
      );
    } else {
      await addDoc(collection(db, "users", currentUser.uid, "assignments"), {
        title: title.trim(),
        subjectId: subjectId || "general",
        subjectName: subName,
        deadline: deadline || new Date().toISOString().split("T")[0],
        priority,
        status,
        recurrence,
        reminderOffset,
        createdAt: serverTimestamp(),
      });
    }

    setShowModal(false);
  };

  // Toggle or Update Status & Handle Recurrence Workflow
  const handleUpdateStatus = async (item, newStatus) => {
    if (!currentUser) return;
    const itemRef = doc(db, "users", currentUser.uid, "assignments", item.id);
    await updateDoc(itemRef, { status: newStatus });

    // Award XP when marking assignment as done
    if (newStatus === "Done" && item.status !== "Done") {
      award("assignment_complete", { priority: item.priority });
      const todayStr = new Date().toISOString().split("T")[0];
      if (item.deadline >= todayStr) {
        award("assignment_early", {});
      }
    }

    // Handle Recurring Task Automation
    if (newStatus === "Done" && item.recurrence && item.recurrence !== "None") {
      const currentDue = new Date(item.deadline);
      const nextDue = new Date(currentDue);

      if (item.recurrence === "Daily") nextDue.setDate(nextDue.getDate() + 1);
      else if (item.recurrence === "Weekly") nextDue.setDate(nextDue.getDate() + 7);
      else if (item.recurrence === "Bi-weekly") nextDue.setDate(nextDue.getDate() + 14);
      else if (item.recurrence === "Monthly") nextDue.setDate(nextDue.getDate() + 30);

      const nextDeadlineStr = nextDue.toISOString().split("T")[0];

      await addDoc(collection(db, "users", currentUser.uid, "assignments"), {
        title: item.title,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        deadline: nextDeadlineStr,
        priority: item.priority,
        status: "To-do",
        recurrence: item.recurrence,
        reminderOffset: item.reminderOffset,
        createdAt: serverTimestamp(),
      });

      setToastMessage(`🔄 Next ${item.recurrence.toLowerCase()} task scheduled for ${nextDeadlineStr}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    if (!currentUser) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "assignments", id));
  };

  // Open Modal Helper
  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setSubjectId(item.subjectId);
      setDeadline(item.deadline);
      setPriority(item.priority);
      setStatus(item.status);
      setRecurrence(item.recurrence);
      setReminderOffset(item.reminderOffset);
    } else {
      setEditingItem(null);
      setTitle("");
      setSubjectId(subjects[0]?.id || "");
      setDeadline(new Date().toISOString().split("T")[0]);
      setPriority("Medium");
      setStatus("To-do");
      setRecurrence("None");
      setReminderOffset("1_day_before");
    }
    setShowModal(true);
  };

  // Filtered List
  const filteredAssignments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return assignments.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (selectedSubjectFilter !== "All" && item.subjectId !== selectedSubjectFilter) {
        return false;
      }

      if (selectedStatusTab === "To-do") return item.status === "To-do";
      if (selectedStatusTab === "In Progress") return item.status === "In Progress";
      if (selectedStatusTab === "Done") return item.status === "Done";
      if (selectedStatusTab === "Recurring") return item.recurrence !== "None";
      if (selectedStatusTab === "Overdue") return item.deadline < todayStr && item.status !== "Done";

      return true;
    });
  }, [assignments, searchQuery, selectedStatusTab, selectedSubjectFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const total = assignments.length;
    const todo = assignments.filter((a) => a.status === "To-do").length;
    const inProgress = assignments.filter((a) => a.status === "In Progress").length;
    const done = assignments.filter((a) => a.status === "Done").length;
    const overdue = assignments.filter((a) => a.deadline < todayStr && a.status !== "Done").length;

    return { total, todo, inProgress, done, overdue };
  }, [assignments]);

  // Priority Dot Color
  const getPriorityDot = (p) => {
    if (p === "High") return "#EF4444";
    if (p === "Medium") return "#D4A017";
    return "#10B981";
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 24px 80px", color: "#FAFAFA" }}>
        {/* Minimalist Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: "0 0 4px",
              }}
            >
              Assignments & Tasks
            </h1>
            <p style={{ color: "#737373", fontSize: 14, margin: 0 }}>
              {metrics.todo + metrics.inProgress} pending deliverables across your courses.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleEnableNotifications}
              style={{
                background: "transparent",
                border: "none",
                color: notificationPermission === "granted" ? "#10B981" : "#666",
                fontSize: 13,
                cursor: "pointer",
                padding: "6px 12px",
              }}
            >
              {notificationPermission === "granted" ? "🔔 Alerts On" : "🔕 Alerts Off"}
            </button>

            <button
              onClick={() => openModal()}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: "#D4A017",
                color: "#0A0A0A",
                fontWeight: 600,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              backgroundColor: "#161616",
              border: "1px solid #333",
              color: "#D4A017",
              padding: "10px 16px",
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>
              ✕
            </button>
          </div>
        )}

        {/* Minimalist Gemini AI Natural Language Input */}
        <form onSubmit={handleGeminiQuickAdd} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#111111",
              border: "1px solid #222222",
              borderRadius: 12,
              padding: "4px 6px 4px 16px",
              transition: "border-color 0.2s ease",
            }}
          >
            <span style={{ color: "#D4A017", fontSize: 15, marginRight: 10 }}>✨</span>
            <input
              type="text"
              value={nlInput}
              onChange={handleInputChange}
              placeholder='Add with Gemini AI (e.g., "DBMS lab report due next Friday high priority")'
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "#FAFAFA",
                fontSize: 14,
                padding: "10px 0",
              }}
            />
            <button
              type="submit"
              disabled={!nlInput.trim() || isAiParsing}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: nlInput.trim() ? "#D4A017" : "#1A1A1A",
                color: nlInput.trim() ? "#0A0A0A" : "#555",
                fontWeight: 600,
                fontSize: 13,
                border: "none",
                cursor: nlInput.trim() ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              {isAiParsing ? "Parsing..." : "Add"}
            </button>
          </div>

          {/* Minimalist AI Parse Preview */}
          {parsedPreview && nlInput.trim() && (
            <div
              style={{
                marginTop: 8,
                padding: "6px 12px",
                fontSize: 12,
                color: "#888888",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span>Target: <strong style={{ color: "#FAFAFA" }}>{parsedPreview.title}</strong></span>
              <span>Course: <span style={{ color: "#D4A017" }}>{parsedPreview.subjectName}</span></span>
              <span>Due: {parsedPreview.deadline}</span>
              <span>Priority: {parsedPreview.priority}</span>
            </div>
          )}
        </form>

        {/* Minimal Metrics Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "14px 20px",
            backgroundColor: "#111111",
            border: "1px solid #1C1C1C",
            borderRadius: 12,
            marginBottom: 28,
            fontSize: 13,
          }}
        >
          <div style={{ color: "#888" }}>
            Total: <strong style={{ color: "#FAFAFA" }}>{metrics.total}</strong>
          </div>
          <div style={{ color: "#888" }}>
            To-do: <strong style={{ color: "#FAFAFA" }}>{metrics.todo}</strong>
          </div>
          <div style={{ color: "#888" }}>
            In Progress: <strong style={{ color: "#3B82F6" }}>{metrics.inProgress}</strong>
          </div>
          <div style={{ color: "#888" }}>
            Done: <strong style={{ color: "#10B981" }}>{metrics.done}</strong>
          </div>
          {metrics.overdue > 0 && (
            <div style={{ color: "#EF4444", fontWeight: 600 }}>
              Overdue: {metrics.overdue}
            </div>
          )}
        </div>

        {/* Minimalist Filter Tabs & Search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "To-do", "In Progress", "Done", "Recurring", "Overdue"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedStatusTab(tab)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor: selectedStatusTab === tab ? "#1F1F1F" : "transparent",
                  color: selectedStatusTab === tab ? "#FAFAFA" : "#666",
                  fontSize: 13,
                  fontWeight: selectedStatusTab === tab ? 600 : 400,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab === "Recurring" ? "🔄 Recurring" : tab}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: "#111",
                border: "1px solid #222",
                borderRadius: 6,
                padding: "6px 10px",
                color: "#FAFAFA",
                fontSize: 12,
                outline: "none",
                width: 140,
              }}
            />

            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              style={{
                backgroundColor: "#111",
                border: "1px solid #222",
                borderRadius: 6,
                padding: "6px 10px",
                color: "#888",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <option value="All">All Courses</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Minimal Task List */}
        {loading ? (
          <>
            <StatsRowSkeleton count={4} />
            <TabBarSkeleton count={6} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 6 }).map((_, i) => <ListItemSkeleton key={i} />)}
            </div>
          </>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666", border: "1px dashed #222", borderRadius: 12 }}>
            No tasks found.
          </div>
        ) : (
          <div style={{ borderTop: "1px solid #1C1C1C" }}>
            {filteredAssignments.map((item) => {
              const isDone = item.status === "Done";

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 8px",
                    borderBottom: "1px solid #1A1A1A",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* Left: Checkbox, Dot, Title, Course, Due */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 260 }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleUpdateStatus(item, isDone ? "To-do" : "Done")}
                      style={{ accentColor: "#D4A017", cursor: "pointer", width: 16, height: 16 }}
                    />

                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: getPriorityDot(item.priority),
                        flexShrink: 0,
                      }}
                      title={`Priority: ${item.priority}`}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isDone ? "#555" : "#FAFAFA",
                            textDecoration: isDone ? "line-through" : "none",
                          }}
                        >
                          {item.title}
                        </span>

                        <span style={{ fontSize: 11, color: "#737373" }}>• {item.subjectName}</span>

                        {item.recurrence && item.recurrence !== "None" && (
                          <span style={{ fontSize: 11, color: "#8B5CF6" }}>🔄 {item.recurrence}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Date, Status Selector, Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {item.deadline}
                    </span>

                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateStatus(item, e.target.value)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: isDone ? "#10B981" : item.status === "In Progress" ? "#3B82F6" : "#888",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <option value="To-do" style={{ backgroundColor: "#111", color: "#FAFAFA" }}>To-do</option>
                      <option value="In Progress" style={{ backgroundColor: "#111", color: "#FAFAFA" }}>In Progress</option>
                      <option value="Done" style={{ backgroundColor: "#111", color: "#FAFAFA" }}>Done</option>
                    </select>

                    <button
                      onClick={() => triggerAlert(item)}
                      title="Test Alert"
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#D4A017")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                    >
                      🔔
                    </button>

                    <button
                      onClick={() => openModal(item)}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Minimal Modal */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
          >
            <div
              style={{
                backgroundColor: "#141414",
                border: "1px solid #222",
                borderRadius: 16,
                padding: 28,
                maxWidth: 420,
                width: "90%",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#FAFAFA" }}>
                {editingItem ? "Edit Task" : "New Task"}
              </h3>

              <form onSubmit={handleSaveAssignment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task name"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: "#0D0D0D",
                      border: "1px solid #262626",
                      color: "#FAFAFA",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Course</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: "#0D0D0D",
                        border: "1px solid #262626",
                        color: "#FAFAFA",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="general">General Academic</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Due Date</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: "#0D0D0D",
                        border: "1px solid #262626",
                        color: "#FAFAFA",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: "#0D0D0D",
                        border: "1px solid #262626",
                        color: "#FAFAFA",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Recurrence</label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: "#0D0D0D",
                        border: "1px solid #262626",
                        color: "#FAFAFA",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="None">None</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "transparent", border: "1px solid #262626", color: "#888", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: 10, borderRadius: 6, backgroundColor: "#D4A017", color: "#000", fontWeight: 700, border: "none", cursor: "pointer" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
