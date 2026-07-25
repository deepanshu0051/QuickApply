"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ResumeUploadCard from "@/components/ResumeUploadCard";

export default function UploadPage() {
  return (
    <div className="min-h-screen relative flex flex-col">
      <Navbar />
      <Link
        href="/"
        aria-label="Back to home"
        className="fixed left-4 top-4 md:left-6 md:top-5 z-50 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-[rgba(15,15,25,0.65)] backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-[0_18px_50px_rgba(139,92,246,0.25)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <div className="max-w-4xl mx-auto px-4 pt-[100px] pb-12 w-full flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#f5f5f5] tracking-tight">
          Upload Your Resume
        </h1>
        <p className="text-[#a1a1aa] text-center mb-14 text-sm md:text-base">
          Let AI analyze your skills and find perfect job matches
        </p>
        <ResumeUploadCard />
      </div>
    </div>
  );
}
