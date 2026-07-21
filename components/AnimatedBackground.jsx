"use client";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-[#080808] overflow-hidden">
      {/* Dot Grid Layer */}
      <div className="absolute inset-0 dot-grid"></div>
      
      {/* Soft gradient wave left (Purple) */}
      <div className="absolute top-0 left-0 w-[1200px] h-[1200px] rounded-full bg-primary-purple opacity-[0.025] blur-[120px] -translate-x-[40%] -translate-y-[40%]"></div>
      
      {/* Soft gradient wave right (Blue) */}
      <div className="absolute bottom-0 right-0 w-[1200px] h-[1200px] rounded-full bg-primary-blue opacity-[0.025] blur-[120px] translate-x-[30%] translate-y-[30%]"></div>
    </div>
  );
}
