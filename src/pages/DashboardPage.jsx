import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useSubjects } from "../hooks/useSubjects";
import { useGamification } from "../hooks/useGamification";
import SubjectCard from "../components/studyspace/SubjectCard";
import CreateSubjectModal from "../components/studyspace/CreateSubjectModal";
import EmptyState from "../components/studyspace/EmptyState";
import { SubjectCardSkeleton } from "../components/studyspace/SkeletonLoader";
import GamificationWidget from "../components/gamification/GamificationWidget";
import ToastNotification from "../components/studyspace/ToastNotification";
import { motion } from "framer-motion";

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { subjects, loading, createSubject, updateSubject, deleteSubject } = useSubjects(currentUser?.uid);
  const { level, levelData, streak, totalFocusMinutes, totalSessions, totalQuizzes, arenaWins } = useGamification(currentUser?.uid);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [toast, setToast] = useState(null);

  const name =
    userProfile?.aboutYou?.preferredName ||
    currentUser?.displayName ||
    userProfile?.displayName ||
    "Student";

  const greeting = getTimeBasedGreeting();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (subj) => {
    setEditingSubject(subj);
    setModalOpen(true);
  };

  const handleSaveSubject = async (formData) => {
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
        showToast("Subject updated.");
      } else {
        await createSubject(formData);
        showToast("Subject created.");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save subject.", "error");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteSubject(subjectId);
      showToast("Subject removed.");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete subject.", "error");
    }
  };

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", color: "#FAFAFA", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        className="notebook-grid"
        style={{
          flex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
          padding: "130px 28px 80px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Main Content & Optional Subtle Sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: subjects.length > 0 ? "1fr 260px" : "1fr", gap: 56, alignItems: "flex-start" }} className="desk-layout-container">
          
          {/* Central Study Desk */}
          <div>
            {/* Minimal Greeting Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginBottom: 40 }}
            >
              <h1
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 700,
                  color: "#FAFAFA",
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                {greeting}, {name}.
              </h1>
              <p
                style={{
                  color: "#A3A3A3",
                  fontSize: 16,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                What would you like to study today?
              </p>
            </motion.div>

            {/* Subjects Desk Section */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SubjectCardSkeleton />
                <SubjectCardSkeleton />
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState onCreateClick={handleOpenCreate} />
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#737373",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Your Notebooks ({subjects.length})
                  </span>

                  <button
                    onClick={handleOpenCreate}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#D4A017",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add Subject
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {subjects.map((subj) => (
                    <SubjectCard
                      key={subj.id}
                      subject={subj}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteSubject}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Right Panel (Subtle & Small) */}
          {subjects.length > 0 && (
            <div className="desk-sidebar-panel" style={{ position: "sticky", top: 120 }}>
              <GamificationWidget
                level={level}
                levelData={levelData}
                streak={streak}
                totalFocusMinutes={totalFocusMinutes}
                totalSessions={totalSessions}
                totalQuizzes={totalQuizzes}
                arenaWins={arenaWins}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Subject Trigger for Quick Access */}
      {subjects.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleOpenCreate}
          title="Add New Subject"
          style={{
            position: "fixed",
            bottom: 36,
            right: 36,
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: "#D4A017",
            color: "#0A0A0A",
            border: "none",
            fontSize: 22,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(212, 160, 23, 0.35)",
            zIndex: 90,
          }}
        >
          +
        </motion.button>
      )}

      {/* Subject Modal */}
      <CreateSubjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveSubject}
        editingSubject={editingSubject}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <style>{`
        @media (max-width: 860px) {
          .desk-layout-container {
            grid-template-columns: 1fr !important;
          }
          .desk-sidebar-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
