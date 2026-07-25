"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden relative flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col justify-center items-center px-4 max-w-5xl mx-auto w-full pb-6">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
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

      <div id="how-it-works" className="qa-modal">
        <a href="#" className="qa-modalBackdrop" aria-label="Close modal"></a>

        <div className="qa-modalCard">
          <div className="qa-modalHeader">
            <h2 className="qa-modalTitle">How it Works</h2>
            <a href="#" className="qa-modalClose" aria-label="Close">✕</a>
          </div>

          <ol className="qa-modalList">
            <li><span className="qa-step">1</span> Upload your resume (PDF).</li>
            <li><span className="qa-step">2</span> We analyze your resume and extract key skills.</li>
            <li><span className="qa-step">3</span> You get matched with relevant jobs instantly.</li>
            <li><span className="qa-step">4</span> Click “Apply” to go to the official job link.</li>
          </ol>

          <p className="qa-modalNote">
            Tip: Use a clean PDF resume for best results.
          </p>
        </div>
      </div>
    </div>
  );
}
