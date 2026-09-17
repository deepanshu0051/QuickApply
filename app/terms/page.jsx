"use client";

import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function TermsPage() {
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms & Conditions</h1>
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
                <h2 className="text-lg font-semibold text-white mb-2">1. Service Description</h2>
                <p>QuickApply provides AI-powered resume scoring and discovery links to matching jobs. We do not host these jobs but aggregate them from third-party sources.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">2. Payments</h2>
                <p>Accessing the matched jobs requires a one-time payment of $1 (charged in INR at the current exchange rate). This is a single transaction, not a subscription.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">3. Re-Upload &amp; Re-Payment Policy</h2>
                <p>Each resume upload and job search is treated as a separate transaction. If you choose to upload a new resume after already paying for a job search, you will be required to complete payment again for the new resume. QuickApply does not carry forward previous payments to new resume uploads. We recommend reviewing your resume carefully before uploading to avoid unnecessary charges.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">4. No Guarantee</h2>
                <p>We provide matching tools and resources but cannot guarantee any job offers, interviews, or successful hiring outcomes. Market availability dictates job listings.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">5. Acceptable Use</h2>
                <p>You agree not to abuse, scrape, reverse-engineer, or resell the data or services provided by QuickApply. Any such action will result in immediate termination of access without refund.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">6. Limitation of Liability</h2>
                <p>QuickApply shall not be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use our service.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-white mb-2">7. Contact</h2>
                <p>If you have any questions, contact us at <a href="mailto:harmansinghcoder@gmail.com" className="text-[#a855f7] hover:underline">harmansinghcoder@gmail.com</a>.</p>
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
