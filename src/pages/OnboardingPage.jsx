import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "../components/Navbar";

const PERSONALITY_TRAITS = [
  { id: "ambitious", label: "Ambitious", icon: "\uD83C\uDFAF" },
  { id: "consistent", label: "Consistent", icon: "\uD83D\uDCDA" },
  { id: "procrastinator", label: "Procrastinator", icon: "\uD83D\uDE05" },
  { id: "night_owl", label: "Night Owl", icon: "\uD83C\uDF19" },
  { id: "early_bird", label: "Early Bird", icon: "\uD83C\uDF05" },
  { id: "distracted", label: "Easily Distracted", icon: "\uD83E\uDD2F" },
  { id: "competitive", label: "Competitive", icon: "\uD83D\uDCAA" },
  { id: "calm_under_pressure", label: "Calm Under Pressure", icon: "\uD83D\uDE0C" },
  { id: "fast_learner", label: "Fast Learner", icon: "\uD83D\uDE80" },
  { id: "curious", label: "Curious", icon: "\uD83E\uDDE0" },
  { id: "creative", label: "Creative", icon: "\uD83C\uDFA8" },
  { id: "team_player", label: "Team Player", icon: "\uD83E\uDD1D" },
];

const SELF_DESCRIPTIONS = [
  { id: "last_minute", label: "I usually start studying at the last minute.", icon: "\uD83D\uDE2C" },
  { id: "struggle_consistency", label: "I study regularly but struggle with consistency.", icon: "\uD83D\uDCC5" },
  { id: "hard_work_low_grades", label: "I work hard but my grades don't reflect it.", icon: "\uD83D\uDE13" },
  { id: "doing_well_want_more", label: "I'm already doing well and want to do even better.", icon: "\uD83D\uDCC8" },
  { id: "dont_know_start", label: "I don't know where to start.", icon: "\uD83E\uDD37" },
  { id: "determined_to_improve", label: "I'm determined to improve this semester.", icon: "\uD83D\uDD25" },
];

const GOAL_CARDS = [
  { id: "sgpa_9", label: "Achieve SGPA above 9.0", icon: "\uD83C\uDFC6" },
  { id: "improve_cgpa", label: "Improve my CGPA", icon: "\uD83D\uDCC8" },
  { id: "pass_all", label: "Pass every subject", icon: "\u2705" },
  { id: "top_10", label: "Rank in the top 10%", icon: "\uD83C\uDF1F" },
  { id: "reduce_procrastination", label: "Reduce procrastination", icon: "\u23F1\uFE0F" },
  { id: "study_habit", label: "Build a consistent study habit", icon: "\uD83D\uDCD6" },
  { id: "placements", label: "Prepare for placements", icon: "\uD83D\uDCBC" },
];

const SUGGESTED_SUBJECTS = [
  "Operating Systems",
  "Database Management Systems",
  "Computer Networks",
  "Software Engineering",
  "Java Programming",
  "Python Programming",
  "Artificial Intelligence",
  "Machine Learning",
  "Compiler Design",
  "Data Structures",
  "Algorithms",
  "Web Technologies",
  "Cloud Computing",
  "Cyber Security",
  "Discrete Mathematics",
  "Engineering Mathematics",
  "Probability & Statistics",
];

export default function OnboardingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [preferredName, setPreferredName] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [gradingSystem, setGradingSystem] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCredits, setNewSubCredits] = useState("3.0");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const didPrefillRef = useRef(false);

  const [showOptional, setShowOptional] = useState(false);
  const [personalityTraits, setPersonalityTraits] = useState([]);
  const [selfDescription, setSelfDescription] = useState("");
  const [evaluationPattern, setEvaluationPattern] = useState("");
  const [previousGPAs, setPreviousGPAs] = useState({});
  const [cgpa, setCgpa] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [targetSGPA, setTargetSGPA] = useState("");
  const [targetCGPA, setTargetCGPA] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (currentUser?.displayName && !preferredName) {
      setPreferredName(currentUser.displayName);
    }
  }, [currentUser, preferredName]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (userProfile?.onboardingCompleted) {
      navigate("/app");
      return;
    }
    if (userProfile?.onboardingData && !didPrefillRef.current) {
      didPrefillRef.current = true;
      const data = userProfile.onboardingData;
      if (data.preferredName) setPreferredName(data.preferredName);
      if (data.branch) setBranch(data.branch);
      if (data.semester) setSemester(data.semester);
      if (data.gradingSystem) setGradingSystem(data.gradingSystem);
      if (data.subjects) setSubjects(data.subjects);
      if (data.personalityTraits) setPersonalityTraits(data.personalityTraits);
      if (data.selfDescription) setSelfDescription(data.selfDescription);
      if (data.evaluationPattern) setEvaluationPattern(data.evaluationPattern);
      if (data.previousGPAs) setPreviousGPAs(data.previousGPAs);
      if (data.cgpa) setCgpa(data.cgpa);
      if (data.marks) setMarks(data.marks);
      if (data.selectedGoals) setSelectedGoals(data.selectedGoals);
      if (data.targetSGPA) setTargetSGPA(data.targetSGPA);
      if (data.targetCGPA) setTargetCGPA(data.targetCGPA);
      if (data.studyHours) setStudyHours(data.studyHours);
    }
  }, [userProfile, navigate]);

  const getPrevSemesters = () => {
    const semNum = parseInt(semester.replace("Semester ", ""), 10) || 1;
    const semList = [];
    for (let i = 1; i < semNum; i++) {
      semList.push(`Semester ${i}`);
    }
    return semList;
  };

  useEffect(() => {
    const prevSemKeys = getPrevSemesters();
    if (prevSemKeys.length === 0) {
      setCgpa("");
      return;
    }
    let total = 0;
    let count = 0;
    prevSemKeys.forEach((key) => {
      const val = parseFloat(previousGPAs[key]);
      if (!isNaN(val) && val >= 0) {
        total += val;
        count++;
      }
    });
    if (count > 0) {
      setCgpa((total / count).toFixed(2));
    }
  }, [semester, previousGPAs]);

  const handleSubjectNameChange = (val) => {
    setNewSubName(val);
    if (val.trim()) {
      const matches = SUGGESTED_SUBJECTS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuggestions(matches);
      setIsDropdownOpen(true);
    } else {
      setFilteredSuggestions(SUGGESTED_SUBJECTS);
      setIsDropdownOpen(true);
    }
  };

  const addSubject = (nameToAdd = newSubName) => {
    if (!nameToAdd.trim()) return;
    const parsedCredits = parseFloat(newSubCredits);
    setSubjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: nameToAdd.trim(),
        credits: isNaN(parsedCredits) || parsedCredits <= 0 ? 3.0 : parsedCredits,
        type: "Theory",
      },
    ]);
    setNewSubName("");
    setNewSubCredits("3.0");
    setFilteredSuggestions([]);
    setIsDropdownOpen(false);
  };

  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const getAssessmentList = () => {
    if (evaluationPattern === "Class Test + Sessional") {
      return ["Class Test 1", "Class Test 2", "Sessional 1", "Sessional 2", "Assignments / Quiz"];
    }
    return ["Mid 1", "Mid 2", "Assignments / Quiz"];
  };

  const getDefaultMaxMarks = (item) => {
    const lower = item.toLowerCase();
    if (lower.includes("class test")) return "10";
    if (lower.includes("sessional")) return "20";
    if (lower.includes("mid")) return "20";
    return "10";
  };

  const handleMarkChange = (subId, field, key, value) => {
    setMarks((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: {
          ...(prev[subId]?.[field] || { mode: "Not Attempted", obtained: "", max: getDefaultMaxMarks(field) }),
          [key]: value,
        },
      },
    }));
  };

  const handleAttendanceChange = (subId, value) => {
    setMarks((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], attendance: value },
    }));
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!preferredName.trim()) { setErrorMsg("Please enter your name."); return; }
    if (!branch.trim()) { setErrorMsg("Please enter your branch."); return; }
    if (!gradingSystem) { setErrorMsg("Please select a grading system."); return; }
    if (subjects.length === 0) { setErrorMsg("Please add at least one subject."); return; }

    try {
      setSaving(true);
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          onboardingCompleted: true,
          onboardingData: {
            preferredName: preferredName.trim(),
            branch: branch.trim(),
            semester,
            gradingSystem,
            subjects,
            personalityTraits,
            selfDescription,
            evaluationPattern: gradingSystem === "Relative" ? "Relative Grading" : evaluationPattern,
            previousGPAs,
            cgpa,
            marks,
            selectedGoals,
            targetSGPA,
            targetCGPA,
            studyHours,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      navigate("/app");
    } catch (err) {
      console.error("Error saving onboarding:", err);
      setErrorMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    backgroundColor: "#171717",
    border: "1px solid #2B2B2B",
    color: "#FAFAFA",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#A3A3A3",
    marginBottom: 8,
  };

  const cardStyle = {
    backgroundColor: "#111111",
    border: "1px solid #2B2B2B",
    borderRadius: 18,
    padding: 24,
  };

  const optCardStyle = {
    backgroundColor: "#0F0F0F",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 22,
  };

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", color: "#FAFAFA", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "100px 24px 60px",
          maxWidth: 680,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#D4A017", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Quick Setup
          </span>
        </div>

        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700, margin: "0 0 6px", width: "100%" }}>
          Welcome to StudyBuddy
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 32px", width: "100%" }}>
          Just a few details to get you started. This takes less than a minute.
        </p>

        {errorMsg && (
          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── REQUIRED: Name ── */}
          <div style={cardStyle}>
            <label style={labelStyle}>What should we call you?</label>
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="e.g. Alex, Priya"
              style={inputStyle}
            />
          </div>

          {/* ── REQUIRED: Branch + Semester ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={cardStyle}>
              <label style={labelStyle}>Branch / Specialization</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE, ECE"
                style={inputStyle}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {["CSE", "AI & ML", "ECE", "IT", "EEE"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBranch(b)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      backgroundColor: branch === b ? "rgba(212, 160, 23, 0.15)" : "#171717",
                      border: branch === b ? "1px solid #D4A017" : "1px solid #2B2B2B",
                      color: branch === b ? "#D4A017" : "#A3A3A3",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <label style={labelStyle}>Current Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── REQUIRED: Grading System ── */}
          <div style={cardStyle}>
            <label style={labelStyle}>Grading System</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "Absolute", desc: "Grades based on your marks" },
                { id: "Relative", desc: "Grades based on class performance" },
              ].map((g) => (
                <div
                  key={g.id}
                  onClick={() => setGradingSystem(g.id)}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 14,
                    backgroundColor: gradingSystem === g.id ? "rgba(212, 160, 23, 0.1)" : "#171717",
                    border: gradingSystem === g.id ? "2px solid #D4A017" : "1px solid #2B2B2B",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{g.id}</span>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: gradingSystem === g.id ? "5px solid #D4A017" : "2px solid #2B2B2B", backgroundColor: "#0A0A0A" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#A3A3A3" }}>{g.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── REQUIRED: Subjects ── */}
          <div style={cardStyle}>
            <label style={labelStyle}>Add your subjects</label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px auto", gap: 10, alignItems: "end" }} ref={dropdownRef}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => handleSubjectNameChange(e.target.value)}
                  onFocus={() => {
                    setFilteredSuggestions(
                      newSubName.trim()
                        ? SUGGESTED_SUBJECTS.filter((s) => s.toLowerCase().includes(newSubName.toLowerCase()))
                        : SUGGESTED_SUBJECTS
                    );
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Type a subject name..."
                  style={{ ...inputStyle, paddingRight: 14 }}
                />
                {isDropdownOpen && filteredSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "#171717",
                      border: "1px solid #3F3F46",
                      borderRadius: 12,
                      marginTop: 6,
                      maxHeight: 200,
                      overflowY: "auto",
                      zIndex: 100,
                      boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
                    }}
                  >
                    {filteredSuggestions.map((s) => (
                      <div
                        key={s}
                        onClick={() => { setNewSubName(s); setIsDropdownOpen(false); }}
                        style={{
                          padding: "10px 14px",
                          fontSize: 13,
                          color: "#FAFAFA",
                          cursor: "pointer",
                          borderBottom: "1px solid #222",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 160, 23, 0.15)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={newSubCredits}
                onChange={(e) => setNewSubCredits(e.target.value)}
                placeholder="Credits"
                style={{ ...inputStyle, textAlign: "center" }}
              />
              <button
                type="button"
                onClick={() => addSubject()}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  backgroundColor: "#D4A017",
                  color: "#0A0A0A",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {["OS", "DBMS", "CN", "DSA", "Web Dev", "AI & ML"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => addSubject(chip === "OS" ? "Operating Systems" : chip === "DBMS" ? "Database Management Systems" : chip === "CN" ? "Computer Networks" : chip === "DSA" ? "Data Structures" : chip === "Web Dev" ? "Web Technologies" : "Artificial Intelligence")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 100,
                    backgroundColor: "#171717",
                    border: "1px solid #2B2B2B",
                    color: "#D4A017",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4A017"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2B2B2B"; }}
                >
                  + {chip}
                </button>
              ))}
            </div>

            {subjects.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 10,
                      backgroundColor: "#171717",
                      border: "1px solid #2B2B2B",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{sub.name}</span>
                      <span style={{ fontSize: 12, color: "#D4A017", fontWeight: 600 }}>{parseFloat(sub.credits).toFixed(1)} cr</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubject(sub.id)}
                      style={{ background: "none", border: "none", color: "#EF4444", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── REQUIRED: Personality Traits ── */}
          <div style={cardStyle}>
            <label style={labelStyle}>Describe yourself</label>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px" }}>Select all that apply.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {PERSONALITY_TRAITS.map((t) => {
                const selected = personalityTraits.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => setPersonalityTraits((prev) => selected ? prev.filter((id) => id !== t.id) : [...prev, t.id])}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      backgroundColor: selected ? "rgba(212, 160, 23, 0.1)" : "#171717",
                      border: selected ? "1.5px solid #D4A017" : "1px solid #2B2B2B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#FAFAFA" : "#A3A3A3" }}>{t.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── REQUIRED: Self Description ── */}
          <div style={cardStyle}>
            <label style={labelStyle}>Which sentence describes you best?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SELF_DESCRIPTIONS.map((sd) => {
                const selected = selfDescription === sd.id;
                return (
                  <div
                    key={sd.id}
                    onClick={() => setSelfDescription(sd.id)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      backgroundColor: selected ? "rgba(212, 160, 23, 0.1)" : "#171717",
                      border: selected ? "1.5px solid #D4A017" : "1px solid #2B2B2B",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{sd.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: selected ? "#FAFAFA" : "#A3A3A3" }}>{sd.label}</span>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: selected ? "5px solid #D4A017" : "2px solid #2B2B2B", backgroundColor: "#0A0A0A" }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════ OPTIONAL SECTION TOGGLE ═══════════════ */}
          <div
            onClick={() => setShowOptional((p) => !p)}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 14,
              backgroundColor: showOptional ? "rgba(212, 160, 23, 0.06)" : "#111111",
              border: showOptional ? "1px solid rgba(212, 160, 23, 0.25)" : "1px dashed #2B2B2B",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all 0.25s ease",
              userSelect: "none",
            }}
          >
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: showOptional ? "#D4A017" : "#FAFAFA" }}>
                {showOptional ? "Hide optional details" : "Add more details (optional)"}
              </span>
              {!showOptional && (
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#A3A3A3" }}>
                  Goals, previous GPA, marks, and more
                </p>
              )}
            </div>
            <span style={{ fontSize: 20, color: showOptional ? "#D4A017" : "#666", transition: "transform 0.25s ease", transform: showOptional ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▾
            </span>
          </div>

          {/* ═══════════════ OPTIONAL SECTIONS ═══════════════ */}
          {showOptional && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
              {/* ── Evaluation Pattern (only for Absolute grading) ── */}
              {gradingSystem === "Absolute" && (
                <div style={optCardStyle}>
                  <label style={{ ...labelStyle, color: "#D4A017" }}>Internal Assessment Pattern</label>
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px" }}>How are your internal marks evaluated?</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { id: "Class Test + Sessional", items: ["Class Tests", "Sessionals", "Assignments / Quizzes"] },
                      { id: "Mid Examination", items: ["Mid 1", "Mid 2", "Assignments / Quizzes"] },
                    ].map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => setEvaluationPattern(ep.id)}
                        style={{
                          padding: "16px 18px",
                          borderRadius: 14,
                          backgroundColor: evaluationPattern === ep.id ? "rgba(212, 160, 23, 0.1)" : "#171717",
                          border: evaluationPattern === ep.id ? "2px solid #D4A017" : "1px solid #2B2B2B",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{ep.id}</span>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: evaluationPattern === ep.id ? "5px solid #D4A017" : "2px solid #2B2B2B", backgroundColor: "#0A0A0A" }} />
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#A3A3A3", lineHeight: 1.8 }}>
                          {ep.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Previous GPAs ── */}
              {semester !== "Semester 1" && (
                <div style={optCardStyle}>
                  <label style={{ ...labelStyle, color: "#D4A017" }}>Previous Academic Performance</label>
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px" }}>Enter your previous semester GPAs (optional).</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                    {getPrevSemesters().map((semKey) => (
                      <div key={semKey}>
                        <label style={{ display: "block", fontSize: 11, color: "#A3A3A3", marginBottom: 4 }}>{semKey} GPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="e.g. 8.5"
                          value={previousGPAs[semKey] || ""}
                          onChange={(e) => setPreviousGPAs((prev) => ({ ...prev, [semKey]: e.target.value }))}
                          style={{ ...inputStyle, padding: "10px 12px", fontSize: 14 }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#D4A017", marginBottom: 4 }}>Calculated CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="Auto-calculated"
                      style={{ ...inputStyle, padding: "10px 12px", fontSize: 14, border: "1px solid rgba(212, 160, 23, 0.3)" }}
                    />
                  </div>
                </div>
              )}

              {/* ── Marks Entry (if evaluation pattern set) ── */}
              {subjects.length > 0 && ((gradingSystem === "Absolute" && evaluationPattern) || gradingSystem === "Relative") && (
                <div style={optCardStyle}>
                  <label style={{ ...labelStyle, color: "#D4A017" }}>Enter Current Marks</label>
                  <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px" }}>Skip if no assessments have happened yet.</p>

                  {subjects.map((sub) => {
                    const assessmentList = gradingSystem === "Relative"
                      ? ["Mid 1", "Mid 2", "Assignments / Quiz"]
                      : getAssessmentList();

                    return (
                      <div key={sub.id} style={{ backgroundColor: "#171717", border: "1px solid #2B2B2B", borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA", marginBottom: 12 }}>{sub.name}</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {assessmentList.map((item) => {
                            const itemState = marks[sub.id]?.[item] || { mode: "Not Attempted", obtained: "", max: getDefaultMaxMarks(item) };
                            const isAttempted = itemState.mode === "Enter Marks";

                            return (
                              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, color: "#A3A3A3", minWidth: 110 }}>{item}</span>
                                <div style={{ display: "flex", gap: 4, backgroundColor: "#111111", padding: 2, borderRadius: 6, border: "1px solid #2B2B2B" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkChange(sub.id, item, "mode", "Not Attempted")}
                                    style={{
                                      padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer",
                                      backgroundColor: !isAttempted ? "#2B2B2B" : "transparent",
                                      color: !isAttempted ? "#FAFAFA" : "#A3A3A3",
                                    }}
                                  >
                                    Skip
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkChange(sub.id, item, "mode", "Enter Marks")}
                                    style={{
                                      padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                                      backgroundColor: isAttempted ? "#D4A017" : "transparent",
                                      color: isAttempted ? "#0A0A0A" : "#A3A3A3",
                                    }}
                                  >
                                    Enter
                                  </button>
                                </div>
                                {isAttempted && (
                                  <>
                                    <input
                                      type="number"
                                      value={itemState.obtained || ""}
                                      onChange={(e) => handleMarkChange(sub.id, item, "obtained", e.target.value)}
                                      placeholder="Got"
                                      style={{ ...inputStyle, width: 70, padding: "6px 8px", fontSize: 13 }}
                                    />
                                    <span style={{ color: "#555", fontSize: 13 }}>/</span>
                                    <input
                                      type="number"
                                      value={itemState.max || ""}
                                      onChange={(e) => handleMarkChange(sub.id, item, "max", e.target.value)}
                                      placeholder="Max"
                                      style={{ ...inputStyle, width: 70, padding: "6px 8px", fontSize: 13 }}
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}

                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                            <span style={{ fontSize: 12, color: "#A3A3A3", minWidth: 110 }}>Attendance %</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={marks[sub.id]?.attendance || ""}
                              onChange={(e) => handleAttendanceChange(sub.id, e.target.value)}
                              placeholder="e.g. 88"
                              style={{ ...inputStyle, width: 90, padding: "6px 8px", fontSize: 13 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Goals ── */}
              <div style={optCardStyle}>
                <label style={{ ...labelStyle, color: "#D4A017" }}>Semester Goals</label>
                <p style={{ fontSize: 13, color: "#666", margin: "0 0 14px" }}>Select what you want to achieve.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
                  {GOAL_CARDS.map((g) => {
                    const selected = selectedGoals.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGoals((prev) => selected ? prev.filter((id) => id !== g.id) : [...prev, g.id])}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          backgroundColor: selected ? "rgba(212, 160, 23, 0.1)" : "#171717",
                          border: selected ? "1.5px solid #D4A017" : "1px solid #2B2B2B",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{g.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#FAFAFA" : "#A3A3A3" }}>{g.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#A3A3A3", marginBottom: 4 }}>Target SGPA</label>
                    <input
                      type="number" step="0.1" placeholder="e.g. 9.2"
                      value={targetSGPA} onChange={(e) => setTargetSGPA(e.target.value)}
                      style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#A3A3A3", marginBottom: 4 }}>Target CGPA</label>
                    <input
                      type="number" step="0.1" placeholder="e.g. 9.0"
                      value={targetCGPA} onChange={(e) => setTargetCGPA(e.target.value)}
                      style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#A3A3A3", marginBottom: 4 }}>Daily Study Hrs</label>
                    <input
                      type="number" placeholder="e.g. 3"
                      value={studyHours} onChange={(e) => setStudyHours(e.target.value)}
                      style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ SUBMIT ═══════════════ */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 20px rgba(212, 160, 23, 0.3)",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s ease",
              marginTop: 8,
            }}
          >
            {saving ? "Setting up..." : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
