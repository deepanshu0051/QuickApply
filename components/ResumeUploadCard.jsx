"use client";

export default function ResumeUploadCard() {
  return (
    <div className="glass-card max-w-xl mx-auto rounded-2xl p-10 md:p-12 min-h-[220px] border border-dashed border-[rgba(255,255,255,0.1)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
      <div className="text-5xl mb-2 grayscale opacity-90 transition-opacity hover:opacity-100 duration-300">📁</div>
      <h3 className="text-xl font-medium text-gray-200 text-center">
        Drag & drop your resume here
      </h3>
      <p className="text-gray-400 text-center text-sm">or click to browse</p>
      <p className="text-xs text-gray-500 text-center mt-2">PDF only, max 5MB</p>
    </div>
  );
}
