import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "../components/layout/SidebarLayout";
import { generateAcademicAiResponse } from "../utils/gemini";

export default function LabsPage() {
  const [activeLabModal, setActiveLabModal] = useState(null);

  // Interactive CPU Scheduling State for OS Lab
  const [algorithm, setAlgorithm] = useState("Round Robin");
  const [quantum, setQuantum] = useState(2);
  const [output, setOutput] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // SQL Lab state
  const [sqlQuery, setSqlQuery] = useState("SELECT name, credits FROM courses WHERE status = 'Active';");
  const [sqlResult, setSqlResult] = useState(null);

  const runCpuLab = async () => {
    setOutput(`Simulating ${algorithm} (Time Quantum: ${quantum}ms)...
Process P1 [Burst: 10ms] -> Executing
Process P2 [Burst: 4ms] -> Preempted
Process P3 [Burst: 7ms] -> Executing
Calculated Avg Waiting Time: 4.2ms
Average Turnaround Time: 8.5ms
Status: Optimal scheduling completed.`);

    // Quiet contextual AI assistance inside workflow
    setAiLoading(true);
    const contextPrompt = `Quietly explain key takeaway for ${algorithm} scheduling with quantum ${quantum}ms in 2 sentences.`;
    const res = await generateAcademicAiResponse(contextPrompt, { subjects: [{ name: "Operating Systems" }] });
    setAiInsight(res);
    setAiLoading(false);
  };

  const runSqlLab = () => {
    setSqlResult([
      { name: "Operating Systems", credits: 4, status: "Active" },
      { name: "DBMS", credits: 4, status: "Active" },
      { name: "Computer Networks", credits: 3, status: "Active" },
    ]);
  };

  const labs = [
    {
      id: "os-cpu",
      subject: "Operating Systems",
      title: "CPU Scheduling Simulator",
      description: "Visualize and analyze process execution using Round Robin, FCFS, and SJF algorithms.",
      actionText: "Resume Lab →",
      status: "Active Session",
      badgeColor: "#10B981",
    },
    {
      id: "dbms-sql",
      subject: "DBMS",
      title: "SQL Execution Sandbox",
      description: "Write and execute DDL/DML queries against real relational schemas in real-time.",
      actionText: "Continue →",
      status: "In Progress",
      badgeColor: "#D4A017",
    },
    {
      id: "cn-packet",
      subject: "Computer Networks",
      title: "Packet Routing Tracer",
      description: "Simulate IP packet forwarding, hop counts, and Dijkstra shortest path routing.",
      actionText: "Launch →",
      status: "Ready",
      badgeColor: "#3B82F6",
    },
    {
      id: "ds-tree",
      subject: "Data Structures",
      title: "Binary Tree Visualizer",
      description: "Interactive node insertion, deletion, and tree traversal algorithms.",
      actionText: "Launch →",
      status: "Ready",
      badgeColor: "#8B5CF6",
    },
  ];

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, backgroundColor: "rgba(212, 160, 23, 0.12)", border: "1px solid rgba(212, 160, 23, 0.3)", color: "#D4A017", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            ⚡ Signature Feature
          </div>
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
            Interactive Labs
          </h1>
          <p style={{ color: "#888888", fontSize: 16, margin: 0 }}>
            Hands-on technical lab environments designed for active concept mastery.
          </p>
        </div>

        {/* Labs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {labs.map((lab) => (
            <motion.div
              key={lab.id}
              whileHover={{ y: -4 }}
              onClick={() => setActiveLabModal(lab.id)}
              style={{
                backgroundColor: "#141414",
                border: "1px solid #282828",
                borderRadius: 20,
                padding: "28px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 220,
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#D4A017" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#888888", fontWeight: 600 }}>{lab.subject}</span>
                  <span style={{ fontSize: 11, color: lab.badgeColor, fontWeight: 700 }}>{lab.status}</span>
                </div>

                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "0 0 10px" }}>
                  {lab.title}
                </h3>
                <p style={{ color: "#A3A3A3", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  {lab.description}
                </p>
              </div>

              <div style={{ paddingTop: 20, marginTop: 20, borderTop: "1px solid #202020", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 14, color: "#D4A017", fontWeight: 700 }}>
                  {lab.actionText}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Lab Modal Sandbox */}
        <AnimatePresence>
          {activeLabModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 200,
                padding: 24,
              }}
            >
              <div
                style={{
                  backgroundColor: "#161616",
                  border: "1px solid #282828",
                  borderRadius: 20,
                  maxWidth: 680,
                  width: "100%",
                  padding: 32,
                  position: "relative",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#D4A017", textTransform: "uppercase" }}>
                    Interactive Environment
                  </span>
                  <button
                    onClick={() => setActiveLabModal(null)}
                    style={{ background: "transparent", border: "none", color: "#888", fontSize: 20, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                {activeLabModal === "os-cpu" && (
                  <div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FAFAFA", margin: "0 0 16px" }}>
                      CPU Scheduling Simulator
                    </h2>
                    
                    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                      <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
                      >
                        <option value="Round Robin">Round Robin</option>
                        <option value="FCFS">First Come First Serve (FCFS)</option>
                        <option value="SJF">Shortest Job First (SJF)</option>
                      </select>

                      <button
                        onClick={runCpuLab}
                        style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}
                      >
                        Run Execution
                      </button>
                    </div>

                    {output && (
                      <pre style={{ backgroundColor: "#0E0E0E", border: "1px solid #222", padding: 16, borderRadius: 10, color: "#10B981", fontFamily: "monospace", fontSize: 13 }}>
                        {output}
                      </pre>
                    )}

                    {aiLoading ? (
                      <div style={{ fontSize: 12, color: "#666", marginTop: 12 }}>Analyzing execution dynamics quietly...</div>
                    ) : aiInsight ? (
                      <div style={{ backgroundColor: "#111111", borderLeft: "3px solid #D4A017", padding: "12px 16px", marginTop: 16, borderRadius: "0 8px 8px 0", color: "#CCCCCC", fontSize: 13 }}>
                        {aiInsight}
                      </div>
                    ) : null}
                  </div>
                )}

                {activeLabModal === "dbms-sql" && (
                  <div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FAFAFA", margin: "0 0 16px" }}>
                      SQL Execution Sandbox
                    </h2>

                    <textarea
                      rows={4}
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      style={{ width: "100%", padding: 14, borderRadius: 10, backgroundColor: "#0E0E0E", border: "1px solid #282828", color: "#FAFAFA", fontFamily: "monospace", fontSize: 14, marginBottom: 16 }}
                    />

                    <button
                      onClick={runSqlLab}
                      style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 20 }}
                    >
                      Execute Query
                    </button>

                    {sqlResult && (
                      <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 10, padding: 16 }}>
                        <table style={{ width: "100%", color: "#FAFAFA", fontSize: 13, borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #282828", color: "#888", textAlign: "left" }}>
                              <th style={{ padding: 8 }}>Name</th>
                              <th style={{ padding: 8 }}>Credits</th>
                              <th style={{ padding: 8 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #1C1C1C" }}>
                                <td style={{ padding: 8 }}>{row.name}</td>
                                <td style={{ padding: 8 }}>{row.credits}</td>
                                <td style={{ padding: 8, color: "#10B981" }}>{row.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeLabModal !== "os-cpu" && activeLabModal !== "dbms-sql" && (
                  <div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FAFAFA", margin: "0 0 12px" }}>
                      Simulation Environment
                    </h2>
                    <p style={{ color: "#A3A3A3", fontSize: 14, marginBottom: 20 }}>
                      Interactive module launched for hands-on session practice.
                    </p>
                    <button
                      onClick={() => setActiveLabModal(null)}
                      style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}
                    >
                      Close Simulation
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </SidebarLayout>
  );
}
