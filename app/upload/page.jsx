"use client";
import Navbar from "@/components/Navbar";
import ResumeUploadCard from "@/components/ResumeUploadCard";

export default function UploadPage() {
  return (
    <div className="min-h-screen pt-24 relative">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent tracking-tight">
          Upload Your Resume
        </h1>
        <p className="text-gray-400 text-center mb-14 text-sm md:text-base">
          Let AI analyze your skills and find perfect job matches
        </p>
        <ResumeUploadCard />
      </div>
    </div>
  );
}
