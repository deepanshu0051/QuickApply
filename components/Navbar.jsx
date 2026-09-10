"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.03)] duration-300 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
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

              {/* small speed line */}
              <path d="M7.4 11.2H10.0" stroke="url(#qaLogoGradient)" strokeWidth="2.0" strokeLinecap="round" opacity="0.85"/>
            </svg>
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
              QuickApply
            </Link>
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
  );
}
