"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Live Data Setup (demoJobs removed) ──────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────────
function getSalaryDisplay(job) {
  const min = job.job_min_salary;
  const max = job.job_max_salary;
  const currency = job.job_salary_currency;
  const period = job.job_salary_period;

  if (min == null && max == null) {
    return "Not Disclosed";
  }

  let symbol = "";
  if (currency) {
    const currUpper = currency.toUpperCase();
    if (currUpper === "INR") symbol = "₹";
    else if (currUpper === "USD") symbol = "$";
    else if (currUpper === "GBP") symbol = "£";
    else if (currUpper === "EUR") symbol = "€";
    else symbol = currency;
  }

  const formatNum = (num) => num.toLocaleString();

  let salaryStr = "";
  if (min != null && max != null) {
    salaryStr = `${symbol}${formatNum(min)} - ${symbol}${formatNum(max)}`;
  } else if (min != null) {
    salaryStr = `From ${symbol}${formatNum(min)}`;
  } else if (max != null) {
    salaryStr = `Up to ${symbol}${formatNum(max)}`;
  }

  if (period) {
    const periodUpper = period.toUpperCase();
    if (periodUpper === "YEAR") salaryStr += " (per year)";
    else if (periodUpper === "MONTH") salaryStr += " (per month)";
    else if (periodUpper === "HOUR") salaryStr += " (per hour)";
  }

  return salaryStr;
}

function getMatchConfig(score) {
  if (score >= 90) return { bg: "rgba(34,197,94,0.14)",  border: "rgba(34,197,94,0.50)",  color: "#4ade80" };
  if (score >= 80) return { bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.50)", color: "#60a5fa" };
  if (score >= 70) return { bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.50)", color: "#fbbf24" };
  return               { bg: "rgba(100,100,120,0.14)", border: "rgba(100,100,120,0.40)", color: "#9ca3af" };
}

function getModeIcon() {
  return null;
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

function safeString(val, maxLen, defaultVal = "Not specified") {
  if (typeof val !== "string" || !val.trim()) return defaultVal;
  const trimmed = val.trim();
  return trimmed.length > maxLen ? trimmed.substring(0, maxLen) + "..." : trimmed;
}

// ── Job Card ───────────────────────────────────────────────────────────────────
function JobCard({ job, isBookmarked, onBookmark, onApply, expanded, onToggleExpand, delay }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const mc = getMatchConfig(job.matchScore);
  
  const safeTitle = safeString(job.title, 100);
  const safeCompany = safeString(job.company, 100);
  const safeLocation = safeString(job.location, 100);
  const safeMode = safeString(job.mode, 50, "Onsite");
  const safeType = safeString(job.type, 50, "Full-time");
  const safeSalary = getSalaryDisplay(job);
  const safePostedAt = safeString(job.postedAt, 50, "Recently");
  const safeDesc = safeString(job.description, 300, "No description provided.");
  const safeSource = safeString(job.source, 50, "JSearch");
  
  const visibleSkills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : [];
  const extraSkills = Array.isArray(job.skills) ? job.skills.slice(3) : [];

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
            {getInitials(safeCompany)}
          </div>

          {/* Title + company */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{safeTitle}</p>
            <p className="text-xs text-[rgba(255,255,255,0.45)] mt-0.5 truncate">{safeCompany}</p>
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
          <MetaPill><span className="inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{safeLocation}</span></MetaPill>
          <MetaPill><span className="inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>{safeMode}</span></MetaPill>
          <MetaPill><span className="inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>{safeType}</span></MetaPill>
          <span className="text-xs font-semibold text-[#4ade80] inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>{safeSalary}</span>
          <span className="text-xs text-[rgba(255,255,255,0.35)] inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{safePostedAt}</span>
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
            style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: expanded ? "unset" : 2, overflow: "hidden", wordBreak: "break-word" }}
          >
            {safeDesc}
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
          <span className="text-xs text-[rgba(255,255,255,0.30)]">via {safeSource}</span>
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
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let ridParam = searchParams.get("rid") || "";
  if (ridParam && !UUID_REGEX.test(ridParam)) ridParam = "";
  
  let localRid = typeof window !== "undefined" ? localStorage.getItem("quickapply_resume_id") : "";
  if (localRid && !UUID_REGEX.test(localRid)) localRid = "";
  
  const rid = ridParam || localRid || "";
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [activeScoreTab, setActiveScoreTab] = useState("score");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Visibility for entrance animations
  const [headerVisible, setHeaderVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const toastTimerRef = useRef(null);
  const refreshErrorTimerRef = useRef(null);

  // ── Shared fetch logic ────────────────────────────────────────────────────
  const fetchJobs = useCallback(async ({ isRefresh = false } = {}) => {
    try {
      let query = "Software Developer";
      if (typeof window !== "undefined") {
        const localAnalysis = localStorage.getItem("quickapply_analysis");
        if (localAnalysis) {
          try {
            const analysis = JSON.parse(localAnalysis);
            if (analysis.role && analysis.role !== "Unknown") query = analysis.role;
          } catch (e) {}
        }
      }

      const token = sessionStorage.getItem("quickapply_access_token");
      const res = await fetch(`/api/jobs?query=${encodeURIComponent(query)}&rid=${encodeURIComponent(rid)}`, {
        headers: { "x-quickapply-access-token": token || "" }
      });

      if (res.status === 402) {
        if (isRefresh) {
          setSessionExpired(true);
        } else {
          router.push(`/score?rid=${rid}`);
        }
        return;
      }

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch jobs");

      setJobs(json.jobs || []);
      if (isRefresh) {
        setCurrentPage(1);
        clearFilters();
      }
    } catch (err) {
      if (isRefresh) {
        setRefreshError("Refresh failed. Please try again.");
        if (refreshErrorTimerRef.current) clearTimeout(refreshErrorTimerRef.current);
        refreshErrorTimerRef.current = setTimeout(() => setRefreshError(""), 3000);
      } else {
        setError(err.message);
      }
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setLoading(false);
    }
  }, [rid]);

  useEffect(() => { fetchJobs(); }, [rid]);

  const handleRefreshJobs = async () => {
    if (refreshCount >= 2) return;
    setIsRefreshing(true);
    setRefreshError("");
    setSessionExpired(false);
    await fetchJobs({ isRefresh: true });
    setRefreshCount((prev) => prev + 1);
  };

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
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Jobs Matched For You</h1>
          <p className="text-sm text-[rgba(255,255,255,0.40)] mb-4">
            Based on your resume analysis — sorted by match score
          </p>
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatBadge label={`${jobs.length} Jobs Found`} bg="rgba(139,92,246,0.14)" border="rgba(139,92,246,0.40)" color="#c4b5fd" />
            <StatBadge label={`Avg Match: ${avgMatch}%`} bg="rgba(59,130,246,0.14)" border="rgba(59,130,246,0.40)" color="#60a5fa" />
            <span className="text-xs text-[rgba(255,255,255,0.35)]">Updated: Just now</span>
          </div>

          <div 
            className="flex items-start gap-2 px-4 py-2 rounded-lg mt-4"
            style={{ 
              background: "rgba(124, 58, 237, 0.10)", 
              border: "1px solid rgba(124, 58, 237, 0.25)" 
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>
              Not seeing relevant jobs? Try clicking Refresh Jobs below — fresh results load each time.
            </p>
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
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Mode:</span>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Remote", "Hybrid", "Onsite"].map((m) => (
                  <FilterPill key={m} label={m} active={filterMode === m} onClick={() => setFilterMode(m)} />
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[rgba(255,255,255,0.10)]" />
            {/* Type */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Type:</span>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Full-time", "Contract"].map((t) => (
                  <FilterPill key={t} label={t} active={filterType === t} onClick={() => setFilterType(t)} />
                ))}
              </div>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[rgba(255,255,255,0.10)]" />
            {/* Match */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
              <span className="text-xs text-[rgba(255,255,255,0.35)] mr-0.5">Match:</span>
              <div className="flex flex-wrap gap-1.5">
                {["All", "90%+", "80%+", "70%+"].map((m) => (
                  <FilterPill key={m} label={m} active={filterMatch === m} onClick={() => setFilterMatch(m)} />
                ))}
              </div>
            </div>

            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0 text-xs text-red-400 border border-[rgba(239,68,68,0.35)] px-3 py-1.5 rounded-full
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

        {/* ── Navigation Buttons ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
          <button
            onClick={() => { setActiveScoreTab("score"); setShowScoreModal(true); }}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-1.5"
            style={{
              background: "transparent",
              border: "1px solid rgba(139,92,246,0.50)",
              color: "#a855f7",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Resume Score
          </button>
          <button
            onClick={handleRefreshJobs}
            disabled={isRefreshing || refreshCount >= 2}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(37,99,235,0.15)",
              border: "1px solid rgba(37,99,235,0.50)",
              color: "#60a5fa",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onMouseEnter={(e) => { if (!isRefreshing && refreshCount < 2) e.currentTarget.style.background = "rgba(37,99,235,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.15)"; }}
          >
            {isRefreshing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2 A10 10 0 0 1 22 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Refreshing...
              </>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> Refresh Jobs{refreshCount > 0 ? ` (${Math.max(0, 2 - refreshCount)} left)` : ""}</>
            )}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-1.5"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.50)",
              color: "#f87171",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload New Resume
          </button>
        </div>

        {/* ── Refresh error / Session expired inline messages ─────────────── */}
        {refreshCount >= 2 && (
          <div 
            className="flex items-start gap-3 px-4 py-3 rounded-lg mt-3"
            style={{ 
              background: "rgba(124, 58, 237, 0.08)", 
              border: "1px solid rgba(124, 58, 237, 0.20)" 
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#a855f7" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
                You have used both refreshes for this session.
              </p>
              <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.45)" }}>
                New jobs are posted daily by companies. Come back in a few days for fresh listings — you may find more relevant opportunities then.
              </p>
            </div>
          </div>
        )}
        {refreshError && (
          <p className="text-sm text-red-400 text-center -mt-2">{refreshError}</p>
        )}
        {sessionExpired && (
          <div
            className="rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.30)",
            }}
          >
            <p className="text-sm text-red-300 text-center sm:text-left">
              Your session has expired. Please go back to the Score page and find jobs again.
            </p>
            <button
              onClick={() => router.push(`/score?rid=${rid}`)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer"
              style={{
                background: "rgba(139,92,246,0.20)",
                border: "1px solid rgba(139,92,246,0.50)",
                color: "#a855f7",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.20)"; }}
            >
              Go to Score →
            </button>
          </div>
        )}

        {/* ── 3. Job Cards Grid ─────────────────────────────────────────────── */}
        <div className="relative">
          {displayedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-h-[300px]">
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
            <div className="flex justify-center mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
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
          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-8 py-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.02)] disabled:border-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,255,255,0.3)] bg-[rgba(139,92,246,0.1)] text-[#c4b5fd] border border-[rgba(139,92,246,0.45)] hover:bg-[rgba(139,92,246,0.2)]"
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm font-semibold text-[rgba(255,255,255,0.7)] bg-[rgba(255,255,255,0.05)] px-3 sm:px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
              Page {currentPage}
            </span>
            {filteredJobs.length <= 10 ? (
              <div className="w-[92px]" /> // Placeholder for hidden Next button
            ) : (
              <button
                onClick={handleNext}
                disabled={!hasNextPage}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.02)] disabled:border-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,255,255,0.3)] bg-[rgba(139,92,246,0.1)] text-[#c4b5fd] border border-[rgba(139,92,246,0.45)] hover:bg-[rgba(139,92,246,0.2)]"
              >
                Next
              </button>
            )}
          </div>
        )}


      </main>
      </div>

      {/* ── Upload Warning Modal ────────────────────────────────────────── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
          }}
          onClick={() => setShowUploadModal(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowUploadModal(false); }}
        >
          <div
            className="w-full"
            style={{
              maxWidth: "420px",
              background: "rgba(20,10,10,0.95)",
              border: "1px solid rgba(239,68,68,0.60)",
              boxShadow: "0 0 40px rgba(239,68,68,0.30)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 text-center mt-3">Are you sure?</h2>
            <p className="text-sm text-center mt-1" style={{ color: "rgba(252,165,165,0.70)" }}>This action cannot be undone</p>
            <div className="my-4" style={{ borderTop: "1px solid rgba(127,29,29,0.40)" }} />
            <p className="text-sm text-gray-300 leading-relaxed">
              If you upload a new resume, you will be redirected to the Upload page and will need to go through the entire process again — including paying ₹1 to find jobs for your new resume. Your current job results will be lost.
            </p>
            <div className="mt-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
              <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: "#fca5a5" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>You will be charged again for the new resume.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer"
                style={{ background: "rgba(139,92,246,0.20)", border: "1px solid rgba(139,92,246,0.50)", color: "#a855f7" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.20)"; }}
              >
                No, Keep My Jobs
              </button>
              <button
                onClick={() => router.push("/upload")}
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.50)", color: "#f87171" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.30)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              >
                Yes, Upload New Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume Score Modal ──────────────────────────────────────────── */}
      {showScoreModal && (() => {
        let analysis = null;
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("quickapply_analysis") : null;
          if (raw) analysis = JSON.parse(raw);
        } catch (e) {}

        const score = analysis ? (analysis.score ?? analysis.resumeScore ?? 0) : 0;
        const scoreColor = score >= 80 ? "#4ade80" : score >= 60 ? "#facc15" : "#f87171";
        const rating = analysis?.rating || "";
        const summary = analysis?.summary || "";
        const strengths = Array.isArray(analysis?.strengths) ? analysis.strengths : [];
        const improvements = Array.isArray(analysis?.improvements) ? analysis.improvements : [];
        const skills = Array.isArray(analysis?.skills) ? analysis.skills : (Array.isArray(analysis?.extractedSkills) ? analysis.extractedSkills : []);

        const tabIcons = {
          score: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
          strengths: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
          improvements: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>,
          skills: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
        };
        const tabs = [
          { id: "score", label: "Score" },
          { id: "strengths", label: "Strengths" },
          { id: "improvements", label: "Improvements" },
          { id: "skills", label: "Skills" },
        ];

        return (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.80)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              zIndex: 9999,
            }}
            onClick={() => setShowScoreModal(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setShowScoreModal(false); }}
          >
            <div
              className="relative w-full sm:w-[90%] overflow-y-auto"
              style={{
                maxWidth: "560px",
                maxHeight: "85vh",
                background: "rgba(20,20,30,0.95)",
                border: "1px solid rgba(139,92,246,0.45)",
                boxShadow: "0 0 50px rgba(139,92,246,0.20)",
                borderRadius: "1.5rem",
                padding: "1.25rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowScoreModal(false)}
                className="absolute top-4 right-4 transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  color: "#9ca3af",
                  lineHeight: 1,
                  fontSize: "1.1rem",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#9ca3af"; }}
                aria-label="Close"
              >
                ×
              </button>

              {/* Header */}
              <h2 className="text-xl font-bold text-white pr-10">Your Resume Analysis</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(216,180,254,0.70)" }}>AI-powered insights from your resume</p>

              {/* Tab bar */}
              <div className="flex flex-wrap gap-2 mt-4 mb-5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveScoreTab(tab.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: activeScoreTab === tab.id ? "rgba(139,92,246,0.30)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${activeScoreTab === tab.id ? "rgba(139,92,246,0.60)" : "rgba(255,255,255,0.08)"}`,
                      color: activeScoreTab === tab.id ? "#a855f7" : "#6b7280",
                    }}
                    onMouseEnter={(e) => { if (activeScoreTab !== tab.id) { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; } }}
                    onMouseLeave={(e) => { if (activeScoreTab !== tab.id) { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                  >
                    <span className="inline-flex items-center gap-1.5">{tabIcons[tab.id]}{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* No data fallback */}
              {!analysis && (
                <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Score data not available. Please re-upload your resume.
                </p>
              )}

              {/* Tab: Score */}
              {analysis && activeScoreTab === "score" && (
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-bold" style={{ color: scoreColor }}>{score}</span>
                  {rating && <p className="text-lg font-semibold mt-2" style={{ color: "#d8b4fe" }}>{rating}</p>}
                  {summary && <p className="text-sm text-center mt-2 px-4" style={{ color: "#9ca3af" }}>{summary}</p>}
                  <div className="mt-4 w-full" style={{ height: "0.75rem", borderRadius: "9999px", background: "rgba(255,255,255,0.08)" }}>
                    <div
                      style={{
                        width: `${Math.min(score, 100)}%`,
                        height: "100%",
                        borderRadius: "9999px",
                        background: "linear-gradient(90deg,#7c3aed,#2563eb)",
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>{score} / 100</p>
                </div>
              )}

              {/* Tab: Strengths */}
              {analysis && activeScoreTab === "strengths" && (
                <div>
                  {strengths.length === 0 && <p className="text-sm py-4" style={{ color: "rgba(255,255,255,0.40)" }}>No strengths data found.</p>}
                  {strengths.map((s, i) => (
                    <div
                      key={i}
                      className="mb-2"
                      style={{
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.20)",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1rem",
                      }}
                    >
                      <p className="text-sm inline-flex items-center gap-1.5" style={{ color: "#86efac" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Improvements */}
              {analysis && activeScoreTab === "improvements" && (
                <div>
                  {improvements.length === 0 && <p className="text-sm py-4" style={{ color: "rgba(255,255,255,0.40)" }}>No improvements data found.</p>}
                  {improvements.map((item, i) => {
                    const text = typeof item === "string" ? item : (item.issue || item.fix || item.section || JSON.stringify(item));
                    return (
                      <div
                        key={i}
                        className="mb-2"
                        style={{
                          background: "rgba(251,191,36,0.08)",
                          border: "1px solid rgba(251,191,36,0.20)",
                          borderRadius: "0.75rem",
                          padding: "0.75rem 1rem",
                        }}
                      >
                        <p className="text-sm inline-flex items-center gap-1.5" style={{ color: "#fde68a" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>{text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Skills */}
              {analysis && activeScoreTab === "skills" && (
                <div className="flex flex-wrap">
                  {skills.length === 0 && <p className="text-sm py-4" style={{ color: "rgba(255,255,255,0.40)" }}>No skills data found.</p>}
                  {skills.map((skill, i) => (
                    <span
                      key={`${skill}-${i}`}
                      className="inline-flex m-1"
                      style={{
                        background: "rgba(139,92,246,0.15)",
                        border: "1px solid rgba(139,92,246,0.35)",
                        borderRadius: "9999px",
                        padding: "0.25rem 0.75rem",
                        color: "#d8b4fe",
                        fontSize: "0.875rem",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
