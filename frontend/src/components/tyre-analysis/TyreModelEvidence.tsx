import React, { useState } from "react";
import { CornerTyreState } from "../../types";
import { ShieldCheck, ChevronDown, ChevronUp, FileText, Cpu, CheckCircle2 } from "lucide-react";

interface TyreModelEvidenceProps {
  tyre: CornerTyreState;
  sessionId: string;
}

export const TyreModelEvidence: React.FC<TyreModelEvidenceProps> = ({ tyre, sessionId }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-[#101216] rounded-xl border border-[#222733] shadow-lg font-mono select-none overflow-hidden">
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-[#15181E] transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#00E676]" />
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              MODEL EVIDENCE &amp; PROVENANCE AUDIT TRAIL
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[#9A9FA8]">
          <span className="text-xs hidden sm:inline">{isExpanded ? "COLLAPSE" : "EXPAND"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Audit Log */}
      {isExpanded && (
        <div className="p-5 pt-0 border-t border-[#1E232B] space-y-4 text-xs">
          {/* Key Lineage Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
            <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
              <span className="text-[#606775] text-[10px] block">REGRESSION MODEL</span>
              <span className="text-white font-bold mt-0.5 block">Huber Robust (M-estimator)</span>
            </div>

            <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
              <span className="text-[#606775] text-[10px] block">CORNER MULTIPLIER</span>
              <span className="text-[#00E5FF] font-bold mt-0.5 block">
                {tyre.provenance_metadata.load_factor}x ({tyre.position})
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
              <span className="text-[#606775] text-[10px] block">SESSION TELEMETRY</span>
              <span className="text-white font-bold mt-0.5 block">{sessionId}</span>
            </div>

            <div className="p-2.5 rounded bg-[#08090B] border border-[#1E232B]">
              <span className="text-[#606775] text-[10px] block">CALIBRATION STATUS</span>
              <span className="text-[#00E676] font-bold mt-0.5 block flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
                <span>RACE VALIDATED</span>
              </span>
            </div>
          </div>

          {/* Model Evidence Audit Notes */}
          <div className="space-y-1.5">
            <span className="text-[#9A9FA8] font-bold block text-[11px]">AUDIT LOG ENTRIES:</span>
            <div className="bg-[#08090B] rounded p-3 border border-[#1E232B] space-y-1.5 font-mono text-[11px] text-[#C5C9D3]">
              {tyre.model_evidence_notes.map((note, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#00E5FF] font-bold">›</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Metadata */}
          <div className="p-3 rounded bg-[#08090B] border border-[#1E232B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-[#9A9FA8]">
            <div>
              <span className="text-white font-bold uppercase tracking-wider block">
                {tyre.provenance_metadata.status}
              </span>
              <span>{tyre.provenance_metadata.corner_dynamics_rationale}</span>
            </div>

            <div className="flex items-center space-x-3 text-[10px] flex-shrink-0">
              <span>MEASURED: <strong className="text-[#FF2A1A]">FALSE</strong></span>
              <span>MODELED: <strong className="text-[#00E676]">TRUE</strong></span>
              <span>ESTIMATED: <strong className="text-[#FFB000]">TRUE</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
