import React from "react";

export default function Logo({ size = 38, className = "" }) {
  return (
    <img
      src="/image.png"
      alt="StudyBuddy"
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}
