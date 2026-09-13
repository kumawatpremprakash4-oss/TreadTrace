import React, { useEffect, useState } from "react";
import { CIRCUIT_SECTORS, CircuitSectorInfo } from "../constants/circuit";
import { racingAudio } from "../services/racingAudio";
import { Zap, Gauge, Flame, Compass } from "lucide-react";

interface TrackTransitionOverlayProps {
  active: boolean;
  targetTab: string;
  previousTab?: string;
  onComplete: () => void;
}

export const TrackTransitionOverlay: React.FC<TrackTransitionOverlayProps> = ({
  active,
  targetTab,
  previousTab,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  const targetSector: CircuitSectorInfo =
    CIRCUIT_SECTORS[targetTab] || CIRCUIT_SECTORS.vehicle_twin;
  const prevSector: CircuitSectorInfo | undefined = previousTab
    ? CIRCUIT_SECTORS[previousTab]
    : undefined;

  const isUpshift = (prevSector?.gear || 4) <= targetSector.gear;

  useEffect(() => {
    if (active) {
      setVisible(true);
      racingAudio.playShift(isUpshift ? "UP" : "DOWN");

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 460);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [active, targetTab]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between overflow-hidden select-none animate-shift-vibrate">
      {/* 1. Top Rumble Kerb (Red & White Curbs rushing past) */}
      <div className="relative w-full h-7 rumble-kerb-top animate-kerb-fast border-b-2 border-black/40">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute left-6 top-1 text-[10px] font-mono font-black text-white/90 uppercase tracking-widest drop-shadow-md">
          ▲ TRACK EDGE • CURB STRIKE {targetSector.turnNumber}
        </div>
      </div>

      {/* 2. Central High-Speed Asphalt & Telemetry Cockpit */}
      <div className="relative flex-1 w-full flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
        {/* Dark Asphalt Texture with speed blur lines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(225,6,0,0.15)_0%,_rgba(8,9,11,0.85)_70%)]" />

        {/* Racing Speed Streaks */}
        <div className="absolute top-[20%] w-full h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent animate-speed-streak-1" />
        <div className="absolute top-[50%] w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-speed-streak-2" />
        <div className="absolute top-[80%] w-full h-0.5 bg-gradient-to-r from-transparent via-[#E10600] to-transparent animate-speed-streak-3" />

        {/* Dual Burning Tyre Skid Marks */}
        <div className="absolute inset-x-0 top-[35%] h-8 bg-gradient-to-r from-transparent via-black/80 to-transparent border-y border-[#333842]/40 transform -skew-y-1 opacity-70" />
        <div className="absolute inset-x-0 bottom-[35%] h-8 bg-gradient-to-r from-transparent via-black/80 to-transparent border-y border-[#333842]/40 transform -skew-y-1 opacity-70" />

        {/* Cockpit HUD Steering Wheel Display Box */}
        <div className="relative z-20 max-w-xl w-full mx-4 bg-[#08090B]/95 border-2 border-[#E10600] rounded-xl p-5 shadow-[0_0_50px_rgba(225,6,0,0.6)] text-white font-mono space-y-3">
          {/* F1 Steering Wheel Shift LED Bar (Green ➔ Amber ➔ Red/Blue) */}
          <div className="flex items-center justify-center space-x-1.5 pb-2 border-b border-[#222733]">
            {/* 5 Green LEDs */}
            {[...Array(5)].map((_, i) => (
              <span key={`g-${i}`} className="w-3 h-3 rounded-full bg-[#00E676] shadow-[0_0_6px_#00E676]" />
            ))}
            {/* 5 Amber LEDs */}
            {[...Array(5)].map((_, i) => (
              <span key={`a-${i}`} className="w-3 h-3 rounded-full bg-[#FFB000] shadow-[0_0_6px_#FFB000]" />
            ))}
            {/* 5 Red/Blue Shift Flashing LEDs */}
            {[...Array(5)].map((_, i) => (
              <span
                key={`r-${i}`}
                className="w-3.5 h-3.5 rounded-full bg-[#FF2A1A] animate-led-shift shadow-[0_0_10px_#FF2A1A]"
              />
            ))}
          </div>

          {/* Main Gear & Speed Telemetry Readout */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-black italic text-[#E10600] text-glow-red">
                {isUpshift ? "▲ SHIFT" : "▼ DOWNSHIFT"}
              </span>
              <span className="text-2xl font-black text-white">
                GEAR {targetSector.gear}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#9A9FA8] uppercase tracking-wider block">
                APEX VELOCITY
              </span>
              <span className="text-3xl font-black text-[#00E5FF] font-mono text-glow-cyan">
                {targetSector.speedKmh} <span className="text-xs font-normal text-white">KM/H</span>
              </span>
            </div>
          </div>

          {/* Sector Corner HUD Details */}
          <div className="p-3 rounded-lg bg-[#101216] border border-[#222733] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div>
              <div className="flex items-center space-x-2 text-[#FFB000] font-bold">
                <Compass className="w-3.5 h-3.5" />
                <span>SILVERSTONE GP • {targetSector.sector}</span>
              </div>
              <div className="text-white font-black text-sm tracking-wide mt-0.5">
                {targetSector.turnNumber}: {targetSector.cornerName}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-right">
              <div>
                <span className="text-[10px] text-[#606775] block uppercase">LATERAL G</span>
                <span className="text-[#FF2A1A] font-bold">{targetSector.lateralG}G</span>
              </div>
              <div className="h-6 w-px bg-[#222733]" />
              <div>
                <span className="text-[10px] text-[#606775] block uppercase">CHANNEL</span>
                <span className="text-[#00E676] font-bold">[{targetSector.tabLabel}]</span>
              </div>
            </div>
          </div>

          {/* Telemetry Corner Action Note */}
          <div className="text-[11px] text-[#9A9FA8] italic text-center truncate">
            "{targetSector.apexDescription}"
          </div>
        </div>
      </div>

      {/* 3. Bottom Rumble Kerb (Red & White Curbs rushing past) */}
      <div className="relative w-full h-7 rumble-kerb-bottom animate-kerb-fast border-t-2 border-black/40">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute right-6 bottom-1 text-[10px] font-mono font-black text-white/90 uppercase tracking-widest drop-shadow-md">
          APEX CONTACT • TELEMETRY SYNCED ▼
        </div>
      </div>
    </div>
  );
};
