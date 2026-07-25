"use client";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-[#050505] overflow-hidden">
      {/* Star Grid Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:24px_24px] star-layer-1 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:48px_48px] bg-[position:12px_12px] star-layer-2 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:72px_72px] bg-[position:36px_0] star-layer-3 pointer-events-none"></div>
      
      {/* Bottom-left Blob */}
      <div className="absolute -bottom-1/4 -left-1/4 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-tr from-[#7c3aed] via-[#6366f1] to-[#3b82f6] opacity-30 blur-[100px] animate-blob-float-1 mix-blend-screen"></div>
      
      {/* Top-right Blob */}
      <div className="absolute -top-1/4 -right-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-bl from-[#a855f7] via-[#6366f1] to-[#3b82f6] opacity-25 blur-[100px] animate-blob-float-2 mix-blend-screen"></div>
    </div>
  );
}
