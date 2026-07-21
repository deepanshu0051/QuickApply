"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.03)] duration-300 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary-purple to-primary-blue"></div>
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
              QuickApply
            </Link>
          </div>
          
          {/* Right side */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-sm text-gray-400 hover:text-white transition">
              How it Works
            </Link>
            <Link href="/upload" className="glass-card rounded-full px-5 py-2 text-sm hover:-translate-y-0.5 hover:text-white text-gray-200 transition-all">
              Upload Resume
            </Link>
          </div>

          {/* Mobile minimal version */}
          <div className="md:hidden flex items-center">
            <Link href="/upload" className="glass-card rounded-full px-4 py-1.5 text-xs hover:-translate-y-0.5 transition-all text-gray-200">
              Upload
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
