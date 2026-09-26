import React from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";
import { SubjectCardSkeleton } from "../components/studyspace/SkeletonLoader";

export default function CoursesPage() {
  const { currentUser } = useAuth();
  const { subjects, loading } = useSubjects(currentUser?.uid);
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              color: "#FAFAFA",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Enrolled Courses
          </h1>
          <p style={{ color: "#888888", fontSize: 16, margin: 0 }}>
            Your semester course workspaces and active module progression.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <SubjectCardSkeleton key={i} />)}
          </div>
        ) : subjects.length === 0 ? (
          <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, color: "#FAFAFA", marginBottom: 8 }}>No courses registered</h3>
            <p style={{ color: "#888888", fontSize: 14 }}>Your course list will appear here once onboarding is completed.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {subjects.map((sub) => (
              <motion.div
                key={sub.id}
                whileHover={{ y: -3, backgroundColor: "#181818" }}
                onClick={() => navigate(`/subjects/${sub.id}`)}
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid #222222",
                  borderRadius: 16,
                  padding: "28px 24px",
                  cursor: "pointer",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.3)",
                  transition: "background-color 0.15s",
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    margin: 0,
                  }}
                >
                  {sub.name}
                </h3>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
