"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-28">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6 tracking-tight">
            QuickApply
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10">
            Upload your resume. Get matched with perfect jobs instantly.
          </p>
          <Link href="/upload" className="inline-block glass-card px-7 py-3 rounded-full text-base font-medium transition-all hover:scale-[1.02] hover:-translate-y-1 text-gray-100">
            Upload Resume
          </Link>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="glass-card p-6 rounded-xl text-center hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-purple to-primary-blue rounded-full flex items-center justify-center text-lg font-medium text-white mb-5 shadow-sm opacity-90">
                1
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-200">Upload Resume</h3>
              <p className="text-sm text-gray-500">Drop your PDF resume</p>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-6 rounded-xl text-center hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-purple to-primary-blue rounded-full flex items-center justify-center text-lg font-medium text-white mb-5 shadow-sm opacity-90">
                2
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-200">AI Analysis</h3>
              <p className="text-sm text-gray-500">We extract your skills</p>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-6 rounded-xl text-center hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-purple to-primary-blue rounded-full flex items-center justify-center text-lg font-medium text-white mb-5 shadow-sm opacity-90">
                3
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-200">Get Matched</h3>
              <p className="text-sm text-gray-500">Find perfect job matches</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
