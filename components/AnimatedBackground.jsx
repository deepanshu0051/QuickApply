"use client";

export default function AnimatedBackground() {
  return (
    <div
      className="fixed top-0 left-0 w-[100vw] h-[100vh] pointer-events-none overflow-hidden"
      style={{ zIndex: 0, background: "#080808" }}
    >
      {/* ── Dot Grid Pattern ── */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px),
            radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px),
            radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px, 32px 32px, 48px 48px',
          backgroundPosition: '0 0, 16px 16px, 8px 24px',
        }}
      />

      {/* ── Blinking Stars ── */}
      <div 
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.20) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          backgroundPosition: "60px 60px",
          animationDuration: "6s",
        }}
      />
      
      {/* ── Purple Blob (Left) ── */}
      <div 
        className="absolute rounded-full pointer-events-none animate-blob-float-1"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.20) 0%, transparent 70%)",
          filter: "blur(130px)",
          top: "10%",
          left: "-10%",
          opacity: 0.20
        }}
      />
      
      {/* ── Blue Blob (Right) ── */}
      <div 
        className="absolute rounded-full pointer-events-none animate-blob-float-2"
        style={{
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)",
          filter: "blur(130px)",
          bottom: "10%",
          right: "-5%",
          opacity: 0.15
        }}
      />
    </div>
  );
}
