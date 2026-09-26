import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  completed: { bg: "rgba(16, 185, 129, 0.12)", border: "#10B981", text: "#10B981", dot: "#10B981" },
  available: { bg: "rgba(212, 160, 23, 0.12)", border: "#D4A017", text: "#D4A017", dot: "#D4A017" },
  in_progress: { bg: "rgba(59, 130, 246, 0.12)", border: "#3B82F6", text: "#3B82F6", dot: "#3B82F6" },
  locked: { bg: "rgba(100, 100, 100, 0.08)", border: "#333", text: "#555", dot: "#444" },
};

const STATUS_LABELS = {
  completed: "✓ Completed",
  available: "● Available",
  in_progress: "◐ In Progress",
  locked: "○ Locked",
};

export default function RoadmapVisual({ roadmap, onToggleStatus }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterSubject, setFilterSubject] = useState("all");

  const subjects = useMemo(() => {
    if (!roadmap?.nodes) return [];
    const set = new Set(roadmap.nodes.map((n) => n.subject).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [roadmap]);

  const tiers = useMemo(() => {
    if (!roadmap?.nodes) return [];
    const filtered = filterSubject === "all"
      ? roadmap.nodes
      : roadmap.nodes.filter((n) => n.subject === filterSubject);

    const tierMap = {};
    filtered.forEach((node) => {
      const t = node.tier || 1;
      if (!tierMap[t]) tierMap[t] = [];
      tierMap[t].push(node);
    });
    return Object.entries(tierMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([tier, nodes]) => ({ tier: Number(tier), nodes }));
  }, [roadmap, filterSubject]);

  const nodeMap = useMemo(() => {
    if (!roadmap?.nodes) return {};
    const map = {};
    roadmap.nodes.forEach((n) => { map[n.id] = n; });
    return map;
  }, [roadmap]);

  if (!roadmap || !roadmap.nodes || roadmap.nodes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#777" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <h4 style={{ margin: "0 0 6px", fontSize: 17, color: "#FAFAFA" }}>
          No roadmap generated yet
        </h4>
        <p style={{ color: "#777", fontSize: 13, margin: 0 }}>
          Generate a roadmap to see your learning path visualized.
        </p>
      </div>
    );
  }

  const completedCount = roadmap.nodes.filter((n) => n.status === "completed").length;
  const totalCount = roadmap.nodes.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Progress Bar */}
      <div
        style={{
          backgroundColor: "#111111",
          border: "1px solid #222",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "#888" }}>
              {completedCount} of {totalCount} milestones completed
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#D4A017" }}>
              {progressPct}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              backgroundColor: "#1C1C1C",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                backgroundColor: "#D4A017",
                borderRadius: 3,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
        <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
          {roadmap.suggestedTimeline || ""}
        </span>
      </div>

      {/* Subject Filter */}
      {subjects.length > 2 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSubject(s)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                backgroundColor: filterSubject === s ? "#1A1A1A" : "transparent",
                border: filterSubject === s ? "1px solid #333" : "1px solid transparent",
                color: filterSubject === s ? "#FAFAFA" : "#777",
                fontWeight: filterSubject === s ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {s === "all" ? "All Subjects" : s}
            </button>
          ))}
        </div>
      )}

      {/* Tier-based Visual Roadmap */}
      <div style={{ position: "relative" }}>
        {tiers.map((tierData, tierIdx) => (
          <div key={tierData.tier} style={{ marginBottom: tierIdx < tiers.length - 1 ? 12 : 0 }}>
            {/* Tier Label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "#D4A017",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0A0A0A",
                  flexShrink: 0,
                }}
              >
                {tierData.tier}
              </div>
              <span style={{ fontSize: 12, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {tierData.tier === 1 ? "Foundational" : tierData.tier === 2 ? "Core Concepts" : tierData.tier === 3 ? "Intermediate" : tierData.tier === 4 ? "Advanced" : `Level ${tierData.tier}`}
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#1C1C1C" }} />
            </div>

            {/* Nodes in this tier */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
                paddingLeft: 14,
              }}
            >
              {tierData.nodes.map((node) => {
                const colors = STATUS_COLORS[node.status] || STATUS_COLORS.locked;
                const isSelected = selectedNode === node.id;
                const deps = (node.dependsOn || []).map((id) => nodeMap[id]).filter(Boolean);

                return (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: tierIdx * 0.05 }}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${isSelected ? colors.border : colors.border + "40"}`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease, transform 0.15s ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.border)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = isSelected ? colors.border : colors.border + "40")
                    }
                  >
                    {/* Status dot + Subject badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: colors.dot,
                          }}
                        />
                        <span style={{ fontSize: 11, color: colors.text, fontWeight: 600 }}>
                          {STATUS_LABELS[node.status] || "○ Locked"}
                        </span>
                      </div>
                      {node.estimatedHours && (
                        <span style={{ fontSize: 11, color: "#555" }}>
                          ~{node.estimatedHours}h
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#FAFAFA",
                        margin: "0 0 4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {node.title}
                    </h4>

                    {/* Subject */}
                    {node.subject && (
                      <span style={{ fontSize: 11, color: "#666" }}>
                        {node.subject}
                      </span>
                    )}

                    {/* Tags */}
                    {node.tags && node.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {node.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              color: "#888",
                              backgroundColor: "#1A1A1A",
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}30` }}>
                            <p style={{ fontSize: 13, color: "#CCC", lineHeight: 1.5, margin: "0 0 10px" }}>
                              {node.description}
                            </p>

                            {/* Dependencies */}
                            {deps.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
                                  Prerequisites:
                                </span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                  {deps.map((d) => (
                                    <span
                                      key={d.id}
                                      style={{
                                        fontSize: 11,
                                        color: STATUS_COLORS[d.status]?.text || "#888",
                                        backgroundColor: "#0A0A0A",
                                        padding: "3px 8px",
                                        borderRadius: 4,
                                        border: `1px solid ${STATUS_COLORS[d.status]?.border || "#333"}30`,
                                      }}
                                    >
                                      {d.title}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Resources */}
                            {node.resources && node.resources.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <span style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
                                  Resources:
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                                  {node.resources.map((r, i) => (
                                    <a
                                      key={i}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        fontSize: 12,
                                        color: "#3B82F6",
                                        textDecoration: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      <span style={{ color: "#555" }}>
                                        {r.type === "video" ? "🎬" : r.type === "docs" ? "📄" : r.type === "practice" ? "💻" : "📖"}
                                      </span>
                                      {r.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Status Toggle Buttons */}
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                              {["available", "in_progress", "completed", "locked"].map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStatus?.(node.id, s);
                                  }}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    backgroundColor: node.status === s ? STATUS_COLORS[s].bg : "transparent",
                                    border: `1px solid ${node.status === s ? STATUS_COLORS[s].border : "#333"}`,
                                    color: node.status === s ? STATUS_COLORS[s].text : "#666",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
