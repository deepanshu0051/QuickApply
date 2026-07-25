"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Demo Data ──────────────────────────────────────────────────────────────────
const demoResumeText = `John Doe
john.doe@email.com | +91 98765 43210
LinkedIn: linkedin.com/in/johndoe

EXPERIENCE
Software Developer at XYZ Company (2022-2024)
- Did some work
- Made websites
- Fixed bugs

EDUCATION
B.Tech Computer Science
ABC University — 2022

SKILLS
React, JavaScript, Node.js, Python, SQL, Git`;

const demoSuggestions = [
  {
    id: 1,
    section: "Professional Summary",
    priority: "high",
    icon: "🔴",
    title: "Add Professional Summary",
    issue: "No professional summary found at the top of resume",
    suggestion: "Add this after your contact info:",
    example:
      "Results-driven Frontend Developer with 2+ years of experience building scalable web applications. Proficient in React.js, Node.js and modern JavaScript. Passionate about creating intuitive user experiences.",
    position: "After contact information (line 4)",
  },
  {
    id: 2,
    section: "Experience",
    priority: "high",
    icon: "🔴",
    title: "Strengthen Experience Descriptions",
    issue: "Current descriptions are too vague and generic",
    suggestion: "Replace current bullet points with:",
    example:
      "• Developed 5+ React.js web applications serving 10,000+ active users\n• Reduced page load time by 40% through code optimization\n• Collaborated with cross-functional team of 8 engineers",
    position: "Under EXPERIENCE section (lines 7-9)",
  },
  {
    id: 3,
    section: "Projects",
    priority: "medium",
    icon: "🟡",
    title: "Add Projects Section",
    issue: "No projects section found — this is important for developers",
    suggestion: "Add a PROJECTS section after experience:",
    example:
      "PROJECTS\nE-Commerce Platform (React, Node.js, MongoDB)\n• Built full-stack shopping app with payment integration\n• GitHub: github.com/johndoe/ecommerce",
    position: "After EXPERIENCE section",
  },
  {
    id: 4,
    section: "Skills",
    priority: "medium",
    icon: "🟡",
    title: "Categorize Your Skills",
    issue: "Skills listed without categorization",
    suggestion: "Replace skills section with:",
    example:
      "SKILLS\nFrontend: React.js, JavaScript (ES6+), HTML5, CSS3\nBackend: Node.js, Express.js, Python\nDatabase: MongoDB, PostgreSQL, SQL\nTools: Git, VS Code, Figma",
    position: "Under SKILLS section",
  },
  {
    id: 5,
    section: "Certifications",
    priority: "low",
    icon: "🟢",
    title: "Add Certifications",
    issue: "No certifications found",
    suggestion: "Add certifications section:",
    example:
      "CERTIFICATIONS\n• AWS Cloud Practitioner — Amazon (2023)\n• Meta Frontend Developer — Coursera (2022)",
    position: "After SKILLS section",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const MAX_HISTORY = 20;

function getPriorityStyle(priority) {
  if (priority === "high")
    return {
      label: "High",
      badge: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.40)", color: "#f87171" },
      glow: "0 0 28px rgba(239,68,68,0.12)",
      cardBorder: "rgba(239,68,68,0.22)",
    };
  if (priority === "medium")
    return {
      label: "Medium",
      badge: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.40)", color: "#fbbf24" },
      glow: "0 0 28px rgba(245,158,11,0.10)",
      cardBorder: "rgba(245,158,11,0.22)",
    };
  return {
    label: "Low",
    badge: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.40)", color: "#4ade80" },
    glow: "0 0 28px rgba(34,197,94,0.10)",
    cardBorder: "rgba(34,197,94,0.22)",
  };
}

function wordCount(text) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div
      className="fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white pointer-events-none"
      style={{
        background: "rgba(14,24,18,0.90)",
        border: "1px solid rgba(34,197,94,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.60), 0 0 20px rgba(34,197,94,0.18)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
        <circle cx="8" cy="8" r="7" stroke="#4ade80" strokeWidth="1.5" />
        <path d="M5 8 L7 10.5 L11 5.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}

// ── Cancel Modal ───────────────────────────────────────────────────────────────
function CancelModal({ onClose, onConfirm }) {
  return (
    <div className="processing-modal-backdrop" style={{ zIndex: 90 }}>
      <div
        className="modal-scale-in processing-modal-card border border-[rgba(239,68,68,0.40)] w-full max-w-sm p-6 text-center"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.80), 0 0 40px rgba(239,68,68,0.14)" }}
      >
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-white mb-2">Are you sure?</h2>
        <p className="text-sm text-[rgba(255,255,255,0.50)] mb-6 leading-relaxed">
          Your edits will be lost and you&apos;ll return to the score page.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.45)]
              text-red-400 text-sm font-semibold transition-all duration-300
              hover:bg-[rgba(239,68,68,0.20)] hover:shadow-[0_0_20px_rgba(239,68,68,0.20)]"
          >
            Yes, Leave
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(139,92,246,0.10)] border border-[rgba(139,92,246,0.45)]
              text-[#a855f7] text-sm font-semibold transition-all duration-300
              hover:bg-[rgba(139,92,246,0.22)] hover:shadow-[0_0_20px_rgba(139,92,246,0.20)]"
          >
            No, Stay
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Suggestion Card ────────────────────────────────────────────────────────────
function SuggestionCard({ item, isApplied, onApply, onCopy, delay }) {
  const p = getPriorityStyle(item.priority);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms, box-shadow 0.3s ease`,
        background: "rgba(14,14,24,0.68)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${p.cardBorder}`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.55), ${p.glow}`,
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">{item.icon}</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: p.badge.bg, border: `1px solid ${p.badge.border}`, color: p.badge.color }}
            >
              {p.label}
            </span>
            <span className="text-sm font-bold text-white">{item.section}</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-[rgba(255,255,255,0.85)] mb-1">{item.title}</p>

        {/* Issue */}
        <p className="text-xs text-[rgba(255,255,255,0.45)] mb-3 leading-snug">{item.issue}</p>

        <div className="border-t border-[rgba(255,255,255,0.07)] pt-3 mb-3">
          <p className="text-xs font-semibold text-[#a855f7] mb-2">{item.suggestion}</p>

          {/* Example box */}
          <div
            className="relative rounded-lg p-3"
            style={{
              background: "rgba(0,0,0,0.40)",
              borderLeft: "2px solid rgba(139,92,246,0.60)",
            }}
          >
            <pre className="text-xs text-[rgba(255,255,255,0.70)] font-mono whitespace-pre-wrap leading-relaxed pr-10">
              {item.example}
            </pre>
            {/* Copy button */}
            <button
              onClick={() => onCopy(item.example)}
              className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200
                border border-[rgba(139,92,246,0.40)] text-[#a855f7] hover:bg-[rgba(139,92,246,0.18)]"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Position hint */}
        <p className="text-xs text-[rgba(255,255,255,0.35)] mb-3">
          📍 Where: {item.position}
        </p>

        {/* Apply button */}
        <button
          onClick={() => onApply(item.id, item.example)}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all duration-300"
          style={
            isApplied
              ? {
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(34,197,94,0.50)",
                  color: "#4ade80",
                }
              : {
                  background: "transparent",
                  border: "1px solid rgba(139,92,246,0.50)",
                  color: "#a855f7",
                }
          }
        >
          {isApplied ? "✓ Applied" : "Mark as Applied"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EditorPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [resumeText, setResumeText] = useState(demoResumeText);
  const [originalText] = useState(demoResumeText);
  const [isDirty, setIsDirty] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [history, setHistory] = useState([demoResumeText]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [leftVisible, setLeftVisible] = useState(false);
  const [rightVisible, setRightVisible] = useState(false);

  const toastTimerRef = useRef(null);
  const textareaRef = useRef(null);

  // Stagger panel entrance
  useEffect(() => {
    const t1 = setTimeout(() => setLeftVisible(true), 80);
    const t2 = setTimeout(() => setRightVisible(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToastMsg = useCallback((msg) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  }, []);

  // ── Text change + history ─────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const val = e.target.value;
    setResumeText(val);
    setIsDirty(val !== originalText);

    // Push to history (trim forward history)
    setHistory((prev) => {
      const newHist = prev.slice(0, historyIndex + 1);
      const limited = newHist.length >= MAX_HISTORY ? newHist.slice(1) : newHist;
      return [...limited, val];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  };

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setResumeText(history[newIdx]);
    setIsDirty(history[newIdx] !== originalText);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setResumeText(history[newIdx]);
    setIsDirty(history[newIdx] !== originalText);
  };

  // ── Apply suggestion ───────────────────────────────────────────────────────
  const handleApply = (id, example) => {
    setAppliedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (!appliedSuggestions.includes(id)) {
      const updated = resumeText + "\n\n" + example;
      setResumeText(updated);
      setIsDirty(true);
      setHistory((prev) => {
        const newHist = prev.slice(0, historyIndex + 1);
        return [...newHist, updated].slice(-MAX_HISTORY);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    }
  };

  // ── Apply all ─────────────────────────────────────────────────────────────
  const handleApplyAll = () => {
    const allExamples = demoSuggestions.map((s) => s.example).join("\n\n");
    const updated = resumeText + "\n\n" + allExamples;
    setResumeText(updated);
    setIsDirty(true);
    setAppliedSuggestions(demoSuggestions.map((s) => s.id));
    setHistory((prev) => [...prev.slice(-MAX_HISTORY + 1), updated]);
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    showToastMsg("All suggestions applied!");
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => showToastMsg("Copied to clipboard!"));
  };

  // ── Download .txt ──────────────────────────────────────────────────────────
  const handleDownload = () => {
    const blob = new Blob([resumeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToastMsg("Resume downloaded successfully!");
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancelConfirm = () => router.push("/score");

  // ── Counts ────────────────────────────────────────────────────────────────
  const words = wordCount(resumeText);
  const appliedCount = appliedSuggestions.length;

  // ── Panel shared style ────────────────────────────────────────────────────
  const panelBase = {
    background: "rgba(14,14,24,0.72)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(139,92,246,0.30)",
    boxShadow: "0 16px 56px rgba(0,0,0,0.70), 0 0 40px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080808] relative">
      <AnimatedBackground />
      <Navbar />

      {/* Toast */}
      <Toast message={toastMessage} visible={showToast} />

      {/* Split editor area — fills remaining height */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 pb-[76px] min-h-0">

        {/* ── LEFT: Editor Panel ─────────────────────────────────────── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden order-2 md:order-1 flex-1 min-h-[420px] md:min-h-0"
          style={{
            ...panelBase,
            opacity: leftVisible ? 1 : 0,
            transform: leftVisible ? "translateX(0)" : "translateX(-28px)",
            transition: "opacity 0.50s ease, transform 0.50s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: "rgba(139,92,246,0.25)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Your Resume</span>
              {isDirty && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(168,85,247,0.14)",
                    border: "1px solid rgba(168,85,247,0.45)",
                    color: "#c4b5fd",
                  }}
                >
                  Edited
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[rgba(255,255,255,0.35)]">{words} words</span>
              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.10)]
                  text-[rgba(255,255,255,0.50)] hover:text-white hover:border-[rgba(139,92,246,0.45)]
                  transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Undo"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                  <path d="M2 5 H8 A4 4 0 1 1 4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 2 L2 5 L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Redo */}
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.10)]
                  text-[rgba(255,255,255,0.50)] hover:text-white hover:border-[rgba(139,92,246,0.45)]
                  transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
                title="Redo"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                  <path d="M12 5 H6 A4 4 0 1 0 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2 L12 5 L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={resumeText}
            onChange={handleTextChange}
            placeholder="Your resume content will appear here..."
            className="flex-1 w-full resize-none bg-transparent text-white font-mono text-sm leading-relaxed
              p-4 outline-none placeholder:text-[rgba(255,255,255,0.20)]"
            spellCheck={false}
          />
        </div>

        {/* ── RIGHT: Suggestions Panel ────────────────────────────────── */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden order-1 md:order-2 flex-1 min-h-[320px] md:min-h-0"
          style={{
            ...panelBase,
            opacity: rightVisible ? 1 : 0,
            transform: rightVisible ? "translateX(0)" : "translateX(28px)",
            transition: "opacity 0.50s ease, transform 0.50s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: "rgba(139,92,246,0.25)" }}
          >
            <span className="text-sm font-bold text-white">AI Suggestions</span>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{
                  background: "rgba(139,92,246,0.14)",
                  border: "1px solid rgba(139,92,246,0.40)",
                  color: "#c4b5fd",
                }}
              >
                {demoSuggestions.length} suggestions
              </span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: appliedCount > 0 ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${appliedCount > 0 ? "rgba(34,197,94,0.40)" : "rgba(255,255,255,0.12)"}`,
                  color: appliedCount > 0 ? "#4ade80" : "rgba(255,255,255,0.40)",
                }}
              >
                {appliedCount}/{demoSuggestions.length} applied
              </span>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {demoSuggestions.map((item, idx) => (
              <SuggestionCard
                key={item.id}
                item={item}
                isApplied={appliedSuggestions.includes(item.id)}
                onApply={handleApply}
                onCopy={handleCopy}
                delay={idx * 80}
              />
            ))}

            {/* Apply All button */}
            <button
              onClick={handleApplyAll}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300
                hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 32px rgba(124,58,237,0.55)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,58,237,0.35)"; }}
            >
              ⚡ Apply All Suggestions to Editor
            </button>

            {/* Bottom spacer */}
            <div className="h-2" />
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ───────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3"
        style={{
          background: "rgba(10,10,18,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(139,92,246,0.30)",
          boxShadow: "0 -4px 30px rgba(139,92,246,0.10)",
        }}
      >
        {/* Cancel */}
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
            border border-[rgba(239,68,68,0.45)] text-red-400
            hover:bg-[rgba(239,68,68,0.10)] hover:shadow-[0_0_18px_rgba(239,68,68,0.18)]"
        >
          Cancel
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
            text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.55)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,58,237,0.35)"; }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M8 2 L8 10 M5 7 L8 10 L11 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 13 H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Download Resume
        </button>

        {/* Find Jobs */}
        <button
          onClick={() => router.push("/jobs")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl
            text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
            boxShadow: "0 4px 18px rgba(37,99,235,0.35)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.55)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(37,99,235,0.35)"; }}
        >
          Find Matching Jobs
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
}
