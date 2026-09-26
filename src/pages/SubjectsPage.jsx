import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";

export default function SubjectsPage() {
  const { currentUser } = useAuth();
  const { subjects, loading, createSubject, deleteSubject } = useSubjects(currentUser?.uid);
  const navigate = useNavigate();

  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    await createSubject({ name: newSubName, courseCode: newSubCode });
    setNewSubName("");
    setNewSubCode("");
    setShowAddModal(false);
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: "0 0 6px",
              }}
            >
              Academic Subjects
            </h1>
            <p style={{ color: "#A3A3A3", fontSize: 15, margin: 0 }}>
              Your enrolled course workspaces loaded directly from your academic record.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(212, 160, 23, 0.25)",
            }}
          >
            + Add Subject
          </button>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div style={{ color: "#737373", padding: 40, textAlign: "center" }}>Loading your course workspaces...</div>
        ) : subjects.length === 0 ? (
          <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, color: "#FAFAFA", marginBottom: 8 }}>No subjects found</h3>
            <p style={{ color: "#888888", fontSize: 14, marginBottom: 24 }}>Add your first academic course to begin.</p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                backgroundColor: "#D4A017",
                color: "#0A0A0A",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              + Add Subject
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {subjects.map((sub) => (
              <motion.div
                key={sub.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/subjects/${sub.id}`)}
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 18,
                  padding: "24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 160,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: sub.color || "#D4A017",
                  }}
                />

                <div style={{ paddingLeft: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#737373", fontWeight: 600 }}>
                      {sub.courseCode || "COURSE"}
                    </span>
                    <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>
                      {sub.credits || 3} Credits
                    </span>
                  </div>

                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
                    {sub.name}
                  </h3>
                </div>

                <div style={{ paddingLeft: 8, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: "1px solid #1C1C1C" }}>
                  <span style={{ fontSize: 13, color: "#888888" }}>
                    Workspace →
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSubject(sub.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#555555",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Subject Modal */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
          >
            <div
              style={{
                backgroundColor: "#171717",
                border: "1px solid #282828",
                borderRadius: 20,
                padding: "32px",
                maxWidth: 420,
                width: "90%",
              }}
            >
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "#FAFAFA", margin: "0 0 16px" }}>
                Add New Subject
              </h3>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 6 }}>Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "#111",
                      border: "1px solid #282828",
                      color: "#FAFAFA",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 6 }}>Course Code (Optional)</label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="e.g. CS401"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      backgroundColor: "#111",
                      border: "1px solid #282828",
                      color: "#FAFAFA",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      backgroundColor: "transparent",
                      border: "1px solid #282828",
                      color: "#FAFAFA",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      backgroundColor: "#D4A017",
                      color: "#0A0A0A",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Create
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
