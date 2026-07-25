"use client";

export default function ResumeUploadCard() {
  return (
    <div className="upload-card qa-glowCard max-w-xl mx-auto p-10 md:p-12 min-h-[220px] flex flex-col items-center justify-center gap-3 cursor-pointer">
      <div className="text-5xl mb-2 grayscale opacity-90 transition-opacity hover:opacity-100 duration-300">📁</div>
      <h3 className="text-xl font-medium text-[#f5f5f5] text-center">
        Drag & drop your resume here
      </h3>
      <p className="text-[#a1a1aa] text-center text-sm">or click to browse</p>
      <p className="text-xs text-gray-500 text-center mt-2">PDF only, max 5MB</p>
    </div>
  );
}
