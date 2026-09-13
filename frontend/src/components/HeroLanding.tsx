import React from "react";
import { ArrowRight, Activity, Zap, ShieldAlert, Award } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { HeroCinematicDriftBackground } from "./HeroCinematicDriftBackground";

interface HeroLandingProps {
  onEnterGarage: () => void;
  onLaunchJudgeTour: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({ onEnterGarage, onLaunchJudgeTour }) => {
  return (
    <div className="relative min-h-screen bg-[#08090B] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Cinematic F1 Night Drift Background Animation */}
      <HeroCinematicDriftBackground />

      {/* Top Bar on Landing */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <BrandLogo size="lg" showTagline={true} />

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded bg-[#101216] border border-[#222733] text-[11px] font-mono text-[#9A9FA8]">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span>CIRCUIT: SILVERSTONE GP • FP2 ANALYSIS</span>
          </div>

          <button
            onClick={onLaunchJudgeTour}
            className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(255,176,0,0.35)]"
          >
            <Award className="w-4 h-4" />
            <span>JUDGE TOUR (2 MIN)</span>
          </button>
        </div>
      </header>

      {/* Main Massive Hero Experience */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center my-auto">
        <div className="max-w-4xl space-y-6">
          {/* Engineering Category Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#E10600]/15 border border-[#E10600]/40 text-[#FF2A1A] text-xs font-mono font-black uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            <span>F1-TIER MOTORSPORT AI INTELLIGENCE</span>
          </div>

          {/* Aggressive Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.92] italic font-mono text-[#F5F5F5]">
            DON'T MISTAKE
            <span className="block text-[#E10600] text-glow-red">SLOWER LAPS</span>
            FOR TYRE WEAR.
          </h1>

          {/* Subheading Signal Statement */}
          <div className="border-l-4 border-[#E10600] pl-4 space-y-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-mono">
              TREADTRACE ISOLATES THE TYRE SIGNAL.
            </h2>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={onEnterGarage}
              className="px-8 py-4 rounded-lg bg-[#E10600] hover:bg-[#FF2A1A] text-white font-black text-sm uppercase tracking-wider italic font-mono flex items-center space-x-3 transition-all glow-red shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>ENTER THE GARAGE</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onEnterGarage}
              className="px-6 py-4 rounded-lg bg-[#101216] hover:bg-[#1C2029] text-white border border-[#222733] font-bold text-sm uppercase tracking-wider font-mono flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#00E5FF]" />
              <span>WATCH THE SIGNAL</span>
            </button>
          </div>

          {/* Formula Comparison Strip */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-[#101216]/80 border border-[#222733]">
              <span className="text-[#606775] block text-[10px]">FUEL COMPENSATION</span>
              <span className="text-white font-bold text-sm">+0.033 s/kg</span>
            </div>
            <div className="p-3 rounded bg-[#101216]/80 border border-[#222733]">
              <span className="text-[#606775] block text-[10px]">TRACK EVOLUTION</span>
              <span className="text-[#00E5FF] font-bold text-sm">-0.55 s Grip Gain</span>
            </div>
            <div className="p-3 rounded bg-[#101216]/80 border border-[#222733]">
              <span className="text-[#606775] block text-[10px]">A/B ERROR REDUCTION</span>
              <span className="text-[#00E676] font-bold text-sm">&gt;90% vs Naive</span>
            </div>
            <div className="p-3 rounded bg-[#101216]/80 border border-[#222733]">
              <span className="text-[#606775] block text-[10px]">RACE VALIDATION</span>
              <span className="text-[#FFB000] font-bold text-sm">0.054 s MAE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Legal & Provenance Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 border-t border-[#1E232B] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#606775]">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FFB000]" />
          <span>SYNTHETIC TELEMETRY DEMONSTRATION • SILVERSTONE GP FORMULA BLUEPRINT</span>
        </div>
        <div className="mt-2 sm:mt-0 text-[#9A9FA8]">
          MODEL-DRIVEN ANALYSIS • CLOSED-LOOP DIGITAL TWIN
        </div>
      </footer>
    </div>
  );
};
