import React from "react";
import { racingAudio } from "../services/racingAudio";

interface RotaryItem {
  id: string;
  label: string;
  turn: string;
  glowColor: string;
  arcColor: string;
  iconType: "car" | "flag" | "sliders" | "bars" | "tyre" | "trend" | "shield" | "ai";
}

interface MotorsportTogglePanelProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

const ROTARY_ITEMS: RotaryItem[] = [
  {
    id: "vehicle_twin",
    label: "4-WHEEL TWIN",
    turn: "T-CAR",
    glowColor: "#FF2A1A",
    arcColor: "#E10600",
    iconType: "car",
  },
  {
    id: "analyzer",
    label: "SESSIONS",
    turn: "T1-T2",
    glowColor: "#F1F5F9",
    arcColor: "#CBD5E1",
    iconType: "flag",
  },
  {
    id: "confounders",
    label: "CONFOUNDERS",
    turn: "T3-T4",
    glowColor: "#2979FF",
    arcColor: "#0070F3",
    iconType: "sliders",
  },
  {
    id: "degradation",
    label: "DEGRADATION",
    turn: "T6-T7",
    glowColor: "#FFB000",
    arcColor: "#FFA000",
    iconType: "bars",
  },
  {
    id: "tyre_memory",
    label: "TYRE MEMORY",
    turn: "T9",
    glowColor: "#00E676",
    arcColor: "#00C853",
    iconType: "tyre",
  },
  {
    id: "prediction",
    label: "PREDICTION",
    turn: "T10-13",
    glowColor: "#C084FC",
    arcColor: "#9333EA",
    iconType: "trend",
  },
  {
    id: "validation",
    label: "VALIDATION",
    turn: "T15",
    glowColor: "#FF1744",
    arcColor: "#E10600",
    iconType: "shield",
  },
  {
    id: "model_evidence",
    label: "AI EVIDENCE",
    turn: "T16-18",
    glowColor: "#00E5FF",
    arcColor: "#00B0FF",
    iconType: "ai",
  },
];

// Backlit laser-etched F1 telemetry icon renderer
const RotaryIcon: React.FC<{ type: string; color: string; isActive: boolean }> = ({
  type,
  color,
  isActive,
}) => {
  const glowFilter = isActive
    ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 9px ${color})`
    : `drop-shadow(0 0 2px ${color})`;

  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200"
      style={{
        filter: glowFilter,
        color: color,
        opacity: isActive ? 1.0 : 0.82,
      }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "car" && (
        <path
          d="M5 16h14a2 2 0 0 0 2-2l-1.5-5.5a3 3 0 0 0-2.8-2.1H7.3a3 3 0 0 0-2.8 2.1L3 14a2 2 0 0 0 2 2z M7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM5 11h14"
          strokeWidth="1.8"
        />
      )}
      {type === "flag" && (
        <path
          d="M4 22v-7m0 0a4 4 0 0 1 4-2c2 0 4 2 6 2s4-2 6-2V3c-2 0-4 2-6 2s-4-2-6-2a4 4 0 0 0-4 2v10z M4 9h16 M10 4v8 M16 4v8"
          strokeWidth="1.8"
        />
      )}
      {type === "sliders" && (
        <path
          d="M4 14h6 M4 8h10 M4 18h14 M14 6v4 M8 12v4 M16 16v4"
          strokeWidth="2"
        />
      )}
      {type === "bars" && (
        <path
          d="M6 20v-5 M10 20v-9 M14 20v-13 M18 20v-7"
          strokeWidth="2.4"
        />
      )}
      {type === "tyre" && (
        <g strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
        </g>
      )}
      {type === "trend" && (
        <path
          d="M3 18l6-6 4 4 7-7 M14 9h6v6"
          strokeWidth="2.2"
        />
      )}
      {type === "shield" && (
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4"
          strokeWidth="2"
        />
      )}
      {type === "ai" && (
        <g strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="2.5" fill="currentColor" />
        </g>
      )}
    </svg>
  );
};

export const MotorsportTogglePanel: React.FC<MotorsportTogglePanelProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const handleToggle = (tabId: string) => {
    if (tabId !== currentTab) {
      racingAudio.playShift("DOWN");
      onSelectTab(tabId);
    }
  };

  return (
    /* =========================================================================
       UNIFIED F1 MOTORSPORT COCKPIT CONSOLE (REFERENCE IMAGE 4 TARGET)
       Single continuous titanium enclosure integrating TreadTrace branding &
       all 8 rotary navigation dials with zero wasted top padding.
       ========================================================================= */
    <div className="relative w-full bg-gradient-to-r from-[#0C1017] via-[#0E131C] to-[#0A0D13] rounded-2xl border border-[#2B3548]/90 shadow-[0_6px_28px_rgba(0,0,0,0.95),0_2px_14px_rgba(225,6,0,0.22)] py-1.5 px-3 sm:px-4 flex items-center justify-between select-none overflow-x-auto">
      {/* Outer Enclosure Corner Allen / Hex Bolts */}
      <div className="absolute top-1.5 left-2 f1-hex-bolt pointer-events-none" />
      <div className="absolute bottom-1.5 left-2 f1-hex-bolt pointer-events-none" />
      <div className="absolute top-1.5 right-2 f1-hex-bolt pointer-events-none" />
      <div className="absolute bottom-1.5 right-2 f1-hex-bolt pointer-events-none" />

      {/* Top & Bottom Machined Metallic Edge Bevels */}
      <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-8 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E10600]/40 to-transparent pointer-events-none" />

      {/* =======================================================================
          1. INTEGRATED TREADTRACE BRANDING (REFERENCE IMAGE 3 & 4)
          Features authentic front F1 car + red tachometer arc logo + metallic text
          ======================================================================= */}
      <div
        onClick={() => handleToggle("vehicle_twin")}
        className="flex flex-col items-center justify-center pl-2 pr-3 sm:pr-4 py-0.5 flex-shrink-0 cursor-pointer group select-none relative transition-transform active:scale-98"
        title="TreadTrace F1-Spec AI Telemetry Platform"
      >
        {/* Authentic TreadTrace Logo: F1 Car + Red Tachometer Arch */}
        <div className="relative flex items-center justify-center">
          <img
            src="/images/treadtrace_logo.png"
            alt="TreadTrace"
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(225,6,0,0.65)] transition-transform group-hover:scale-105"
          />
        </div>

        {/* Brand Typography & F1-SPEC AI Badge */}
        <div className="flex flex-col items-center text-center -mt-0.5 leading-none">
          <span className="text-[11px] sm:text-xs font-black italic tracking-widest text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            TREAD<span className="text-[#E10600]">TRACE</span>
          </span>
          <div className="mt-0.5 flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[7px] sm:text-[7.5px] font-mono font-black tracking-wider bg-gradient-to-r from-[#B91C1C] to-[#E10600] text-white border border-[#FF6B6B]/40 shadow-[0_0_6px_rgba(225,6,0,0.5)]">
            <span>F1-SPEC AI</span>
          </div>
        </div>
      </div>

      {/* Machined Vertical Divider */}
      <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-[#2E3A4E] to-transparent mx-1 sm:mx-2 lg:mx-3 flex-shrink-0" />

      {/* =======================================================================
          2. 8 COMPACT ROTARY DIALS (COMPACT VERTICAL LAYOUT, MINIMAL TOP GAP)
          ======================================================================= */}
      <div className="flex-1 grid grid-cols-8 gap-1 sm:gap-2 items-center justify-between min-w-[620px] lg:min-w-0">
        {ROTARY_ITEMS.map((item, idx) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item.id)}
              className={`group flex flex-col items-center justify-center cursor-pointer outline-none transition-transform active:scale-95 focus:outline-none relative py-0.5 ${
                idx < ROTARY_ITEMS.length - 1 ? "border-r border-[#1B222E]/60 pr-1 sm:pr-1.5" : ""
              }`}
              title={`${item.label} (${item.turn}) — Click to rotate knob`}
            >
              {/* Precision Rotary Knob Assembly */}
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center select-none">
                {/* Outer Knurled Gunmetal Dial Bezel */}
                <div className="absolute inset-0 rounded-full f1-rotary-bezel flex items-center justify-center">
                  {/* Calibrated Perimeter Index Ticks */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none opacity-40">
                    <span className="absolute top-0.5 w-[1.5px] h-1 bg-white/70 rounded-full" />
                    <span className="absolute bottom-0.5 w-[1.5px] h-1 bg-white/70 rounded-full" />
                    <span className="absolute left-0.5 w-1 h-[1.5px] bg-white/70 rounded-full" />
                    <span className="absolute right-0.5 w-1 h-[1.5px] bg-white/70 rounded-full" />
                  </div>
                </div>

                {/* Segmented Illuminated Neon Arc Ring */}
                <div
                  className="absolute inset-1 rounded-full pointer-events-none transition-all duration-200"
                  style={{
                    border: `2px solid ${item.arcColor}`,
                    boxShadow: isActive
                      ? `0 0 10px ${item.glowColor}, inset 0 0 5px ${item.glowColor}`
                      : `0 0 3px ${item.glowColor}44`,
                    opacity: isActive ? 1.0 : 0.5,
                    clipPath: isActive
                      ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
                      : "polygon(15% 0%, 85% 0%, 100% 70%, 50% 100%, 0% 70%)",
                  }}
                />

                {/* Center Rotary Cap with Backlit Laser-Etched Icon */}
                <div
                  className={`relative w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full f1-rotary-cap flex items-center justify-center ${
                    isActive ? "f1-rotary-active" : "f1-rotary-inactive"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `inset 0 0 8px ${item.glowColor}88, 0 0 6px ${item.glowColor}44`
                      : "inset 0 1px 2px rgba(255,255,255,0.25)",
                  }}
                >
                  {/* Backlit Icon */}
                  <div className="relative z-10">
                    <RotaryIcon
                      type={item.iconType}
                      color={item.glowColor}
                      isActive={isActive}
                    />
                  </div>

                  {/* Acrylic Specular Top Glint */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Sub-Labels Directly Snug Beneath Rotary Knob */}
              <div className="flex flex-col items-center text-center mt-0.5 leading-tight">
                <span
                  className={`text-[8px] sm:text-[9px] font-black tracking-wide whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? "text-white italic drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]"
                      : "text-[#94A3B8] group-hover:text-white"
                  }`}
                  style={{
                    color: isActive ? item.glowColor : undefined,
                  }}
                >
                  {item.label}
                </span>
                <span
                  className={`text-[6.5px] sm:text-[7px] font-bold font-mono tracking-wider transition-colors duration-150 ${
                    isActive ? "text-white/95" : "text-[#475569] group-hover:text-[#94A3B8]"
                  }`}
                >
                  {item.turn}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
