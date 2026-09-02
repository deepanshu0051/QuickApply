"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Constants ──────────────────────────────────────────────────────────────────
const STEPS = [
  "Uploading resume...",
  "Extracting text content...",
  "Validating resume format...",
  "Analyzing skills & experience...",
  "Cross-checking with AI...",
  "Finalizing analysis...",
];

const STEP_DURATION = 1500; // ms per step

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Animated resume/document scanner icon */
function ScannerIcon() {
  return (
    <div className="relative mx-auto w-20 h-24 mb-6">
      {/* Document body */}
      <svg
        viewBox="0 0 80 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_18px_rgba(139,92,246,0.5)]"
      >
        {/* Page background */}
        <rect
          x="4" y="4" width="72" height="88" rx="8"
          fill="rgba(20,15,40,0.85)"
          stroke="rgba(139,92,246,0.55)"
          strokeWidth="1.5"
        />
        {/* Lines on document */}
        <rect x="18" y="24" width="44" height="4" rx="2" fill="rgba(139,92,246,0.40)" />
        <rect x="18" y="34" width="36" height="3" rx="1.5" fill="rgba(139,92,246,0.25)" />
        <rect x="18" y="42" width="40" height="3" rx="1.5" fill="rgba(139,92,246,0.25)" />
        <rect x="18" y="50" width="32" height="3" rx="1.5" fill="rgba(139,92,246,0.20)" />
        <rect x="18" y="58" width="38" height="3" rx="1.5" fill="rgba(139,92,246,0.20)" />
        <rect x="18" y="66" width="28" height="3" rx="1.5" fill="rgba(139,92,246,0.15)" />
        <rect x="18" y="74" width="34" height="3" rx="1.5" fill="rgba(139,92,246,0.15)" />
      </svg>

      {/* Scanning line */}
      <div
        className="scan-line absolute left-1 right-1 h-[2px] rounded-full pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.9) 20%, rgba(139,92,246,1) 50%, rgba(168,85,247,0.9) 80%, transparent 100%)",
          boxShadow: "0 0 10px 2px rgba(139,92,246,0.55)",
        }}
      />
    </div>
  );
}

/** Single processing step row */
function StepRow({ label, state }) {
  // state: 'pending' | 'active' | 'done'
  return (
    <div
      className={`step-fade-in flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
        state === "active"
          ? "bg-[rgba(124,58,237,0.12)] border border-[rgba(139,92,246,0.28)]"
          : "border border-transparent"
      }`}
    >
      {/* Indicator */}
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        {state === "pending" && (
          <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.2)]" />
        )}
        {state === "active" && (
          <svg
            className="step-spinner w-5 h-5"
            viewBox="0 0 20 20"
            fill="none"
          >
            <circle
              cx="10" cy="10" r="8"
              stroke="rgba(139,92,246,0.25)"
              strokeWidth="2.5"
            />
            <path
              d="M10 2 A8 8 0 0 1 18 10"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {state === "done" && (
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" />
            <path d="M6 10.5 L9 13.5 L14 7.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        className={`text-sm font-medium transition-colors duration-300 ${
          state === "pending"
            ? "text-[rgba(255,255,255,0.30)]"
            : state === "active"
            ? "text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
            : "text-[#4ade80]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/** Purple-glow outlined Cancel button */
function CancelButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-6 w-full py-2.5 rounded-xl border border-[rgba(139,92,246,0.55)] text-[#a855f7] text-sm font-semibold tracking-wide
        hover:border-red-500 hover:text-red-400 transition-all duration-300
        hover:shadow-[0_0_18px_rgba(239,68,68,0.25)]"
    >
      Cancel
    </button>
  );
}

/** Cancel warning modal */
function CancelModal({ onClose, onConfirm }) {
  return (
    <div className="processing-modal-backdrop">
      <div
        className="modal-scale-in processing-modal-card border border-[rgba(255,200,60,0.35)] w-full max-w-sm p-6 text-center"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.80), 0 0 40px rgba(234,179,8,0.12)" }}
      >
        {/* Warning icon */}
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-bold text-white mb-2">Are you sure?</h2>
        <p className="text-sm text-[rgba(255,255,255,0.55)] mb-6 leading-relaxed">
          Canceling will stop the analysis. Your resume will not be processed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.45)]
              text-red-400 text-sm font-semibold transition-all duration-300
              hover:bg-[rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Yes, Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.45)]
              text-[#a855f7] text-sm font-semibold transition-all duration-300
              hover:bg-[rgba(139,92,246,0.22)] hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]"
          >
            No, Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/** Invalid resume error modal */
function ErrorModal({ reason, onBack, onRetry }) {
  return (
    <div className="processing-modal-backdrop">
      <div
        className="modal-scale-in processing-modal-card border border-[rgba(239,68,68,0.45)] w-full max-w-sm p-6 text-center"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.80), 0 0 40px rgba(239,68,68,0.18)" }}
      >
        {/* Error icon */}
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.4)] flex items-center justify-center text-2xl">
          ❌
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Invalid Resume Detected</h2>
        <p className="text-sm text-[rgba(255,255,255,0.55)] mb-6 leading-relaxed">
          {reason || "This doesn\u0027t appear to be a resume. Please upload a valid resume PDF."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.12)]
              text-[rgba(255,255,255,0.65)] text-sm font-semibold transition-all duration-300
              hover:border-[rgba(255,255,255,0.3)] hover:text-white"
          >
            Go Back
          </button>
          <button
            onClick={onRetry || onBack}
            className="flex-1 py-2.5 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.45)]
              text-red-400 text-sm font-semibold transition-all duration-300
              hover:bg-[rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
function ProcessingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read rid from URL query param and persist to localStorage
  const rid = searchParams.get("rid") || "";
  useEffect(() => {
    if (rid) {
      localStorage.setItem("quickapply_resume_id", rid);
    }
  }, [rid]);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);

  // AI analysis state
  const [analysisStatus, setAnalysisStatus] = useState("pending"); // pending, success, error
  const [invalidReason, setInvalidReason] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const analysisStatusRef = useRef("pending");

  // Track elapsed time to resume correctly after pause
  const pausedStepRef = useRef(0);
  const stepTimerRef = useRef(null);

  // ── Progress bar update ───────────────────────────────────────────────────
  useEffect(() => {
    if (isDone) {
      setProgress(100);
    } else {
      setProgress(Math.floor((currentStep / STEPS.length) * 100));
    }
  }, [currentStep, isDone]);

  // ── Step sequencer ──────────────────────────────────────────────────────────
  const scheduleNextStep = (step) => {
    if (step >= STEPS.length) return;

    // Step 5 completes much faster once step 4 (AI check) is done
    const delay = step === 5 ? 500 : STEP_DURATION;

    stepTimerRef.current = setTimeout(() => {
      // Pause at step 4 ("Cross-checking with AI...") if API is still pending
      if (step === 4 && analysisStatusRef.current === "pending") {
        // Just wait and poll again shortly
        scheduleNextStep(step);
        return;
      }

      // If error or invalid occurred, stop advancing
      if (analysisStatusRef.current === "error" || analysisStatusRef.current === "invalid") {
        return;
      }

      const nextStep = step + 1;

      if (nextStep < STEPS.length) {
        setCurrentStep(nextStep);
        pausedStepRef.current = nextStep;
        scheduleNextStep(nextStep);
      } else {
        // All steps done
        setCurrentStep(STEPS.length);
        setIsDone(true);
      }
    }, delay);
  };

  const clearStepTimer = () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  };

  // ── Start on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    scheduleNextStep(0);

    const navTimer = setTimeout(() => {
      setShowNavbar(false);
    }, 500);

    // Trigger AI analysis
    const runAnalysis = async () => {
      if (!rid) return; // Need an ID to analyze
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: rid }),
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          if (data.isValidResume === false) {
            // Gemini determined this is NOT a valid resume
            setInvalidReason(data.reason || "This document does not appear to be a resume.");
            analysisStatusRef.current = "invalid";
            setAnalysisStatus("invalid");
            setShowErrorModal(true);
            clearStepTimer();
          } else {
            // Valid resume — store analysis
            setAnalysisResult(data.analysis);
            try {
              localStorage.setItem("quickapply_analysis", JSON.stringify(data.analysis));
            } catch (_) { /* localStorage full or unavailable — ignore */ }
            analysisStatusRef.current = "success";
            setAnalysisStatus("success");
          }
        } else {
          setInvalidReason(data.error || "Analysis failed. Please try again.");
          analysisStatusRef.current = "error";
          setAnalysisStatus("error");
          setShowErrorModal(true);
          clearStepTimer();
        }
      } catch (err) {
        setInvalidReason("Network error — could not reach the server. Please try again.");
        analysisStatusRef.current = "error";
        setAnalysisStatus("error");
        setShowErrorModal(true);
        clearStepTimer();
      }
    };

    runAnalysis();

    return () => {
      clearStepTimer();
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  // ── Pause / resume ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) {
      clearStepTimer();
    } else {
      if (!isDone) {
        scheduleNextStep(pausedStepRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // ── Handle completion ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDone) return;

    const timeout = setTimeout(() => {
      if (analysisStatus === "success") {
        const resumeId = rid || localStorage.getItem("quickapply_resume_id") || "";
        router.push(resumeId ? `/score?rid=${resumeId}` : "/score");
      } else {
        setShowErrorModal(true);
      }
    }, 1000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, analysisStatus, rid, router]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCancelClick = () => {
    setIsPaused(true);
    setShowCancelModal(true);
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
    setIsPaused(false);
  };

  const handleCancelConfirm = () => {
    router.push("/upload");
  };

  const handleErrorBack = () => {
    router.push("/upload");
  };

  // Retry analysis (for API errors, not invalid resumes)
  const handleRetry = () => {
    setShowErrorModal(false);
    setInvalidReason("");
    setAnalysisResult(null);
    analysisStatusRef.current = "pending";
    setAnalysisStatus("pending");
    setCurrentStep(0);
    setProgress(0);
    setIsDone(false);
    pausedStepRef.current = 0;
    scheduleNextStep(0);

    // Re-trigger analysis
    (async () => {
      if (!rid) return;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: rid }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.isValidResume === false) {
            setInvalidReason(data.reason || "This document does not appear to be a resume.");
            analysisStatusRef.current = "invalid";
            setAnalysisStatus("invalid");
            setShowErrorModal(true);
            clearStepTimer();
          } else {
            setAnalysisResult(data.analysis);
            try {
              localStorage.setItem("quickapply_analysis", JSON.stringify(data.analysis));
            } catch (_) {}
            analysisStatusRef.current = "success";
            setAnalysisStatus("success");
          }
        } else {
          setInvalidReason(data.error || "Analysis failed. Please try again.");
          analysisStatusRef.current = "error";
          setAnalysisStatus("error");
          setShowErrorModal(true);
          clearStepTimer();
        }
      } catch (err) {
        setInvalidReason("Network error — could not reach the server. Please try again.");
        analysisStatusRef.current = "error";
        setAnalysisStatus("error");
        setShowErrorModal(true);
        clearStepTimer();
      }
    })();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      <div 
        style={{ 
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)', 
          transition: 'transform 600ms ease-in-out' 
        }}
      >
        <Navbar />
      </div>

      {/* Center content */}
      <div 
        className="flex-1 flex items-center justify-center px-4 py-10"
        style={{ 
          marginTop: showNavbar ? '0' : '-80px',
          transition: 'margin-top 600ms ease-in-out'
        }}
      >
        <div className="processing-card w-full max-w-md p-8">
          {/* Scanner icon */}
          <ScannerIcon />

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-6 tracking-tight">
            Analyzing Your Resume
          </h1>

          {/* Processing steps */}
          <div className="flex flex-col gap-1 mb-6">
            {STEPS.map((label, idx) => {
              let state = "pending";
              if (idx < currentStep) state = "done";
              else if (idx === currentStep) state = "active";
              return <StepRow key={idx} label={label} state={state} />;
            })}
          </div>

          {/* Progress bar */}
          <div className="mb-1">
            <div className="w-full h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7, #2563eb)",
                  boxShadow: "0 0 12px rgba(168,85,247,0.5)",
                  transition: "width 500ms ease-in-out",
                }}
              />
            </div>
            <p className="text-right text-xs text-[rgba(255,255,255,0.40)] mt-1 font-mono">
              {progress}%
            </p>
          </div>

          {/* Cancel button */}
          <CancelButton onClick={handleCancelClick} />
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal onClose={handleCancelClose} onConfirm={handleCancelConfirm} />
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          reason={invalidReason}
          onBack={handleErrorBack}
          onRetry={analysisStatus === "error" ? handleRetry : handleErrorBack}
        />
      )}
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingPageInner />
    </Suspense>
  );
}
