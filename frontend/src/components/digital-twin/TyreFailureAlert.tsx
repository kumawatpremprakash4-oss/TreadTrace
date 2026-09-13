import React from "react";
import { CornerPosition, CornerTyreState } from "../../types";
import { AlertTriangle, ShieldAlert, ArrowRight, Wrench } from "lucide-react";

interface TyreFailureAlertProps {
  alerts: Array<{
    position: CornerPosition;
    position_label: string;
    risk_state: string;
    risk_score: number;
    rul_laps: number;
    explanation: string;
    recommended_action: string;
  }>;
  onSelectPosition: (position: CornerPosition) => void;
}

export const TyreFailureAlert: React.FC<TyreFailureAlertProps> = ({ alerts, onSelectPosition }) => {
  if (!alerts || alerts.length === 0) return null;

  // Primary critical alert (highest risk score)
  const topAlert = alerts[0];
  const isFailureRisk = topAlert.risk_state === "FAILURE_RISK";
  const isCritical = topAlert.risk_state === "CRITICAL";

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 border shadow-2xl font-mono select-none relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300 ${
        isFailureRisk
          ? "bg-[#200A10] border-[#FF0055]"
          : isCritical
          ? "bg-[#1A0B0E] border-[#E10600]"
          : "bg-[#1A1408] border-[#FFB000]"
      }`}
    >
      {/* Top pulsing accent stripe */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isFailureRisk
            ? "bg-[#FF0055] animate-ping"
            : isCritical
            ? "bg-[#E10600] animate-pulse"
            : "bg-[#FFB000]"
        }`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Alert Description */}
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${
                isFailureRisk
                  ? "bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]"
                  : isCritical
                  ? "bg-[#E10600]/20 text-[#FF2A1A] border-[#E10600]"
                  : "bg-[#FFB000]/20 text-[#FFB000] border-[#FFB000]"
              }`}
            >
              {isFailureRisk ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>
                {isFailureRisk
                  ? "MODELED FAILURE RISK"
                  : isCritical
                  ? "CRITICAL THERMAL / DEGRADATION RISK"
                  : "ELEVATED TYRE STRESS WARNING"}
              </span>
            </span>

            <span className="text-white font-black text-sm">
              {topAlert.position} — {topAlert.position_label}
            </span>

            <span className="text-[#606775]">•</span>

            <span className="text-white font-bold text-xs">
              RISK SCORE: <span className="text-[#FF2A1A]">{topAlert.risk_score}%</span>
            </span>

            <span className="text-[#606775]">•</span>

            <span className="text-white font-bold text-xs">
              USABLE LIFE: <span className="text-[#00E5FF]">{topAlert.rul_laps} LAPS</span>
            </span>
          </div>

          <p className="text-xs text-[#C5C9D3] leading-relaxed">
            {topAlert.explanation}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
            <span className="text-[#9A9FA8] font-bold flex items-center space-x-1">
              <Wrench className="w-3.5 h-3.5 text-[#FFB000]" />
              <span>RECOMMENDED ACTION:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#101216] border border-[#2A313F] text-white font-black tracking-wider">
              {topAlert.recommended_action}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onSelectPosition(topAlert.position)}
            className={`w-full md:w-auto px-5 py-2.5 rounded font-black text-xs uppercase tracking-wider font-mono flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg ${
              isFailureRisk || isCritical
                ? "bg-[#E10600] hover:bg-[#FF2A1A] text-white glow-red"
                : "bg-[#FFB000] hover:bg-[#FFC107] text-black"
            }`}
          >
            <span>INSPECT {topAlert.position} FORENSICS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
