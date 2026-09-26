import React from "react";

const GOLD = "#D4A017";

const s = {
  card: {
    backgroundColor: "#111111",
    border: "1px solid #2B2B2B",
    borderRadius: 20,
    padding: 24,
  },
  bar: (w, h = 14, r = 6) => ({ width: w, height: h, borderRadius: r, backgroundColor: "#1C1C1C", animation: "skeleton-pulse 1.6s ease-in-out infinite" }),
  circle: (size) => ({ width: size, height: size, borderRadius: "50%", backgroundColor: "#1C1C1C", animation: "skeleton-pulse 1.6s ease-in-out infinite", flexShrink: 0 }),
};

/* ─── Generic Building Blocks ─── */
export function SkelBar({ w = "100%", h = 14, r = 6, style }) {
  return <div style={{ ...s.bar(w, h, r), ...style }} />;
}

export function SkelCircle({ size = 40, style }) {
  return <div style={{ ...s.circle(size), ...style }} />;
}

/* ─── Subject / Course Card ─── */
export function SubjectCardSkeleton() {
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SkelCircle size={40} />
          <div>
            <SkelBar w={120} h={16} />
            <SkelBar w={80} h={11} style={{ marginTop: 8 }} />
          </div>
        </div>
        <SkelBar w={50} h={22} r={100} />
      </div>
      <SkelBar w="100%" h={8} r={100} style={{ marginBottom: 14 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <SkelBar w={70} h={12} />
        <SkelBar w={50} h={12} />
      </div>
    </div>
  );
}

/* ─── Stats Row (3-5 stat cards) ─── */
export function StatsRowSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16, marginBottom: 28 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={s.card}>
          <SkelBar w={90} h={12} />
          <SkelBar w={60} h={28} r={6} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Page Header ─── */
export function PageHeaderSkeleton() {
  return (
    <div style={{ marginBottom: 32 }}>
      <SkelBar w={140} h={12} />
      <SkelBar w={260} h={30} r={8} style={{ marginTop: 10 }} />
      <SkelBar w={340} h={14} style={{ marginTop: 8 }} />
    </div>
  );
}

/* ─── List Item Row ─── */
export function ListItemSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 14 }}>
      <SkelBar w={18} h={18} r={4} />
      <div style={{ flex: 1 }}>
        <SkelBar w="60%" h={14} />
        <SkelBar w="35%" h={11} style={{ marginTop: 8 }} />
      </div>
      <SkelBar w={60} h={24} r={6} />
    </div>
  );
}

/* ─── Tab Bar ─── */
export function TabBarSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkelBar key={i} w={80 + i * 10} h={34} r={100} />
      ))}
    </div>
  );
}

/* ─── Form Card ─── */
export function FormCardSkeleton({ fields = 3 }) {
  return (
    <div style={s.card}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: i < fields - 1 ? 20 : 0 }}>
          <SkelBar w={100} h={11} style={{ marginBottom: 8 }} />
          <SkelBar w="100%" h={42} r={10} />
        </div>
      ))}
    </div>
  );
}

/* ─── Chat Bubble Skeleton ─── */
export function ChatBubbleSkeleton({ align = "left" }) {
  return (
    <div style={{ display: "flex", justifyContent: align === "left" ? "flex-start" : "flex-end", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: align === "right" ? "row-reverse" : "row", maxWidth: "70%" }}>
        <SkelCircle size={32} />
        <div style={{ backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 16, padding: "14px 18px" }}>
          <SkelBar w={180} h={13} />
          <SkelBar w={120} h={13} style={{ marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Note Card ─── */
export function NoteCardSkeleton() {
  return (
    <div style={{ backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 16, padding: 20 }}>
      <SkelBar w={70} h={10} style={{ marginBottom: 10 }} />
      <SkelBar w="75%" h={16} style={{ marginBottom: 10 }} />
      <SkelBar w="100%" h={12} />
      <SkelBar w="90%" h={12} style={{ marginTop: 6 }} />
    </div>
  );
}

/* ─── Resource Card ─── */
export function ResourceCardSkeleton() {
  return (
    <div style={{ backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 16, padding: 20 }}>
      <SkelBar w={60} h={10} style={{ marginBottom: 10 }} />
      <SkelBar w="80%" h={15} style={{ marginBottom: 8 }} />
      <SkelBar w="50%" h={12} />
    </div>
  );
}

/* ─── Expandable History Card ─── */
export function HistoryCardSkeleton() {
  return (
    <div style={{ backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 16, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <SkelCircle size={36} />
        <div style={{ flex: 1 }}>
          <SkelBar w="55%" h={14} />
          <SkelBar w="30%" h={11} style={{ marginTop: 8 }} />
        </div>
        <SkelBar w={55} h={22} r={100} />
      </div>
    </div>
  );
}

/* ─── Calendar Skeleton ─── */
export function CalendarSkeleton() {
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <SkelBar w={100} h={32} r={8} />
        <SkelBar w={140} h={18} />
        <SkelBar w={100} h={32} r={8} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} style={{ height: 48, borderRadius: 8, backgroundColor: "#0D0D0D" }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Exam Card ─── */
export function ExamCardSkeleton() {
  return (
    <div style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <SkelBar w={160} h={18} />
          <SkelBar w={100} h={12} style={{ marginTop: 8 }} />
        </div>
        <SkelBar w={80} h={28} r={8} />
      </div>
      <SkelBar w="100%" h={12} />
      <SkelBar w="60%" h={12} style={{ marginTop: 8 }} />
    </div>
  );
}

/* ─── Workspace Tab Content ─── */
export function WorkspaceOverviewSkeleton() {
  return (
    <div>
      <StatsRowSkeleton count={5} />
      <div style={s.card}>
        <SkelBar w={100} h={14} style={{ marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid #2B2B2B" : "none" }}>
            <SkelBar w={120} h={13} />
            <SkelBar w={50} h={13} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Full Page Loading Wrapper ─── */
export function PageSkeleton({ children }) {
  return (
    <div style={{ padding: "48px 32px", maxWidth: 980, margin: "0 auto" }}>
      {children}
    </div>
  );
}

/* ─── Gamification Widget Skeleton ─── */
export function GamificationWidgetSkeleton() {
  return (
    <div style={{ backgroundColor: "#111111", border: "1px solid #2B2B2B", borderRadius: 16, padding: 20 }}>
      <SkelBar w={80} h={12} style={{ marginBottom: 14 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <SkelCircle size={32} />
        <div style={{ flex: 1 }}>
          <SkelBar w="100%" h={6} r={100} />
          <SkelBar w={60} h={10} style={{ marginTop: 4 }} />
        </div>
      </div>
      <SkelBar w="100%" h={1} r={0} style={{ marginBottom: 14 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SkelBar w={20} h={20} r={100} />
        <SkelBar w={30} h={16} r={6} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, backgroundColor: "#0D0D0D" }}>
            <SkelBar w={30} h={16} r={4} style={{ margin: "0 auto" }} />
            <SkelBar w={40} h={10} r={4} style={{ margin: "4px auto 0" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Achievement Badge Skeleton ─── */
export function AchievementBadgeSkeleton() {
  return (
    <div style={{ backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
      <SkelCircle size={40} style={{ margin: "0 auto 10px" }} />
      <SkelBar w={80} h={13} r={6} style={{ margin: "0 auto 6px" }} />
      <SkelBar w={60} h={10} r={6} style={{ margin: "0 auto 8px" }} />
      <SkelBar w={50} h={20} r={6} style={{ margin: "0 auto" }} />
    </div>
  );
}

/* ─── Weak Areas Page Skeleton ─── */
export function WeakAreasSkeleton() {
  return (
    <div>
      <SkelBar w={80} h={14} r={6} style={{ marginBottom: 8 }} />
      <SkelBar w={200} h={28} r={8} style={{ marginBottom: 6 }} />
      <SkelBar w={300} h={14} r={6} style={{ marginBottom: 28 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
            <SkelBar w={60} h={10} r={4} style={{ margin: "0 auto 8px" }} />
            <SkelBar w={40} h={18} r={6} style={{ margin: "0 auto" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
          <SkelBar w={120} h={12} r={4} style={{ marginBottom: 16 }} />
          <div style={{ height: 240, backgroundColor: "#0D0D0D", borderRadius: 12 }} />
        </div>
        <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
          <SkelBar w={140} h={12} r={4} style={{ marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <SkelBar w={100} h={12} r={4} />
                <SkelBar w={30} h={12} r={4} />
              </div>
              <SkelBar w="100%" h={6} r={3} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <SkelBar w={160} h={16} r={6} style={{ marginBottom: 6 }} />
            <SkelBar w={260} h={12} r={4} />
          </div>
          <SkelBar w={100} h={36} r={10} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C", marginBottom: 12 }}>
            <SkelBar w={180} h={14} r={4} style={{ marginBottom: 10 }} />
            <SkelBar w="90%" h={10} r={4} style={{ marginBottom: 6 }} />
            <SkelBar w="70%" h={10} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}
