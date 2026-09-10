"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ── File validation + set ──────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be 5 MB or less.");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  // ── Input onChange ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // reset input so same file can be reselected after clearing
    e.target.value = "";
  };

  // ── Box click → open file picker ───────────────────────────────────────────
  const handleBoxClick = () => {
    inputRef.current?.click();
  };

  // ── Drag events ────────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  // ── Clear selection ────────────────────────────────────────────────────────
  const handleRemove = (e) => {
    e.stopPropagation(); // don't re-open file picker
    setSelectedFile(null);
    setError(null);
  };

  // ── Upload file to API then navigate to processing ─────────────────────────
  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        let msg = data.error || "Upload failed. Please try again.";
        if (data.details) msg += ` (${data.details})`;
        throw new Error(msg);
      }

      // Persist resumeId for downstream pages
      localStorage.setItem("quickapply_resume_id", data.resumeId);
      router.push(`/processing?rid=${data.resumeId}`);
    } catch (err) {
      setUploadError(err.message || "Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  // ── Dynamic border style based on state ───────────────────────────────────
  const dropzoneBorder = error
    ? "rgba(239,68,68,0.60)"
    : isDragOver
    ? "rgba(139,92,246,0.80)"
    : selectedFile
    ? "rgba(34,197,94,0.55)"
    : "rgba(139,92,246,0.35)";

  const dropzoneGlow = error
    ? "0 0 30px rgba(239,68,68,0.14)"
    : isDragOver
    ? "0 0 40px rgba(139,92,246,0.30)"
    : selectedFile
    ? "0 0 30px rgba(34,197,94,0.14)"
    : "0 0 24px rgba(139,92,246,0.10)";

  return (
    <div className="relative min-h-screen h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.03)] duration-300 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side: Back + Logo */}
            <div className="flex-shrink-0 flex items-center gap-4">
              <Link
                href="/"
                aria-label="Back to home"
                className="grid h-9 w-9 place-items-center rounded-full
                  border border-white/10 bg-[rgba(15,15,25,0.65)] backdrop-blur-2xl
                  shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out
                  hover:-translate-y-0.5 hover:border-purple-400/50 hover:shadow-[0_18px_50px_rgba(139,92,246,0.25)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              
              <div className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_10px_rgba(124,58,237,0.35)]">
                  <defs>
                    <linearGradient id="qaLogoGradientUpload" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#7c3aed"/>
                      <stop offset="1" stopColor="#2563eb"/>
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="22" height="22" rx="7" stroke="url(#qaLogoGradientUpload)" strokeWidth="2"/>
                  <path d="M11.2 9.4L17.8 14L11.2 18.6" stroke="url(#qaLogoGradientUpload)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.2 14H17.4" stroke="url(#qaLogoGradientUpload)" strokeWidth="2.3" strokeLinecap="round"/>
                  <path d="M7.4 11.2H10.0" stroke="url(#qaLogoGradientUpload)" strokeWidth="2.0" strokeLinecap="round" opacity="0.85"/>
                </svg>
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
                  QuickApply
                </Link>
              </div>
            </div>
            
            {/* Right side */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#how-it-works" scroll={false} className="text-sm text-[#a1a1aa] hover:text-white transition tracking-wide">
                How it Works
              </Link>
              <Link href="/terms" className="text-sm text-[#a1a1aa] hover:text-white transition tracking-wide">
                Terms & Conditions
              </Link>
              <Link href="/refund-policy" className="text-sm text-[#a1a1aa] hover:text-white transition tracking-wide">
                Refund Policy
              </Link>
              <Link href="/upload" className="bg-[#f5f5f5] text-black font-semibold rounded-full px-5 py-2 text-sm hover:-translate-y-0.5 hover:bg-white transition-all">
                Upload Resume
              </Link>
            </div>

            {/* Mobile minimal version */}
            <div className="md:hidden flex items-center">
              <Link href="/upload" className="bg-[#f5f5f5] text-black font-semibold rounded-full px-4 py-1.5 text-xs hover:-translate-y-0.5 transition-all">
                Upload
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-4xl mx-auto px-4 pt-[100px] pb-12 w-full flex-1 flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#f5f5f5] tracking-tight">
          Upload Your Resume
        </h1>
        <p className="text-[#a1a1aa] text-center mb-10 text-sm md:text-base">
          Let AI analyze your skills and find perfect job matches
        </p>

        {/* ── Hidden file input ─────────────────────────────────────────────── */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* ── Dropzone ──────────────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload resume — click or drag and drop"
          onClick={handleBoxClick}
          onKeyDown={(e) => e.key === "Enter" && handleBoxClick()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="upload-card max-w-xl mx-auto w-full min-h-[220px] flex flex-col items-center justify-center gap-3 cursor-pointer select-none outline-none
            focus-visible:ring-2 focus-visible:ring-[#a855f7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
          style={{
            border: `2px dashed ${dropzoneBorder}`,
            boxShadow: `0 12px 48px rgba(0,0,0,0.70), ${dropzoneGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
            padding: "2.5rem",
          }}
        >
          {selectedFile ? (
            /* ── File selected state ──────────────────────────────────────── */
            <>
              {/* Green PDF icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.40)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z"
                    stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <path d="M14 2v6h6" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 13l2 2 4-4" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* File name */}
              <p
                className="text-base font-semibold text-white text-center max-w-[260px] truncate"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </p>

              {/* File size */}
              <p className="text-xs text-[rgba(255,255,255,0.45)]">
                {formatSize(selectedFile.size)}
              </p>

              {/* Remove button */}
              <button
                onClick={handleRemove}
                className="mt-1 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold
                  border border-[rgba(239,68,68,0.40)] text-red-400 transition-all duration-200
                  hover:bg-[rgba(239,68,68,0.10)] hover:border-[rgba(239,68,68,0.65)]"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Remove file
              </button>
            </>
          ) : (
            /* ── Empty / drag state ───────────────────────────────────────── */
            <>
              {/* Upload icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 transition-all duration-300"
                style={{
                  background: isDragOver ? "rgba(139,92,246,0.20)" : "rgba(139,92,246,0.10)",
                  border: `1px solid ${isDragOver ? "rgba(168,85,247,0.60)" : "rgba(139,92,246,0.35)"}`,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                    stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <polyline points="17,8 12,3 7,8" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-[#f5f5f5] text-center">
                {isDragOver ? "Drop your PDF here" : "Drag & drop your resume here"}
              </h3>
              <p className="text-[#a1a1aa] text-center text-sm">or click to browse</p>
              <p className="text-xs text-gray-500 text-center mt-1">PDF only · max 5 MB</p>
            </>
          )}
        </div>

        {/* ── Error message ──────────────────────────────────────────────────── */}
        {error && (
          <div
            className="max-w-xl mx-auto w-full mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#f87171",
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
              <path d="M8 5v3M8 10.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Upload button — shown only after file selected ─────────────────── */}
        {selectedFile && !error && (
          <div className="max-w-xl mx-auto w-full mt-5">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="upload-btn w-full flex items-center justify-center gap-2 text-base"
              style={{ opacity: uploading ? 0.65 : 1, cursor: uploading ? "not-allowed" : undefined }}
            >
              {uploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
                    <path d="M12 2 A10 10 0 0 1 22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                    <path
                      d="M10 3 A7 7 0 1 1 10 17 A7 7 0 0 1 10 3 Z"
                      stroke="white" strokeWidth="1.5"
                    />
                    <path d="M7 10 L9.5 12.5 L13.5 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Analyze My Resume
                </>
              )}
            </button>

            {/* Upload error */}
            {uploadError && (
              <p className="text-center text-xs mt-2" style={{ color: "#f87171" }}>
                {uploadError}
              </p>
            )}

            <p className="text-center text-xs text-[rgba(255,255,255,0.30)] mt-3">
              Your resume is analyzed securely — never stored publicly
            </p>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
