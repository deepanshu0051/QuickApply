"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useState, useEffect } from "react";

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="relative min-h-screen">
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
      
      {/* ── Custom Inline Navbar ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.03)] duration-300 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_10px_rgba(124,58,237,0.35)]">
                <defs>
                  <linearGradient id="qaLogoGradient" x1="2" y1="14" x2="26" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7c3aed"/>
                    <stop offset="1" stopColor="#2563eb"/>
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="22" height="22" rx="7" stroke="url(#qaLogoGradient)" strokeWidth="2"/>
                <path d="M11.2 9.4L17.8 14L11.2 18.6" stroke="url(#qaLogoGradient)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.2 14H17.4" stroke="url(#qaLogoGradient)" strokeWidth="2.3" strokeLinecap="round"/>
                <path d="M7.4 11.2H10.0" stroke="url(#qaLogoGradient)" strokeWidth="2.0" strokeLinecap="round" opacity="0.85"/>
              </svg>
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
                QuickApply
              </Link>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setShowModal(true)} className="text-sm text-[#a1a1aa] hover:text-white transition tracking-wide cursor-pointer">
                How it Works
              </button>
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

            <div className="md:hidden flex items-center gap-4">
              <button onClick={() => setShowModal(true)} className="text-xs text-[#a1a1aa] hover:text-white transition cursor-pointer">
                How it Works
              </button>
              <Link href="/upload" className="bg-[#f5f5f5] text-black font-semibold rounded-full px-4 py-1.5 text-xs hover:-translate-y-0.5 transition-all">
                Upload
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col justify-center items-center px-4 max-w-5xl mx-auto w-full pb-6">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
          <Image src="/logo.png?v=3" alt="QuickApply Logo" width={64} height={64} className="mx-auto mb-4" unoptimized />
          <h1 className="text-5xl md:text-6xl font-bold text-[#f5f5f5] mb-4 tracking-tight">
            QuickApply
          </h1>
          <p className="text-lg md:text-xl text-[#a1a1aa] mb-6 md:mb-8 overflow-hidden max-w-full">
            <span className="qa-typing">Upload your resume. Get matched with perfect jobs instantly.</span>
          </p>
          <Link href="/upload" className="inline-block upload-btn">
            Upload Resume
          </Link>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works-section" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Card 1 */}
            <div className="feature-card qa-glowCard mx-auto w-full flex flex-col items-center justify-center min-h-[140px]">
              <h3 className="text-lg font-medium mb-2 text-[#f5f5f5]">Upload Resume</h3>
              <p className="text-sm text-[#a1a1aa]">Drop your PDF resume</p>
            </div>

            {/* Card 2 */}
            <div className="feature-card qa-glowCard mx-auto w-full flex flex-col items-center justify-center min-h-[140px]">
              <h3 className="text-lg font-medium mb-2 text-[#f5f5f5]">AI Analysis</h3>
              <p className="text-sm text-[#a1a1aa]">We extract your skills</p>
            </div>

            {/* Card 3 */}
            <div className="feature-card qa-glowCard mx-auto w-full flex flex-col items-center justify-center min-h-[140px]">
              <h3 className="text-lg font-medium mb-2 text-[#f5f5f5]">Get Matched</h3>
              <p className="text-sm text-[#a1a1aa]">Find perfect job matches</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs md:text-sm text-white/55 tracking-wide">
            Built for speed — upload once, apply faster. No login.
          </p>
        </footer>

      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setShowModal(false)}
        >
          {/* Modal Card */}
          <div 
            className="w-full max-w-lg rounded-2xl p-8 relative transform transition-all"
            style={{
              background: "rgba(20, 20, 30, 0.90)",
              border: "1px solid rgba(139, 92, 246, 0.45)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 0 40px rgba(124, 58, 237, 0.3)",
              animation: "modalFadeIn 300ms ease"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">How QuickApply Works</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Upload Your Resume</h3>
                  <p className="text-sm text-gray-400">Upload your PDF resume — no login required</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Analyzes Your Resume</h3>
                  <p className="text-sm text-gray-400">Our AI extracts your skills, experience and scores your resume</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Get Matched With Jobs</h3>
                  <p className="text-sm text-gray-400">We find jobs that match your skills from multiple job platforms</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Apply Instantly</h3>
                  <p className="text-sm text-gray-400">Click Apply on any job card and go directly to the application</p>
                </div>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-sm text-gray-400 text-center">
                💡 Tip: Use a clean, well-formatted PDF for best results
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
