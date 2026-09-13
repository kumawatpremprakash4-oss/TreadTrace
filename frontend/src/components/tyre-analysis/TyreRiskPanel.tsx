import React from "react";
import { RiskEvaluation } from "../../types";
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Wrench } from "lucide-react";

interface TyreRiskPanelProps {
  evaluation: RiskEvaluation;
  cornerLabel: string;
}

export const TyreRiskPanel: React.FC<TyreRiskPanelProps> = ({ evaluation, cornerLabel }) => {
  const getRiskColor = (state: string) => {
    switch (state) {
      case "FAILURE_RISK":
        return {
          textColor: "text-[#FF0055]",
          borderColor: "border-[#FF0055]",
          bgColor: "bg-[#FF0055]/10",
          icon: <ShieldAlert className="w-5 h-5 text-[#FF0055]" />,
          title: "MODELED FAILURE RISK",
        };
      case "CRITICAL":
        return {
          textColor: "text-[#FF2A1A]",
          borderColor: "border-[#E10600]",
          bgColor: "bg-[#E10600]/10",
          icon: <AlertTriangle className="w-5 h-5 text-[#FF2A1A]" />,
          title: "CRITICAL DEGRADATION RISK",
        };
      case "WARNING":
        return {
          textColor: "text-[#FFB000]",
          borderColor: "border-[#FFB000]",
          bgColor: "bg-[#FFB000]/10",
          icon: <AlertTriangle className="w-5 h-5 text-[#FFB000]" />,
          title: "ELEVATED TYRE STRESS WARNING",
        };
      default:
        return {
          textColor: "text-[#00E676]",
          borderColor: "border-[#00E676]",
          bgColor: "bg-[#00E676]/10",
          icon: <CheckCircle className="w-5 h-5 text-[#00E676]" />,
          title: "OPTIMAL OPERATING CONDITION",
        };
    }
  };

  const style = getRiskColor(evaluation.risk_state);

  return (
    <div className={`rounded-xl p-5 sm:p-6 border shadow-lg font-mono select-none space-y-4 ${style.bgColor} ${style.borderColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222733] pb-4">
        <div className="flex items-center space-x-3">
          {style.icon}
          <div>
            <h3 className={`text-base font-black tracking-wider uppercase ${style.textColor}`}>
              {style.title}
            </h3>
            <span className="text-xs text-[#9A9FA8]">
              {cornerLabel} • TYRE RISK ENGINE VERDICT
            </span>
          </div>
        </div>

        <div className="flex items-baseline space-x-2 bg-[#08090B] px-3.5 py-1.5 rounded-lg border border-[#222733]">
          <span className="text-[10px] text-[#606775] uppercase">RISK SCORE:</span>
          <span className={`text-xl font-black ${style.textColor}`}>{evaluation.risk_score}</span>
          <span className="text-xs text-[#9A9FA8]">/ 100</span>
        </div>
      </div>

      {/* Explanation & Reasoning */}
      <div className="space-y-2 text-xs">
        <span className="text-[#9A9FA8] font-bold block">MODEL-DERIVED PHYSICAL REASONING:</span>
        <p className="text-white leading-relaxed bg-[#08090B] p-3 rounded border border-[#1E232B]">
          {evaluation.explanation}
        </p>
      </div>

      {/* Recommended Strategy Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#08090B] p-3 rounded border border-[#1E232B] text-xs">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-[#FFB000]" />
          <span className="text-[#9A9FA8] font-bold">TACTICAL ACTION:</span>
          <span className="text-white font-black">{evaluation.recommended_action}</span>
        </div>

        <span className="text-[10px] text-[#606775]">
          LEVEL {evaluation.warning_level} SEVERITY
        </span>
      </div>

      {/* Engineering Credibility Rule Notice */}
      <div className="flex items-start space-x-2 text-[10px] text-[#9A9FA8] pt-1">
        <Info className="w-3.5 h-3.5 text-[#00E5FF] mt-0.5 flex-shrink-0" />
        <p className="leading-normal">
          {evaluation.credibility_disclaimer}
        </p>
      </div>
    </div>
  );
};
