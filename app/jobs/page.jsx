"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Demo Data ──────────────────────────────────────────────────────────────────
const demoJobs = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechCorp India",
    location: "Mumbai, Maharashtra",
    type: "Full-time",
    mode: "Hybrid",
    matchScore: 94,
    salary: "₹8-12 LPA",
    postedAt: "2 days ago",
    skills: ["React", "JavaScript", "Tailwind CSS", "Next.js"],
    description:
      "We are looking for a skilled Frontend Developer to join our growing team. You will be responsible for building responsive web applications...",
    applyUrl: "https://example.com/job1",
    source: "LinkedIn",
  },
  {
    id: 2,
    title: "Full Stack Developer",
    company: "Startup XYZ",
    location: "Bangalore, Karnataka",
    type: "Full-time",
    mode: "Remote",
    matchScore: 88,
    salary: "₹10-15 LPA",
    postedAt: "3 days ago",
    skills: ["Node.js", "React", "MongoDB", "Express"],
    description:
      "Join our fast-growing startup as a Full Stack Developer. Work on cutting-edge products used by millions...",
    applyUrl: "https://example.com/job2",
    source: "Naukri",
  },
  {
    id: 3,
    title: "React Developer",
    company: "Digital Solutions Pvt Ltd",
    location: "Hyderabad, Telangana",
    type: "Full-time",
    mode: "Onsite",
    matchScore: 85,
    salary: "₹6-10 LPA",
    postedAt: "5 days ago",
    skills: ["React", "Redux", "JavaScript", "REST APIs"],
    description:
      "Looking for an experienced React Developer to build and maintain web applications for our enterprise clients...",
    applyUrl: "https://example.com/job3",
    source: "Indeed",
  },
  {
    id: 4,
    title: "JavaScript Developer",
    company: "WebAgency Co",
    location: "Pune, Maharashtra",
    type: "Contract",
    mode: "Remote",
    matchScore: 79,
    salary: "₹5-8 LPA",
    postedAt: "1 week ago",
    skills: ["JavaScript", "Vue.js", "Node.js", "CSS3"],
    description:
      "We need a JavaScript Developer for a 6-month contract project. Experience with modern JS frameworks required...",
    applyUrl: "https://example.com/job4",
    source: "LinkedIn",
  },
  {
    id: 5,
    title: "Software Engineer — Frontend",
    company: "MNC Solutions",
    location: "Chennai, Tamil Nadu",
    type: "Full-time",
    mode: "Hybrid",
    matchScore: 76,
    salary: "₹12-18 LPA",
    postedAt: "1 week ago",
    skills: ["React", "TypeScript", "GraphQL", "AWS"],
    description:
      "Join our engineering team to build world-class frontend solutions. We value innovation and technical excellence...",
    applyUrl: "https://example.com/job5",
    source: "Adzuna",
  },
  {
    id: 6,
    title: "UI Developer",
    company: "DesignTech Studio",
    location: "Delhi, NCR",
    type: "Full-time",
    mode: "Onsite",
    matchScore: 71,
    salary: "₹4-7 LPA",
    postedAt: "2 weeks ago",
    skills: ["HTML5", "CSS3", "JavaScript", "Figma"],
    description:
      "Creative UI Developer needed for our design studio. You will work closely with designers to implement pixel-perfect interfaces...",
    applyUrl: "https://example.com/job6",
    source: "Indeed",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getMatchConfig(score) {
  if (score >= 90) return { bg: "rgba(34,197,94,0.14)",  border: "rgba(34,197,94,0.50)",  color: "#4ade80" };
  if (score >= 80) return { bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.50)", color: "#60a5fa" };
  if (score >= 70) return { bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.50)", color: "#fbbf24" };
  return               { bg: "rgba(100,100,120,0.14)", border: "rgba(100,100,120,0.40)", color: "#9ca3af" };
}

function getModeIcon(mode) {
  if (mode === "Remote") return "🏠";
  if (mode === "Hybrid") return "🔄";
  return "🏢";
}

function getInitials(company) {
  return company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function calcAvgMatch(jobs) {
  if (!jobs.length) return 0;
  return Math.round(jobs.reduce((s, j) => s + j.matchScore, 0) / jobs.length);
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, visible, color = "#4ade80", borderColor = "rgba(34,197,94,0.45)" }) {
  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white pointer-events-none max-w-[280px]"
      style={{
        background: "rgba(14,14,24,0.92)",
        border: `1px solid ${borderColor}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.65), 0 0 20px ${borderColor}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(28px)",
        transition: "opacity 0.30s ease, transform 0.30s ease",
      }}
    >
      <span style={{ color }}>{message}</span>
    </div>
  );
}

// ── Filter Pill ────────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-250"
      style={{
        background: active ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? "rgba(139,92,246,0.60)" : "rgba(255,255,255,0.10)"}`,
        color: active ? "#c4b5fd" : "rgba(255,255,255,0.50)",
      }}
    >
      {label}
    </button>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────────
function JobCard({ job, isBookmarked, onBookmark, onApply, expanded, onToggleExpand, delay }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const mc = getMatchConfig(job.matchScore);
  const visibleSkills = job.skills.slice(0, 3);
  const extraSkills = job.skills.slice(3);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? "translateY(-8px)" : "translateY(0)"
          : "translateY(20px)",
        transition: `opacity 0.45s ease ${delay}ms, transform ${visible ? "0.30s" : `0.45s ease ${delay}ms`}`,
        background: "rgba(14,14,24,0.70)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(139,92,246,0.28)",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.70), 0 0 50px rgba(139,92,246,0.22)"
          : "0 8px 32px rgba(0,0,0,0.55), 0 0 20px rgba(139,92,246,0.07)",
      }}
    >
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* ── Top Row ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}
          >
            {getInitials(job.company)}
          </div>

          {/* Title + company */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{job.title}</p>
            <p className="text-xs text-[rgba(255,255,255,0.45)] mt-0.5 truncate">{job.company}</p>
          </div>

          {/* Match + Bookmark */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color }}
            >
              {job.matchScore}% Match
            </span>
            <button
              onClick={() => onBookmark(job.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-250"
              style={{
                border: isBookmarked ? "1px solid rgba(168,85,247,0.60)" : "1px solid rgba(255,255,255,0.12)",
                background: isBookmarked ? "rgba(168,85,247,0.14)" : "transparent",
              }}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark job"}
            >
              <svg viewBox="0 0 14 16" fill="none" className="w-3.5 h-4">
                <path
                  d="M2 2 H12 A1 1 0 0 1 13 3 V14 L7 11 L1 14 V3 A1 1 0 0 1 2 2 Z"
                  stroke={isBookmarked ? "#a855f7" : "rgba(255,255,255,0.45)"}
                  strokeWidth="1.5"
                  fill={isBookmarked ? "rgba(168,85,247,0.50)" : "none"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Meta Pills ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <MetaPill>{`📍 ${job.location}`}</MetaPill>
          <MetaPill>{`${getModeIcon(job.mode)} ${job.mode}`}</MetaPill>
          <MetaPill>{`⏰ ${job.type}`}</MetaPill>
          <span className="text-xs font-semibold text-[#4ade80]">{`💰 ${job.salary}`}</span>
          <span className="text-xs text-[rgba(255,255,255,0.35)]">{`🕐 ${job.postedAt}`}</span>
        </div>

        {/* ── Skills ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs text-[rgba(255,255,255,0.40)] mb-1.5 font-medium">Required Skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(139,92,246,0.12)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  color: "#c4b5fd",
                }}
              >
                {s}
              </span>
            ))}
            {extraSkills.length > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium cursor-default"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.45)",
                }}
                title={extraSkills.join(", ")}
              >
                +{extraSkills.length} more
              </span>
            )}
          </div>
        </div>

        {/* ── Description ─────────────────────────────────────────── */}
        <div>
          <p
            className="text-xs text-[rgba(255,255,255,0.50)] leading-relaxed"
            style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: expanded ? "unset" : 2, overflow: "hidden" }}
          >
            {job.description}
          </p>
          <button
            onClick={() => onToggleExpand(job.id)}
            className="text-xs text-[#a855f7] hover:text-[#c4b5fd] mt-1 transition-colors duration-200"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)] mt-auto gap-3">
          <span className="text-xs text-[rgba(255,255,255,0.30)]">via {job.source}</span>
          <button
            onClick={() => onApply(job)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white
              transition-all duration-300 hover:-translate-y-0.5 flex-1"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#2563eb)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.60)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.35)"; }}
          >
            Apply Now
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <path d="M2 10 L10 2 M5 2 H10 V7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaPill({ children }) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        color: "rgba(255,255,255,0.60)",
      }}
    >
      {children}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterMatch, setFilterMatch] = useState("All");
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("#4ade80");
  const [toastBorder, setToastBorder] = useState("rgba(34,197,94,0.45)");

  // Visibility for entrance animations
  const [headerVisible, setHeaderVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const toastTimerRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 60);
    const t2 = setTimeout(() => setFilterVisible(true), 180);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Filtered jobs ─────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return demoJobs.filter((job) => {
      const q = searchQuery.toLowerCase();
      if (q && !job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
      if (filterMode !== "All" && job.mode !== filterMode) return false;
      if (filterType !== "All" && job.type !== filterType) return false;
      if (filterMatch === "90%+" && job.matchScore < 90) return false;
      if (filterMatch === "80%+" && job.matchScore < 80) return false;
      if (filterMatch === "70%+" && job.matchScore < 70) return false;
      return true;
    });
  }, [searchQuery, filterMode, filterType, filterMatch]);

  const hasActiveFilter = filterMode !== "All" || filterType !== "All" || filterMatch !== "All" || searchQuery !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterMode("All");
    setFilterType("All");
    setFilterMatch("All");
  };

  // ── Toast ──────────────────────────────────────────────────────────────────
  const triggerToast = useCallback((msg, color = "#4ade80", border = "rgba(34,197,94,0.45)") => {
    setToastMessage(msg);
    setToastColor(color);
    setToastBorder(border);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBookmark = (id) => {
    setBookmarkedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast("Bookmark removed", "rgba(255,255,255,0.60)", "rgba(255,255,255,0.20)");
      } else {
        next.add(id);
        triggerToast("Job bookmarked!", "#c4b5fd", "rgba(139,92,246,0.45)");
      }
      return next;
    });
  };

  const handleApply = (job) => {
    triggerToast("Opening job application...", "#60a5fa", "rgba(59,130,246,0.45)");
    setTimeout(() => window.open(job.applyUrl, "_blank"), 400);
  };

  const handleToggleExpand = (id) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const avgMatch = calcAvgMatch(demoJobs);

  // ── Panel style ────────────────────────────────────────────────────────────
  const glassPanel = {
    background: "rgba(14,14,24,0.70)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(139,92,246,0.25)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.60), 0 0 28px rgba(139,92,246,0.08)",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080808] relative">
      <AnimatedBackground />
      <Navbar />
      <Toast message={toastMessage} visible={showToast} color={toastColor} borderColor={toastBorder} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── 1. Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? "translateY(0)" : "translateY(-16px)",
            transition: "opacity 0.50s ease, transform 0.50s ease",
          }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Jobs Matched For You</h1>
          <p className="text-sm text-[rgba(255,255,255,0.40)] mb-4">
            Based on your resume analysis — sorted by match score
          </p>
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <StatBadge label={`${demoJobs.length} Jobs Found`} bg="rgba(139,92,246,0.14)" border="rgba(139,92,246,0.40)" color="#c4b5fd" />
            <StatBadge label={`Avg Match: ${avgMatch}%`} bg="rgba(59,130,246,0.14)" border="rgba(59,130,246,0.40)" color="#60a5fa" />
            <span className="text-xs text-[rgba(255,255,255,0.35)]">Updated: Just now</span>
          </div>
        </div>

        {/* ── 2. Filter Bar ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4"
          style={{
            ...glassPanel,
            opacity: filterVisible ? 1 : 0,
            transform: filterVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.45s ease, transform 0.45s ease",
          }}
        >
          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.30)]" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs or companies..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)]
                text-sm text-white placeholder:text-[rgba(255,255,255,0.25)] outline-none
                focus:border-[rgba(139,92,246,0.50)] focus:bg-[rgba(139,92,246,0.06)] transition-all duration-250"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Mode */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Mode:</span>
              {["All", "Remote", "Hybrid", "Onsite"].map((m) => (
                <FilterPill key={m} label={m} active={filterMode === m} onClick={() => setFilterMode(m)} />
              ))}
            </div>
            <div className="w-px h-4 bg-[rgba(255,255,255,0.10)]" />
            {/* Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Type:</span>
              {["All", "Full-time", "Contract"].map((t) => (
                <FilterPill key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
              ))}
            </div>
            <div className="w-px h-4 bg-[rgba(255,255,255,0.10)]" />
            {/* Match */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Match:</span>
              {["All", "90%+", "80%+", "70%+"].map((m) => (
                <FilterPill key={m} label={m} active={filterMatch === m} onClick={() => setFilterMatch(m)} />
              ))}
            </div>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-red-400 border border-[rgba(239,68,68,0.35)] px-3 py-1.5 rounded-full
                  hover:bg-[rgba(239,68,68,0.10)] transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-[rgba(255,255,255,0.35)] mt-3">
            Showing <span className="text-[#c4b5fd] font-semibold">{filteredJobs.length}</span> of {demoJobs.length} jobs
          </p>
        </div>

        {/* ── 3. Job Cards Grid ─────────────────────────────────────────────── */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job, idx) => (
              <JobCard
                key={job.id}
                job={job}
                isBookmarked={bookmarkedJobs.has(job.id)}
                onBookmark={handleBookmark}
                onApply={handleApply}
                expanded={expandedDescriptions.has(job.id)}
                onToggleExpand={handleToggleExpand}
                delay={idx * 70}
              />
            ))}
          </div>
        ) : (
          /* ── 4. No Results ──────────────────────────────────────────────── */
          <div
            className="rounded-2xl p-10 text-center"
            style={glassPanel}
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white font-semibold mb-1">No jobs found matching your filters</p>
            <p className="text-sm text-[rgba(255,255,255,0.40)] mb-5">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-250"
              style={{
                border: "1px solid rgba(139,92,246,0.50)",
                color: "#a855f7",
                background: "transparent",
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── 5. Bottom Section ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 pb-8">
          <p className="text-sm text-[rgba(255,255,255,0.35)] w-full text-center sm:w-auto">
            Showing {filteredJobs.length} of {demoJobs.length} jobs
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/score")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250 hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(139,92,246,0.45)",
                color: "#a855f7",
                background: "transparent",
              }}
            >
              ← Resume Score
            </button>
            <button
              onClick={() => router.push("/upload")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250 hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(59,130,246,0.45)",
                color: "#60a5fa",
                background: "transparent",
              }}
            >
              Upload New Resume
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────
function StatBadge({ label, bg, border, color }) {
  return (
    <span
      className="text-xs font-semibold px-3 py-1.5 rounded-full"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {label}
    </span>
  );
}
