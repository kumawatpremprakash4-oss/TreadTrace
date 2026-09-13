import React, { useState, useEffect } from "react";
import {
  CornerPosition,
  CornerTyreState,
  VehicleDigitalTwinState,
  CornerDetailResponse,
} from "../types";
import { fetchVehicleTyres, fetchTyreCornerDetail } from "../services/api";

import { FormulaCar3D } from "../components/digital-twin/FormulaCar3D";
import { TyreHoverTelemetry } from "../components/digital-twin/TyreHoverTelemetry";
import { VehicleStatusBar } from "../components/digital-twin/VehicleStatusBar";
import { VehicleTyreOverview } from "../components/digital-twin/VehicleTyreOverview";
import { TyreFailureAlert } from "../components/digital-twin/TyreFailureAlert";

import { TyreHeader } from "../components/tyre-analysis/TyreHeader";
import { TyreDegradationChart } from "../components/tyre-analysis/TyreDegradationChart";
import { TyreThermalPanel } from "../components/tyre-analysis/TyreThermalPanel";
import { TyreDegradationBreakdown } from "../components/tyre-analysis/TyreDegradationBreakdown";
import { TyreRULPanel } from "../components/tyre-analysis/TyreRULPanel";
import { TyreRiskPanel } from "../components/tyre-analysis/TyreRiskPanel";
import { TyreModelEvidence } from "../components/tyre-analysis/TyreModelEvidence";
import { TyreStintHistory } from "../components/tyre-analysis/TyreStintHistory";
import { TyreTwinVisualizer } from "../components/tyre-analysis/TyreTwinVisualizer";

import { Sliders, RefreshCw, Car, Activity, Eye } from "lucide-react";

interface FourWheelDigitalTwinPageProps {
  initialCorner?: CornerPosition;
  sessionId?: string;
  maxLaps?: number;
}

export const FourWheelDigitalTwinPage: React.FC<FourWheelDigitalTwinPageProps> = ({
  initialCorner = "RL",
  sessionId,
  maxLaps = 35,
}) => {
  const [currentLap, setCurrentLap] = useState<number>(() => Math.min(17, maxLaps || 35));
  const [selectedCorner, setSelectedCorner] = useState<CornerPosition>(initialCorner);
  const [activeTab, setActiveTab] = useState<"ALL" | CornerPosition>("ALL");

  const [vehicleState, setVehicleState] = useState<VehicleDigitalTwinState | null>(null);
  const [cornerDetail, setCornerDetail] = useState<CornerDetailResponse | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState<boolean>(true);
  const [loadingCorner, setLoadingCorner] = useState<boolean>(true);

  // Hover telemetry state
  const [hoveredPos, setHoveredPos] = useState<CornerPosition | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Clamp current lap if maxLaps changes
  useEffect(() => {
    if (maxLaps && currentLap > maxLaps) {
      setCurrentLap(Math.max(1, Math.min(17, maxLaps)));
    }
  }, [maxLaps]);

  // 1. Fetch Vehicle State (all 4 corners)
  const loadVehicleState = async (lapNum: number) => {
    try {
      setLoadingVehicle(true);
      const data = await fetchVehicleTyres(sessionId, lapNum);
      setVehicleState(data);
    } catch (err) {
      console.error("Failed to fetch vehicle state:", err);
    } finally {
      setLoadingVehicle(false);
    }
  };

  // 2. Fetch Detailed Corner Forensics (for selected wheel)
  const loadCornerDetail = async (corner: CornerPosition, lapNum: number) => {
    try {
      setLoadingCorner(true);
      const data = await fetchTyreCornerDetail(corner, sessionId, lapNum);
      setCornerDetail(data);
    } catch (err) {
      console.error(`Failed to fetch detail for ${corner}:`, err);
    } finally {
      setLoadingCorner(false);
    }
  };

  useEffect(() => {
    loadVehicleState(currentLap);
  }, [currentLap, sessionId]);

  useEffect(() => {
    loadCornerDetail(selectedCorner, currentLap);
  }, [selectedCorner, currentLap, sessionId]);

  const handleSelectCorner = (pos: CornerPosition) => {
    setSelectedCorner(pos);
    // Smoothly scroll down to detailed forensics section
    const el = document.getElementById("individual-tyre-forensics");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTabClick = (tab: "ALL" | CornerPosition) => {
    setActiveTab(tab);
    if (tab !== "ALL") {
      setSelectedCorner(tab);
    }
  };

  const getStatusDotColor = (pos: CornerPosition) => {
    if (!vehicleState) return "bg-[#00E676]";
    const state = vehicleState.tyres[pos]?.risk_state;
    if (state === "FAILURE_RISK") return "bg-[#FF0055] animate-ping";
    if (state === "CRITICAL") return "bg-[#E10600] animate-pulse";
    if (state === "WARNING") return "bg-[#FFB000]";
    return "bg-[#00E676]";
  };

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Page Header with Telemetry Scrubber */}
      <div className="bg-[#101216] rounded-xl p-5 sm:p-6 border border-[#222733] hover:border-[#2C3545] shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-card-entrance">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded bg-[#E10600]/15 border border-[#E10600]/40 text-[#FF2A1A] text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>VEHICLE DIGITAL TWIN</span>
            </span>
            <span className="text-xs text-[#00E5FF] font-bold">4-WHEEL ASYMMETRY MODEL</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 italic">
            4-WHEEL FORMULA CAR DIGITAL TWIN
          </h1>
        </div>

        {/* Lap Scrubber Slider */}
        <div className="flex-shrink-0 bg-[#08090B] p-3 rounded-xl border border-[#222733] hover:border-[#2C3545] transition-all duration-300 space-y-2 w-full md:w-72">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9A9FA8] flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>TELEMETRY SCRUBBER:</span>
            </span>
            <span className="text-[#00E5FF] font-black">LAP {currentLap}</span>
          </div>

          <input
            type="range"
            min={1}
            max={Math.max(1, maxLaps || 35)}
            value={Math.min(currentLap, Math.max(1, maxLaps || 35))}
            onChange={(e) => setCurrentLap(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#1E232B] rounded-lg appearance-none cursor-pointer accent-[#E10600]"
          />

          <div className="flex justify-between text-[10px] text-[#606775]">
            <span>L1 (START)</span>
            <span className="text-[#00E5FF] font-bold">L{currentLap} (ACTIVE)</span>
            <span>L{Math.max(1, maxLaps || 35)} (END)</span>
          </div>
        </div>
      </div>

      {/* Vehicle Status Bar */}
      {vehicleState && (
        <div className="animate-card-entrance delay-75">
          <VehicleStatusBar vehicleState={vehicleState} />
        </div>
      )}

      {/* Navigation Sub-Tabs with Live Status Dots */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 animate-card-entrance delay-150">
        <button
          onClick={() => handleTabClick("ALL")}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === "ALL"
              ? "bg-[#E10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.4)]"
              : "bg-[#101216] hover:bg-[#181C24] text-[#9A9FA8] hover:text-white border border-[#222733]"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>ALL TYRES OVERVIEW</span>
        </button>

        {(["FL", "FR", "RL", "RR"] as CornerPosition[]).map((pos) => {
          const isActive = activeTab === pos;
          const label =
            pos === "FL"
              ? "FRONT LEFT"
              : pos === "FR"
              ? "FRONT RIGHT"
              : pos === "RL"
              ? "REAR LEFT"
              : "REAR RIGHT";

          return (
            <button
              key={pos}
              onClick={() => handleTabClick(pos)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 ${
                isActive
                  ? "bg-[#00E5FF] text-black shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                  : "bg-[#101216] hover:bg-[#181C24] text-[#9A9FA8] hover:text-white border border-[#222733]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${getStatusDotColor(pos)}`} />
              <span>{label}</span>
              <span className="text-[10px] opacity-75">[{pos}]</span>
            </button>
          );
        })}
      </div>

      {/* Critical/Warning Risk Alert Banner */}
      {vehicleState && vehicleState.alerts.length > 0 && (
        <TyreFailureAlert
          alerts={vehicleState.alerts}
          onSelectPosition={handleSelectCorner}
        />
      )}

      {/* 3D Formula Car WebGL Scene */}
      {vehicleState && (
        <div className="space-y-4 animate-card-entrance delay-225">
          <FormulaCar3D
            tyres={vehicleState.tyres}
            selectedPosition={selectedCorner}
            onSelectPosition={handleSelectCorner}
            onHoverPosition={(pos, screenPos) => {
              setHoveredPos(pos);
              setHoverScreenPos(screenPos || null);
            }}
          />

          {/* Hover Telemetry Tooltip */}
          {hoveredPos && hoverScreenPos && vehicleState.tyres[hoveredPos] && (
            <TyreHoverTelemetry
              tyre={vehicleState.tyres[hoveredPos]}
              screenPos={hoverScreenPos}
            />
          )}

          {/* 4-Corner Telemetry Quick Cards */}
          <VehicleTyreOverview
            tyres={vehicleState.tyres}
            selectedPosition={selectedCorner}
            onSelectPosition={handleSelectCorner}
          />
        </div>
      )}

      {/* Forensic Individual Tyre Analysis Section */}
      <div id="individual-tyre-forensics" className="pt-4 space-y-6 animate-card-entrance delay-300">
        <div className="border-t border-[#1E232B] pt-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#00E5FF] font-black uppercase tracking-widest block">
              FORENSIC TELEMETRY DRILLDOWN
            </span>
            <h2 className="text-lg sm:text-2xl font-black uppercase text-white mt-0.5">
              {cornerDetail?.position_label || selectedCorner} — TYRE DIGITAL TWIN
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {(["FL", "FR", "RL", "RR"] as CornerPosition[]).map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedCorner(pos)}
                className={`px-3 py-1.5 rounded text-xs font-black transition-all cursor-pointer ${
                  selectedCorner === pos
                    ? "bg-[#00E5FF] text-black"
                    : "bg-[#101216] text-[#9A9FA8] hover:text-white border border-[#222733]"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {cornerDetail ? (
          <div className="space-y-6">
            {/* Tyre Header Card */}
            <TyreHeader
              tyre={cornerDetail}
              onSelectPosition={setSelectedCorner}
            />

            {/* Visualizer & Degradation Trajectory Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: 2D Spinning Twin & Thermal Panel */}
              <div className="space-y-6">
                <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg flex flex-col items-center justify-center">
                  <TyreTwinVisualizer
                    compound={cornerDetail.compound}
                    tyreAge={cornerDetail.accumulated_laps}
                    maxLifeLaps={cornerDetail.cliff_lap + 4}
                    healthPct={cornerDetail.current_health_pct}
                    riskState={cornerDetail.risk_state}
                    cornerPosition={cornerDetail.position}
                  />
                </div>

                <TyreThermalPanel
                  currentTemp={cornerDetail.current_temperature}
                  optimalTemp={cornerDetail.risk_evaluation.optimal_temperature}
                  tempDelta={cornerDetail.risk_evaluation.temp_delta}
                  thermalState={cornerDetail.thermal_state}
                  compound={cornerDetail.compound}
                />
              </div>

              {/* Right Column: High-precision Degradation Trajectory Chart */}
              <div className="lg:col-span-2 space-y-6">
                <TyreDegradationChart
                  curve={cornerDetail.curve}
                  currentLap={cornerDetail.tyre_age}
                  cliffLap={cornerDetail.cliff_lap}
                  cornerName={cornerDetail.position_label}
                  compound={cornerDetail.compound}
                />

                <TyreRULPanel
                  rulLaps={cornerDetail.remaining_useful_life}
                  tyreAge={cornerDetail.tyre_age}
                  cliffLap={cornerDetail.cliff_lap}
                  cliffStatus={cornerDetail.cliff_status}
                  healthPct={cornerDetail.current_health_pct}
                />
              </div>
            </div>

            {/* Multi-Factor Risk Engine Panel */}
            <TyreRiskPanel
              evaluation={cornerDetail.risk_evaluation}
              cornerLabel={cornerDetail.position_label}
            />

            {/* Degradation Breakdown Components */}
            <TyreDegradationBreakdown
              breakdown={cornerDetail.degradation_breakdown}
              cornerLabel={cornerDetail.position_label}
            />

            {/* Stint Telemetry History */}
            <TyreStintHistory
              stints={cornerDetail.stint_history}
              cornerLabel={cornerDetail.position_label}
            />

            {/* Model Evidence Audit Trail */}
            <TyreModelEvidence
              tyre={cornerDetail}
              sessionId={cornerDetail.vehicle_context?.vehicle_id || "FP2-SILVERSTONE-2026"}
            />
          </div>
        ) : (
          <div className="p-12 text-center text-[#9A9FA8] bg-[#101216] rounded-xl border border-[#222733]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00E5FF] mb-2" />
            <span>LOADING CORNER FORENSIC STATE...</span>
          </div>
        )}
      </div>
    </div>
  );
};
