"use client";

import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16 sm:py-24 space-y-8">
          <div
            className="rounded-2xl p-6 sm:p-10"
            style={{
              background: "rgba(14,14,24,0.72)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(139,92,246,0.30)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.75), 0 0 60px rgba(139,92,246,0.10)",
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Refund Policy</h1>
              <button
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.6)] hover:text-white border border-[rgba(255,255,255,0.1)]"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 stroke-current" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 text-sm text-[rgba(255,255,255,0.70)] leading-relaxed max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">1. Technical Failures</h2>
                <p>If you experience technical issues on the QuickApply platform that completely prevent you from fetching your job matches after a successful payment, you are eligible for a full refund within 24 hours of the transaction.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">2. Satisfaction & Results</h2>
                <p>Because job listings depend on third-party sources and current market availability, we cannot guarantee that you will find a suitable job or that you will like the provided results. Therefore, refunds are not issued based on dissatisfaction with the job matches themselves.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">3. How to Request a Refund</h2>
                <p>To request a refund for a technical failure, please email us at <a href="mailto:harmansinghcoder@gmail.com" className="text-[#a855f7] hover:underline">harmansinghcoder@gmail.com</a> with your Payment ID (provided by Razorpay) and a brief description of the issue. We will process eligible requests within 5-7 business days.</p>
              </section>

              <div className="pt-4 mt-6 border-t border-[rgba(255,255,255,0.07)] text-xs text-[rgba(255,255,255,0.4)]">
                Effective Date: September 2026
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
