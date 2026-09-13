import React, { useState } from "react";
import { Zap, CheckCircle2, ShieldCheck, Flame, Layers, ArrowRight } from "lucide-react";

interface SignatureIsolateInteractionProps {
  onIsolateComplete?: () => void;
  fuelSens: number;
  trackEvoGain: number;
  degRate: number;
}

export const SignatureIsolateInteraction: React.FC<SignatureIsolateInteractionProps> = ({
  onIsolateComplete,
  fuelSens = 0.033,
  trackEvoGain = 0.55,
  degRate = 0.041,
}) => {
  const [isIsolating, setIsIsolating] = useState<boolean>(false);
  const [step, setStep] = useState<"IDLE" | "SEPARATING_FUEL" | "SEPARATING_TRAFFIC" | "SEPARATING_EVO" | "LOCKED">("IDLE");

  const handleTrigger = () => {
    setIsIsolating(true);
    setStep("SEPARATING_FUEL");

    setTimeout(() => {
      setStep("SEPARATING_TRAFFIC");
    }, 600);

    setTimeout(() => {
      setStep("SEPARATING_EVO");
    }, 1200);

    setTimeout(() => {
      setStep("LOCKED");
      setIsIsolating(false);
      if (onIsolateComplete) onIsolateComplete();
    }, 1800);
  };

  return (
    <div className="bg-[#101216] border border-[#222733] rounded-xl p-5 shadow-lg relative overflow-hidden">
      {/* Background scanline */}
      <div className="absolute inset-0 bg-telemetry-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E10600] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#FF2A1A] uppercase tracking-wider">
              SIGNATURE ANALYTICAL ACTION
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white font-mono mt-1">
            STRIP THE NOISE. ISOLATE TRUE TYRE SIGNAL.
          </h2>
        </div>

        <button
          onClick={handleTrigger}
          disabled={isIsolating}
          className={`px-6 py-3.5 rounded-lg text-xs font-black uppercase tracking-wider font-mono italic flex items-center space-x-2 transition-all cursor-pointer shadow-lg self-start md:self-center ${
            step === "LOCKED"
              ? "bg-[#00E676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]"
              : isIsolating
              ? "bg-[#FF2A1A] text-white animate-pulse"
              : "bg-[#E10600] hover:bg-[#FF2A1A] text-white glow-red hover:-translate-y-0.5"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>
            {step === "IDLE"
              ? "ISOLATE TRUE TYRE SIGNAL"
              : step === "SEPARATING_FUEL"
              ? "SEPARATING FUEL BURNOFF (-0.033s/kg)..."
              : step === "SEPARATING_TRAFFIC"
              ? "PEELING DIRTY AIR TRAFFIC..."
              : step === "SEPARATING_EVO"
              ? "OFFSETTING TRACK RUBBERING (-0.55s)..."
              : "SIGNAL LOCKED • TRUE WEAR DETECTED"}
          </span>
        </button>
      </div>

      {/* Real-Time Processing HUD Feedback */}
      {step !== "IDLE" && (
        <div className="mt-4 pt-4 border-t border-[#1E232B] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono animate-fadeIn">
          <div className="p-2.5 rounded border transition-all bg-[#17191D] border-[#00E5FF]/40 text-white">
            <span className="text-[10px] text-[#606775] block">FUEL WEIGHT ISOLATED</span>
            <span className="font-bold text-[#00E5FF]">+{((fuelSens ?? 0.033)).toFixed(4)} s / kg</span>
          </div>

          <div className={`p-2.5 rounded border transition-all ${
            step === "SEPARATING_TRAFFIC" || step === "SEPARATING_EVO" || step === "LOCKED"
              ? "bg-[#17191D] border-[#FFB000]/40 text-white"
              : "bg-[#08090B] border-[#222733] text-[#606775]"
          }`}>
            <span className="text-[10px] text-[#606775] block">TURBULENT WAKE FILTERED</span>
            <span className="font-bold text-[#FFB000]">8 Invalid Laps Excluded</span>
          </div>

          <div className={`p-2.5 rounded border transition-all ${
            step === "SEPARATING_EVO" || step === "LOCKED"
              ? "bg-[#17191D] border-[#00E676]/40 text-white"
              : "bg-[#08090B] border-[#222733] text-[#606775]"
          }`}>
            <span className="text-[10px] text-[#606775] block">TRACK RUBBER DECOUPLED</span>
            <span className="font-bold text-[#00E676]">-{(trackEvoGain ?? 0.55).toFixed(2)}s Grip Shift</span>
          </div>

          <div className={`p-2.5 rounded border transition-all ${
            step === "LOCKED"
              ? "bg-[#E10600]/20 border-[#E10600] text-white glow-red-sm"
              : "bg-[#08090B] border-[#222733] text-[#606775]"
          }`}>
            <span className="text-[10px] text-[#FF2A1A] block font-bold">TRUE MECHANICAL DEG</span>
            <span className="font-black text-[#FF2A1A] text-sm">+{(degRate ?? 0.041).toFixed(4)} s / LAP</span>
          </div>
        </div>
      )}
    </div>
  );
};
