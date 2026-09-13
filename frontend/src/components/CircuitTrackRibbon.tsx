import React, { useState } from "react";
import { CIRCUIT_SECTORS, CircuitSectorInfo } from "../constants/circuit";
import { racingAudio } from "../services/racingAudio";
import { Volume2, VolumeX, Flag, Zap, Compass } from "lucide-react";

interface CircuitTrackRibbonProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

export const CircuitTrackRibbon: React.FC<CircuitTrackRibbonProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(racingAudio.enabled);

  const activeSector = CIRCUIT_SECTORS[currentTab] || CIRCUIT_SECTORS.vehicle_twin;
  const sectorsList = Object.values(CIRCUIT_SECTORS);

  const handleToggleSfx = () => {
    const newState = racingAudio.toggle();
    setSfxEnabled(newState);
  };

  return (
    <div className="bg-[#0c0e14]/95 backdrop-blur-sm border-b border-[#1E232B] px-4 sm:px-6 lg:px-8 py-2 select-none relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        {/* Track Sector Telemetry Banner */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#17191D] border border-[#222733] text-white">
            <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
            <span className="font-bold text-[#FFB000]">{activeSector.turnNumber}</span>
            <span className="text-[#9A9FA8]">•</span>
            <span className="font-bold text-white uppercase">{activeSector.cornerName}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-[#9A9FA8]">
            <span>GEAR: <strong className="text-white">{activeSector.gear}</strong></span>
            <span>•</span>
            <span>VELOCITY: <strong className="text-[#00E5FF]">{activeSector.speedKmh} km/h</strong></span>
            <span>•</span>
            <span>LATERAL: <strong className="text-[#FF2A1A]">{activeSector.lateralG}G</strong></span>
          </div>
        </div>

        {/* Interactive Silverstone Circuit Sector Progress Bar */}
        <div className="flex-1 max-w-xl mx-0 md:mx-4 w-full flex items-center space-x-1">
          {sectorsList.map((sector) => {
            const isActive = currentTab === sector.tabId;
            return (
              <button
                key={sector.tabId}
                onClick={() => onSelectTab(sector.tabId)}
                title={`${sector.tabLabel} • ${sector.cornerName} (${sector.turnNumber})`}
                className={`flex-1 h-3 rounded-xs transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#E10600] to-[#FF2A1A] shadow-[0_0_12px_#E10600,0_0_4px_#FFF]"
                    : "bg-[#1C2029] hover:bg-[#2C3444] hover:shadow-[0_0_6px_rgba(0,229,255,0.2)]"
                }`}
              >
                {/* Active Car Marker on the Track */}
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] filter drop-shadow-[0_0_5px_#FF2A1A] pointer-events-none">
                    🏎️
                  </span>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-30 bg-[#08090B] border border-[#222733] px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-xl pointer-events-none">
                  <span className="text-[#00E5FF] font-bold">{sector.tabLabel}</span>: {sector.cornerName} ({sector.turnNumber})
                </div>
              </button>
            );
          })}
        </div>

        {/* Audio Toggle */}
        <button
          onClick={handleToggleSfx}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
            sfxEnabled
              ? "bg-[#17191D] border border-[#00E676]/40 text-[#00E676] hover:bg-[#1E232B]"
              : "bg-[#17191D] border border-[#222733] text-[#606775] hover:text-[#9A9FA8]"
          }`}
          title={sfxEnabled ? "Click to mute F1 gear shift audio" : "Click to enable F1 gear shift audio"}
        >
          {sfxEnabled ? (
            <>
              <Volume2 className="w-3 h-3 text-[#00E676]" />
              <span>SFX: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3 h-3 text-[#606775]" />
              <span>SFX: OFF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
