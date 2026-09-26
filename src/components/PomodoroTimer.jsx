import React, { useState, useEffect, useRef, useCallback } from "react";

export default function PomodoroTimer({ onComplete, subjectName }) {
  const [duration, setDuration] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null);

  const totalSeconds = selectedMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (secondsLeft === 0 && !isRunning && startTimeRef.current) {
      const actualMinutes = Math.round(
        (Date.now() - startTimeRef.current) / 60000
      );
      onComplete?.({
        plannedMinutes: selectedMinutes,
        actualMinutes: Math.max(actualMinutes, selectedMinutes),
      });
      startTimeRef.current = null;
    }
  }, [secondsLeft, isRunning, onComplete, selectedMinutes]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  };

  const handlePause = () => {
    pausedAtRef.current = Date.now();
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleEnd = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    const elapsed = totalSeconds - secondsLeft;
    const actualMinutes = Math.max(Math.round(elapsed / 60), 1);
    onComplete?.({
      plannedMinutes: selectedMinutes,
      actualMinutes,
    });
    startTimeRef.current = null;
  };

  const handleExtend = (extraMinutes) => {
    setSecondsLeft((prev) => prev + extraMinutes * 60);
  };

  const handleDurationChange = (mins) => {
    if (isRunning) return;
    setSelectedMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Duration Selector */}
      {!isRunning && secondsLeft === totalSeconds && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => handleDurationChange(m)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor:
                  selectedMinutes === m
                    ? "rgba(212, 160, 23, 0.15)"
                    : "#161616",
                border:
                  selectedMinutes === m
                    ? "1px solid #D4A017"
                    : "1px solid #282828",
                color: selectedMinutes === m ? "#D4A017" : "#888",
                fontWeight: selectedMinutes === m ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {m} min
            </button>
          ))}
        </div>
      )}

      {/* Circular Timer */}
      <div
        style={{
          position: "relative",
          width: 220,
          height: 220,
          marginBottom: 28,
        }}
      >
        <svg
          width="220"
          height="220"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="#1C1C1C"
            strokeWidth="8"
          />
          <circle
            cx="110"
            cy="110"
            r="90"
            fill="none"
            stroke="#D4A017"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 48,
              fontWeight: 700,
              color: "#FAFAFA",
              letterSpacing: "0.02em",
            }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          {subjectName && (
            <span
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 4,
                maxWidth: 160,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subjectName}
            </span>
          )}
        </div>
      </div>

      {/* Main Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {!isRunning && secondsLeft === totalSeconds ? (
          <button
            onClick={handleStart}
            style={{
              padding: "14px 36px",
              borderRadius: 12,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ▶ Start Session
          </button>
        ) : (
          <>
            <button
              onClick={isRunning ? handlePause : handleResume}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                backgroundColor: isRunning
                  ? "rgba(239, 68, 68, 0.15)"
                  : "#D4A017",
                color: isRunning ? "#EF4444" : "#0A0A0A",
                fontWeight: 700,
                fontSize: 14,
                border: isRunning ? "1px solid rgba(239, 68, 68, 0.3)" : "none",
                cursor: "pointer",
              }}
            >
              {isRunning ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button
              onClick={handleEnd}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                backgroundColor: "transparent",
                color: "#EF4444",
                fontWeight: 700,
                fontSize: 14,
                border: "1px solid rgba(239, 68, 68, 0.3)",
                cursor: "pointer",
              }}
            >
              ⏹ End Session
            </button>
          </>
        )}
      </div>

      {/* Extend Buttons */}
      {isRunning && (
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#666", alignSelf: "center", marginRight: 4 }}>
            Extend:
          </span>
          {[5, 10, 25].map((m) => (
            <button
              key={m}
              onClick={() => handleExtend(m)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: "#161616",
                border: "1px solid #282828",
                color: "#D4A017",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              +{m}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
