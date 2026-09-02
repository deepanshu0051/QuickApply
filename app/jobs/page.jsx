"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Live Data Setup (demoJobs removed) ──────────────────────────────────────────

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

function LocationPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap"
      style={{
        background: active ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.10)"}`,
        color: active ? "#ffffff" : "rgba(255,255,255,0.70)",
        boxShadow: active ? "0 4px 16px rgba(124,58,237,0.35)" : "none",
      }}
      onMouseEnter={(e) => { 
        if (active) e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.60)"; 
        else e.currentTarget.style.background = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => { 
        if (active) e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.35)"; 
        else e.currentTarget.style.background = "rgba(255,255,255,0.05)";
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
function JobsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read rid from URL, fallback to localStorage
  const ridParam = searchParams.get("rid") || "";
  const rid = ridParam || (typeof window !== "undefined" ? localStorage.getItem("quickapply_resume_id") : "") || "";
  useEffect(() => {
    if (rid) {
      localStorage.setItem("quickapply_resume_id", rid);
    }
  }, [rid]);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterMatch, setFilterMatch] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedJobs, setBookmarkedJobs] = useState(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("#4ade80");
  const [toastBorder, setToastBorder] = useState("rgba(34,197,94,0.45)");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Visibility for entrance animations
  const [headerVisible, setHeaderVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const toastTimerRef = useRef(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        let query = "Software Developer";
        
        // Try to get role from resume analysis if rid exists
        if (rid && typeof window !== "undefined") {
          const localAnalysis = localStorage.getItem("quickapply_analysis");
          if (localAnalysis) {
            try {
              const analysis = JSON.parse(localAnalysis);
              if (analysis.role && analysis.role !== "Unknown") {
                query = analysis.role;
              }
            } catch (e) {}
          }
        }

        const res = await fetch(`/api/jobs?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch jobs");
        }
        
        setJobs(json.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [rid]);

  // Reset client page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, filterType, filterMatch, locationFilter]);

  useEffect(() => {
    if (!loading && !error) {
      const t1 = setTimeout(() => setHeaderVisible(true), 60);
      const t2 = setTimeout(() => setFilterVisible(true), 180);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [loading, error]);

  // ── Unique Locations ──────────────────────────────────────────────────────
  const uniqueLocations = useMemo(() => {
    const locs = new Set(jobs.map(j => j.location));
    return ["All Locations", ...Array.from(locs).sort()];
  }, [jobs]);

  // ── Filtered jobs ─────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = searchQuery.toLowerCase();
      if (q && !job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
      if (filterMode !== "All" && job.mode !== filterMode) return false;
      if (filterType !== "All" && job.type !== filterType) return false;
      if (filterMatch === "90%+" && job.matchScore < 90) return false;
      if (filterMatch === "80%+" && job.matchScore < 80) return false;
      if (filterMatch === "70%+" && job.matchScore < 70) return false;
      if (locationFilter !== "All Locations" && job.location !== locationFilter) return false;
      return true;
    });
  }, [searchQuery, filterMode, filterType, filterMatch, locationFilter, jobs]);

  // ── Displayed Jobs ────────────────────────────────────────────────────────
  const displayedJobs = useMemo(() => {
    return filteredJobs.slice((currentPage - 1) * 10, currentPage * 10);
  }, [filteredJobs, currentPage]);

  const hasNextPage = currentPage * 10 < filteredJobs.length;

  const handleNext = () => {
    if (hasNextPage) {
      setCurrentPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasActiveFilter = filterMode !== "All" || filterType !== "All" || filterMatch !== "All" || searchQuery !== "" || locationFilter !== "All Locations";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterMode("All");
    setFilterType("All");
    setFilterMatch("All");
    setLocationFilter("All Locations");
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

  const avgMatch = calcAvgMatch(jobs);

  // ── Panel style ────────────────────────────────────────────────────────────
  const glassPanel = {
    background: "rgba(14,14,24,0.70)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: "1px solid rgba(139,92,246,0.25)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.60), 0 0 28px rgba(139,92,246,0.08)",
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-4">
          <div
            className="rounded-2xl p-8 max-w-sm w-full flex flex-col items-center justify-center text-center gap-4"
            style={glassPanel}
          >
            <svg className="w-8 h-8 text-[#a855f7] animate-spin mb-2" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-white font-semibold">Finding best matching jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-4">
          <div
            className="rounded-2xl p-8 max-w-sm w-full text-center"
            style={{
              ...glassPanel,
              border: "1px solid rgba(239,68,68,0.35)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.75), 0 0 60px rgba(239,68,68,0.10)",
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "rgba(239,68,68,0.15)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-[#ef4444]" strokeWidth="2" strokeLinecap="round">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Could not load jobs</h2>
            <p className="text-sm text-[rgba(255,255,255,0.50)] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "#a855f7" }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* ── Custom Navbar for Jobs Page ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.03)] duration-300 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_10px_rgba(124,58,237,0.35)]">
                <defs>
                  <linearGradient id="qaLogoGradientJobs" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c3aed"/>
                    <stop offset="1" stopColor="#2563eb"/>
                  </linearGradient>
                </defs>

                <rect x="3" y="3" width="22" height="22" rx="7" stroke="url(#qaLogoGradientJobs)" strokeWidth="2"/>

                <path d="M11.2 9.4L17.8 14L11.2 18.6" stroke="url(#qaLogoGradientJobs)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.2 14H17.4" stroke="url(#qaLogoGradientJobs)" strokeWidth="2.3" strokeLinecap="round"/>

                {/* small speed line */}
                <path d="M7.4 11.2H10.0" stroke="url(#qaLogoGradientJobs)" strokeWidth="2.0" strokeLinecap="round" opacity="0.85"/>
              </svg>
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
                QuickApply
              </Link>
            </div>
            
            {/* Right side — Home Icon button only */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                title="Go to Home"
                aria-label="Go to Home"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.boxShadow = "0 0 16px rgba(255,255,255,0.20)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
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
            <StatBadge label={`${jobs.length} Jobs Found`} bg="rgba(139,92,246,0.14)" border="rgba(139,92,246,0.40)" color="#c4b5fd" />
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
            Showing <span className="text-[#c4b5fd] font-semibold">{filteredJobs.length}</span> of {jobs.length} jobs on this page
          </p>
        </div>

        {/* ── 2.5. Location Filter ─────────────────────────────────────────── */}
        <div 
          className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar" 
          style={{ 
            opacity: filterVisible ? 1 : 0, 
            transform: filterVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s" 
          }}
        >
          <div className="flex flex-nowrap gap-2 items-center min-w-max">
            {uniqueLocations.map(loc => (
              <LocationPill 
                key={loc} 
                label={loc} 
                active={locationFilter === loc} 
                onClick={() => setLocationFilter(loc)} 
              />
            ))}
          </div>
        </div>

        {/* ── 3. Job Cards Grid ─────────────────────────────────────────────── */}
        <div className="relative">
          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
              {displayedJobs.map((job, idx) => (
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
        </div>

        {/* Pagination Controls */}
        {filteredJobs.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-8 py-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.02)] disabled:border-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,255,255,0.3)] bg-[rgba(139,92,246,0.1)] text-[#c4b5fd] border border-[rgba(139,92,246,0.45)] hover:bg-[rgba(139,92,246,0.2)]"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.05)] px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
              Page {currentPage}
            </span>
            {filteredJobs.length <= 10 ? (
              <div className="w-[92px]" /> // Placeholder for hidden Next button
            ) : (
              <button
                onClick={handleNext}
                disabled={!hasNextPage}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.02)] disabled:border-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,255,255,0.3)] bg-[rgba(139,92,246,0.1)] text-[#c4b5fd] border border-[rgba(139,92,246,0.45)] hover:bg-[rgba(139,92,246,0.2)]"
              >
                Next
              </button>
            )}
          </div>
        )}

        {/* ── 5. Bottom Section ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 pb-8">
          <p className="text-sm text-[rgba(255,255,255,0.35)] w-full text-center sm:w-auto">
            Showing {filteredJobs.length} of {jobs.length} jobs
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
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageInner />
    </Suspense>
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
