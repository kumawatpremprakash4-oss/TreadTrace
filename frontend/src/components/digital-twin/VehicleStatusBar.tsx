import React from "react";
import { VehicleDigitalTwinState } from "../../types";
import { Gauge, Flame, Fuel, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";

interface VehicleStatusBarProps {
  vehicleState: VehicleDigitalTwinState;
  onSelectLap?: (lap: number) => void;
}

export const VehicleStatusBar: React.FC<VehicleStatusBarProps> = ({ vehicleState }) => {
  const alertCount = vehicleState.alerts.length;

  return (
    <div className="bg-[#101216] rounded-xl border border-[#222733] p-4 shadow-lg font-mono select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Session / Vehicle Identity */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#E10600]/15 border border-[#E10600]/40 text-[#FF2A1A] font-black">
            <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
            <span>{vehicleState.vehicle_id}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-white font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>{vehicleState.circuit.toUpperCase()}</span>
          </div>

          <span className="text-[#222733] hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center space-x-1 text-[#9A9FA8]">
            <span>SESSION:</span>
            <strong className="text-white">{vehicleState.session_id}</strong>
          </div>
        </div>

        {/* Right: Real-time Telemetry Strips */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px]">
          {/* Current Lap */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#08090B] border border-[#1E232B]">
            <Gauge className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="text-[#606775]">LAP:</span>
            <span className="text-white font-black">{vehicleState.lap} / {vehicleState.total_session_laps || 48}</span>
          </div>

          {/* Track Temperature */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#08090B] border border-[#1E232B]">
            <Flame className="w-3.5 h-3.5 text-[#FFB000]" />
            <span className="text-[#606775]">TRACK:</span>
            <span className="text-white font-bold">{vehicleState.track_temperature}°C</span>
          </div>

          {/* Fuel Load */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#08090B] border border-[#1E232B]">
            <Fuel className="w-3.5 h-3.5 text-[#88909E]" />
            <span className="text-[#606775]">FUEL:</span>
            <span className="text-white font-bold">{vehicleState.fuel_load_kg} KG</span>
          </div>

          {/* Tyre Alerts Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-bold ${
              alertCount > 0
                ? "bg-[#E10600]/15 border-[#E10600] text-[#FF2A1A] animate-pulse"
                : "bg-[#00E676]/15 border-[#00E676] text-[#00E676]"
            }`}
          >
            {alertCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>TYRE ALERTS: {alertCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
