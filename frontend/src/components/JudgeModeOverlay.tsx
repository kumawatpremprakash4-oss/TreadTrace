import React from "react";
import { Award, ChevronLeft, ChevronRight, X, Radio } from "lucide-react";

export interface JudgeStep {
  step: number;
  title: string;
  tabTarget: string;
  narrative: string;
  actionHint: string;
  keyTakeaway: string;
}

export const JUDGE_STEPS: JudgeStep[] = [
  {
    step: 1,
    title: "1. 4-WHEEL DIGITAL TWIN & RACE ENGINEERING",
    tabTarget: "vehicle_twin",
    narrative: "During practice, lap times change due to fuel burn-off (-0.033s/kg), track rubbering (-0.55s), dirty air traffic (+0.8s), and weather. A naive engineer looking at raw lap times concludes the tyre is barely degrading or unpredictable.",
    actionHint: "Inspect independent 4-corner telemetry, corner loads, and active pit-wall instruments.",
    keyTakeaway: "Observed Lap Time ≠ Tyre Degradation. Never confuse slower laps with tyre wear.",
  },
  {
    step: 2,
    title: "2. PRACTICE TELEMETRY & DATA QUALITY",
    tabTarget: "analyzer",
    narrative: "Real telemetry contains compromised laps. TreadTrace ingests the session and automatically classifies laps into GREEN, TRAFFIC, YELLOW FLAG, and PIT IN/OUT laps.",
    actionHint: "Click any lap in the table to inspect the classifier's evidence reasoning.",
    keyTakeaway: "Compromised laps are automatically filtered before fitting degradation curves.",
  },
  {
    step: 3,
    title: "3. CONFOUNDER DETECTION ENGINE",
    tabTarget: "confounders",
    narrative: "Here the AI isolates each physical component: Fuel load effect, track evolution curve, dirty air penalty, and driver noise. For every lap, we compute how much time was lost to the tyre vs external factors.",
    actionHint: "Notice the waterfall breakdown: Lap 14 had +0.31s tyre deg masked by -0.18s fuel burn.",
    keyTakeaway: "Multivariate Huber regression decouples physical confounders with zero data leakage.",
  },
  {
    step: 4,
    title: "4. ISOLATE TRUE TYRE SIGNAL",
    tabTarget: "degradation",
    narrative: "Witness the core innovation: Switch between 'Raw Lap Times' (noisy, misleading) and 'TreadTrace Normalised Signal' (clean, isolated tyre decay).",
    actionHint: "Toggle between Raw and Normalised views on the degradation chart.",
    keyTakeaway: "TreadTrace cuts estimation error by over 90% compared to naive lap-time tracking.",
  },
  {
    step: 5,
    title: "5. CLEAN DEGRADATION CURVES & UNCERTAINTY",
    tabTarget: "degradation",
    narrative: "The model fits compound-specific wear rates (Soft 0.068 s/lap, Medium 0.041 s/lap, Hard 0.024 s/lap) with strict 95% confidence intervals and non-linear cliff onset estimation.",
    actionHint: "Switch between Soft, Medium, and Hard compounds to view their wear rates.",
    keyTakeaway: "Analytical curves are generated from model regression, never hard-coded.",
  },
  {
    step: 6,
    title: "6. TYRE MEMORY & DIGITAL TWIN",
    tabTarget: "tyre_memory",
    narrative: "Every tyre set has a persistent Digital Twin storing accumulated wear, heat cycles, thermal history, and remaining useful life (RUL).",
    actionHint: "Open SET-M01-FP2 to view its heat cycle timeline and evidence audit trail.",
    keyTakeaway: "Tyre Memory is a digital evidence history tracking the tyre's true physical state.",
  },
  {
    step: 7,
    title: "7. 4-WHEEL VEHICLE DIGITAL TWIN & CORNER ASYMMETRY",
    tabTarget: "vehicle_twin",
    narrative: "Inspect the 3D Formula car from an elevated isometric perspective. Notice how Silverstone's clockwise layout isolates Rear Left (RL) as critical (91% risk, 2 laps RUL) while Front Right is warning and FL/RR remain optimal.",
    actionHint: "Click the Rear Left (RL) wheel in 3D to jump directly into its forensic degradation curve and thermal panel.",
    keyTakeaway: "A tyre set is not monolithic. Independent corner load factors isolate asymmetric tyre destruction.",
  },
  {
    step: 8,
    title: "8. FORWARD STINT PREDICTION",
    tabTarget: "prediction",
    narrative: "Before the race, race engineers simulate prospective stints: adjust stint length, starting fuel, and track temperature to see projected pace, cliff onset, and compound crossover points.",
    actionHint: "Move the fuel or temperature slider to see the projected lap-by-lap pace update live.",
    keyTakeaway: "Identifies the exact lap where Medium tyres become faster than degrading Soft tyres.",
  },
  {
    step: 9,
    title: "9. RACE DAY TELEMETRY INGESTION",
    tabTarget: "validation",
    narrative: "Race day arrives. The car runs a 52-lap Grand Prix. The real test of an AI system is whether practice predictions survive race-day reality.",
    actionHint: "Inspect the predicted vs actual race pace comparison chart.",
    keyTakeaway: "Practice creates the prediction; race day creates the truth.",
  },
  {
    step: 10,
    title: "10. ROOT-CAUSE ERROR ATTRIBUTION",
    tabTarget: "validation",
    narrative: "Instead of just reporting an error, TreadTrace explains WHY. On Soft tyres, actual wear was higher because race track temperature was +4.3°C hotter than FP2, accelerating thermal blistering.",
    actionHint: "Read the AI diagnostic explanation box under the Stint 1 Soft validation card.",
    keyTakeaway: "Evidence-driven explainability without hallucinated causality.",
  },
  {
    step: 11,
    title: "11. CLOSED-LOOP LEARNING UPDATE",
    tabTarget: "validation",
    narrative: "Click 'Apply Race Calibration to Tyre Twin' to complete the closed loop. The system calibrates the tyre digital twins with race evidence, ensuring the next prediction is even sharper.",
    actionHint: "Click the red 'Apply Race Calibration to Tyre Twin' button.",
    keyTakeaway: "A self-improving motorsport intelligence system that learns with every lap.",
  },
];

interface JudgeModeOverlayProps {
  currentStepIndex: number;
  onSetStepIndex: (idx: number) => void;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const JudgeModeOverlay: React.FC<JudgeModeOverlayProps> = ({
  currentStepIndex,
  onSetStepIndex,
  onClose,
  onNavigateTab,
}) => {
  const currentStep = JUDGE_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < JUDGE_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      onSetStepIndex(nextIdx);
      onNavigateTab(JUDGE_STEPS[nextIdx].tabTarget);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      onSetStepIndex(prevIdx);
      onNavigateTab(JUDGE_STEPS[prevIdx].tabTarget);
    }
  };

  return (
    <div className="bg-[#101216]/95 border-b-2 border-[#FFB000] backdrop-blur-md sticky top-[82px] z-30 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.7)] select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded bg-[#FFB000] text-black font-black flex-shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,176,0,0.5)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FFB000] bg-[#FFB000]/10 border border-[#FFB000]/30 px-2 py-0.5 rounded">
                PIT COMMS • STEP {currentStep.step} / {JUDGE_STEPS.length}
              </span>
              <span className="font-black text-white text-sm font-mono tracking-tight">{currentStep.title}</span>
            </div>
            <p className="text-xs text-[#9A9FA8] mt-1 max-w-3xl leading-relaxed">
              {currentStep.narrative}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-mono">
              <span className="text-[#FFB000] font-bold">
                🎯 ACTION: {currentStep.actionHint}
              </span>
              <span className="text-[#222733]">•</span>
              <span className="text-[#00E5FF] font-bold">
                💡 TAKEAWAY: {currentStep.keyTakeaway}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0 font-mono">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1 transition-all ${
              currentStepIndex === 0
                ? "bg-[#17191D] text-[#606775] cursor-not-allowed border border-[#222733]"
                : "bg-[#17191D] text-white hover:bg-[#222733] border border-[#363E4F] cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>PREV</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === JUDGE_STEPS.length - 1}
            className={`px-4 py-1.5 rounded text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 transition-all cursor-pointer ${
              currentStepIndex === JUDGE_STEPS.length - 1
                ? "bg-[#00E676] text-black shadow-[0_0_12px_rgba(0,230,118,0.5)]"
                : "bg-[#FFB000] hover:bg-[#FFC107] text-black shadow-[0_0_12px_rgba(255,176,0,0.5)]"
            }`}
          >
            <span>{currentStepIndex === JUDGE_STEPS.length - 1 ? "TOUR FINISHED" : "NEXT STEP"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#606775] hover:text-white rounded hover:bg-[#1C2029] transition-colors cursor-pointer"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
