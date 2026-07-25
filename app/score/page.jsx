"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Demo Data ──────────────────────────────────────────────────────────────────
const demoResumeScore = {
  score: 72,
  rating: "Great",
  name: "John Doe",
  role: "Frontend Developer",
  totalSections: 8,
  completedSections: 5,
  strengths: [
    "Clear work experience section",
    "Relevant technical skills listed",
    "Education details present",
  ],
  improvements: [
    {
      id: 1,
      section: "Professional Summary",
      priority: "high",
      issue: "Missing professional summary section",
      fix: "Add a 2-3 line summary at top highlighting your expertise",
    },
    {
      id: 2,
      section: "Experience",
      priority: "high",
      issue: "Work experience descriptions are vague",
      fix: "Use quantifiable achievements (e.g. Led team of 5, increased performance by 40%)",
    },
    {
      id: 3,
      section: "Projects",
      priority: "medium",
      issue: "No projects section found",
      fix: "Add 2-3 relevant projects with tech stack and your role",
    },
    {
      id: 4,
      section: "Skills",
      priority: "medium",
      issue: "Skills not categorized",
      fix: "Group skills into Frontend, Backend, Tools categories",
    },
    {
      id: 5,
      section: "Certifications",
      priority: "low",
      issue: "No certifications listed",
      fix: "Add relevant certifications to boost credibility",
    },
  ],
  extractedSkills: ["React", "JavaScript", "Node.js", "Python", "SQL", "Git"],
  education: "B.Tech Computer Science — 2022",
  experience: "2 Years",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function getRatingConfig(score) {
  if (score <= 40) return { label: "Needs Work", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.40)", ring: "#ef4444" };
  if (score <= 70) return { label: "Good",       color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.40)", ring: "#f59e0b" };
  if (score <= 85) return { label: "Great",      color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.40)", ring: "#3b82f6" };
  return              { label: "Excellent",  color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.40)",  ring: "#22c55e" };
}

function getPriorityConfig(priority) {
  if (priority === "high")   return { dot: "🔴", label: "High",   border: "#ef4444", text: "#f87171", bg: "rgba(239,68,68,0.06)" };
  if (priority === "medium") return { dot: "🟡", label: "Medium", border: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.06)" };
  return                            { dot: "🟢", label: "Low",    border: "#22c55e", text: "#4ade80", bg: "rgba(34,197,94,0.06)" };
}

// ── Animated Score Ring ────────────────────────────────────────────────────────
function ScoreRing({ targetScore, ratingConfig }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [strokeDash, setStrokeDash] = useState(0);
  const duration = 1500; // ms
  const size = 176;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * targetScore));
      setStrokeDash(eased * (targetScore / 100) * circumference);
      if (progress < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [targetScore, circumference]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-30 transition-opacity duration-700"
        style={{ background: ratingConfig.ring }}
      />
      {/* SVG ring */}
      <svg width={size} height={size} className="relative z-10 -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={ratingConfig.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          style={{
            filter: `drop-shadow(0 0 8px ${ratingConfig.ring})`,
            transition: "stroke-dashoffset 16ms linear",
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-5xl font-bold text-white tabular-nums leading-none">
          {displayScore}
        </span>
        <span className="text-sm text-[rgba(255,255,255,0.40)] mt-1 font-medium tracking-widest uppercase">
          / 100
        </span>
      </div>
    </div>
  );
}

// ── Section wrapper with fade-in-up ───────────────────────────────────────────
function FadeSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
    >
      {children}
    </div>
  );
}

// ── Improvement Card ───────────────────────────────────────────────────────────
function ImprovementCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const p = getPriorityConfig(item.priority);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer"
      style={{
        background: "rgba(14,14,24,0.65)",
        borderColor: "rgba(139,92,246,0.20)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.50), 0 0 20px rgba(139,92,246,0.06)",
      }}
      aria-expanded={expanded}
    >
      {/* Left accent bar + content */}
      <div className="flex">
        {/* Priority bar */}
        <div
          className="w-1 flex-shrink-0 rounded-l-2xl"
          style={{ background: p.border }}
        />

        <div className="flex-1 p-4">
          {/* Top row */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{p.dot}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: p.bg, color: p.text, border: `1px solid ${p.border}` }}
              >
                {p.label}
              </span>
              <span className="text-sm font-bold text-white">{item.section}</span>
            </div>
            {/* Expand chevron */}
            <svg
              className="w-4 h-4 flex-shrink-0 text-[rgba(255,255,255,0.35)] transition-transform duration-300"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              viewBox="0 0 16 16" fill="none"
            >
              <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Issue */}
          <p className="text-sm text-[rgba(255,255,255,0.50)] leading-snug">
            {item.issue}
          </p>

          {/* Fix — expandable */}
          <div
            style={{
              maxHeight: expanded ? "120px" : "0",
              opacity: expanded ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease, opacity 0.3s ease",
            }}
          >
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)]">
              <p className="text-sm text-[#a855f7] italic leading-relaxed">
                💡 {item.fix}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ScorePage() {
  const router = useRouter();
  const data = demoResumeScore;
  const ratingConfig = getRatingConfig(data.score);

  return (
    <div className="min-h-screen relative flex flex-col bg-[#080808]">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── 1. Header ─────────────────────────────────────────────────────── */}
        <FadeSection delay={0}>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.push("/processing")}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.10)]
                bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.65)] hover:text-white
                hover:border-[rgba(139,92,246,0.50)] hover:bg-[rgba(139,92,246,0.10)]
                transition-all duration-300"
              aria-label="Go back"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M10 13 L5 8 L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Resume Analysis</h1>
              <p className="text-xs text-[rgba(255,255,255,0.40)]">Here&apos;s how your resume performs</p>
            </div>
          </div>
        </FadeSection>

        {/* ── 2. Score Card ─────────────────────────────────────────────────── */}
        <FadeSection delay={100}>
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(14,14,24,0.72)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(139,92,246,0.45)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.75), 0 0 60px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Ring */}
            <div className="flex flex-col items-center">
              <ScoreRing targetScore={data.score} ratingConfig={ratingConfig} />

              {/* Rating badge */}
              <div
                className="mt-4 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide"
                style={{
                  background: ratingConfig.bg,
                  border: `1px solid ${ratingConfig.border}`,
                  color: ratingConfig.color,
                  boxShadow: `0 0 18px ${ratingConfig.color}22`,
                }}
              >
                {ratingConfig.label}
              </div>

              {/* Name + Role */}
              <p className="mt-3 text-base font-semibold text-white">{data.name}</p>
              <p className="text-sm text-[rgba(255,255,255,0.45)]">{data.role}</p>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-[rgba(255,255,255,0.07)]" />

            {/* Stat pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <StatPill
                label={`${data.extractedSkills.length} Skills Found`}
                color="#a855f7"
                bg="rgba(168,85,247,0.10)"
                border="rgba(168,85,247,0.35)"
              />
              <StatPill
                label={`${data.completedSections}/${data.totalSections} Sections`}
                color="#3b82f6"
                bg="rgba(59,130,246,0.10)"
                border="rgba(59,130,246,0.35)"
              />
              <StatPill
                label={`${data.experience} Exp`}
                color="#8b5cf6"
                bg="rgba(139,92,246,0.10)"
                border="rgba(139,92,246,0.35)"
              />
            </div>
          </div>
        </FadeSection>

        {/* ── 3. Strengths ──────────────────────────────────────────────────── */}
        <FadeSection delay={200}>
          <SectionTitle>✅ What&apos;s Working Well</SectionTitle>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(14,24,18,0.70)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(34,197,94,0.25)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.60), 0 0 30px rgba(34,197,94,0.08)",
            }}
          >
            <div className="flex flex-col gap-3">
              {data.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.50)" }}
                  >
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                      <path d="M2 6 L5 9 L10 3" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-[rgba(255,255,255,0.80)] leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── 4. Improvements ───────────────────────────────────────────────── */}
        <FadeSection delay={300}>
          <SectionTitle>⚠️ Areas to Improve</SectionTitle>
          <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3 -mt-2">
            Click a card to see how to fix it
          </p>
          <div className="flex flex-col gap-3">
            {data.improvements.map((item) => (
              <ImprovementCard key={item.id} item={item} />
            ))}
          </div>
        </FadeSection>

        {/* ── 5. Extracted Skills ───────────────────────────────────────────── */}
        <FadeSection delay={400}>
          <SectionTitle>🛠️ Extracted Skills</SectionTitle>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(14,14,24,0.65)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(139,92,246,0.22)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 0 24px rgba(139,92,246,0.07)",
            }}
          >
            <div className="flex flex-wrap gap-2">
              {data.extractedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold cursor-default
                    transition-all duration-300 hover:scale-105"
                  style={{
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.40)",
                    color: "#c4b5fd",
                    boxShadow: "0 0 0 rgba(139,92,246,0)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 14px rgba(139,92,246,0.40)";
                    e.currentTarget.style.background = "rgba(139,92,246,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 0 rgba(139,92,246,0)";
                    e.currentTarget.style.background = "rgba(139,92,246,0.12)";
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── 6. Action Buttons ─────────────────────────────────────────────── */}
        <FadeSection delay={500}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(14,14,24,0.65)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(139,92,246,0.22)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Fix Issues */}
              <button
                onClick={() => router.push("/editor")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-white text-sm font-semibold transition-all duration-300
                  hover:-translate-y-1"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 36px rgba(124,58,237,0.60), 0 0 50px rgba(124,58,237,0.20)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)";
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M11.5 2.5 L13.5 4.5 L5 13 L2 14 L3 11 Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 4.5 L11.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Fix Issues
              </button>

              {/* Skip & Find Jobs */}
              <button
                onClick={() => router.push("/jobs")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  text-sm font-semibold transition-all duration-300
                  hover:-translate-y-1"
                style={{
                  border: "1px solid rgba(139,92,246,0.50)",
                  color: "#a855f7",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(139,92,246,0.14)";
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(139,92,246,0.22)";
                  e.currentTarget.style.borderColor = "rgba(168,85,247,0.70)";
                  e.currentTarget.style.color = "#c4b5fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.50)";
                  e.currentTarget.style.color = "#a855f7";
                }}
              >
                Skip &amp; Find Jobs
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Hint text */}
            <p className="text-center text-xs text-[rgba(255,255,255,0.30)] mt-3">
              Fixing issues improves your job match score
            </p>
          </div>
        </FadeSection>

        {/* Bottom spacer */}
        <div className="h-4" />
      </main>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-bold text-white mb-3">{children}</h2>
  );
}

function StatPill({ label, color, bg, border }) {
  return (
    <div
      className="px-4 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {label}
    </div>
  );
}
