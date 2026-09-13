import React from "react";
import { Award, ShieldAlert, ArrowLeft } from "lucide-react";
import { MotorsportTogglePanel } from "./MotorsportTogglePanel";

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  judgeMode: boolean;
  onToggleJudgeMode: () => void;
  onOpenProvenance: () => void;
  onReturnToLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  judgeMode,
  onToggleJudgeMode,
  onOpenProvenance,
  onReturnToLanding,
}) => {
  return (
    <header className="bg-[#07090D] border-b border-[#1E232B] sticky top-0 z-40 select-none shadow-2xl">
      {/* Top Utility Strip */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-[#181C24] text-[10px] font-mono text-[#9A9FA8] relative z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onReturnToLanding}
            className="flex items-center space-x-1 text-[#606775] hover:text-[#00E5FF] transition-colors cursor-pointer"
            title="Return to cinematic landing intro"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>EXIT TO HERO</span>
          </button>
          <span className="text-[#222733]">|</span>
          <div className="flex items-center space-x-1.5 text-white font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
            <span>PIT WALL ONLINE</span>
          </div>
          <span className="text-[#222733] hidden sm:inline">|</span>
          <span className="hidden sm:inline text-[#9A9FA8]">CIRCUIT: SILVERSTONE GP (5.891 KM)</span>
          <span className="text-[#222733] hidden md:inline">|</span>
          <span className="hidden md:inline text-[#9A9FA8]">DRIVER: #23 A. ALBON</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Provenance Badge (Clickable) */}
          <button
            onClick={onOpenProvenance}
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#15181E] hover:bg-[#1C2029] border border-[#222733] text-[#FFB000] font-mono text-[10px] transition-colors cursor-pointer"
            title="Click to view full dataset provenance and model audit"
          >
            <ShieldAlert className="w-3 h-3 text-[#FFB000]" />
            <span>SYNTHETIC DEMO DATA</span>
          </button>

          {/* Judge Mode Switch */}
          <button
            onClick={onToggleJudgeMode}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer ${
              judgeMode
                ? "bg-[#FFB000] text-black ring-2 ring-[#FFB000] shadow-[0_0_12px_rgba(255,176,0,0.5)]"
                : "bg-[#15181E] hover:bg-[#1E232B] text-[#9A9FA8] hover:text-white border border-[#222733]"
            }`}
          >
            <Award className="w-3 h-3" />
            <span>JUDGE TOUR {judgeMode ? "ACTIVE" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Main Pit Wall Motorsport Navigation Area with Cinematic F1 Night Background */}
      <div className="relative overflow-hidden">
        {/* Cinematic F1 Night Race Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 pointer-events-none select-none scale-105"
          style={{ backgroundImage: "url('/images/f1_header_bg.jpg')" }}
        />

        {/* Soft atmospheric gradient masks for 100% telemetry contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A0E]/95 via-[#080B10]/35 to-[#07080A]/95 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(7,8,10,0.15)_0%,_rgba(7,8,10,0.85)_85%)] pointer-events-none" />

        {/* Compact Physical Motorsport Rotary Control Panel */}
        <div className="max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6 pt-0.5 pb-1 relative z-10">
          <MotorsportTogglePanel
            currentTab={currentTab}
            onSelectTab={onSelectTab}
          />
        </div>
      </div>
    </header>
  );
};

