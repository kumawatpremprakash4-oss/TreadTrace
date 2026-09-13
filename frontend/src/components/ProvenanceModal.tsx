import React from "react";
import { ShieldCheck, X, FileText, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceModal: React.FC<ProvenanceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#101216] border-2 border-[#E10600] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 text-white font-mono">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-[#1E232B] text-[#9A9FA8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-[#222733] pb-4">
          <div className="w-10 h-10 rounded-lg bg-[#E10600]/20 border border-[#E10600] flex items-center justify-center text-[#FF2A1A]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white font-mono">
              DATA PROVENANCE & TRANSPARENCY AUDIT
            </h2>
            <span className="text-xs text-[#9A9FA8]">TreadTrace AI Engine • Version 1.0.0-PRO</span>
          </div>
        </div>

        {/* Provenance Key Values */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-[#17191D] border border-[#222733]">
            <span className="text-[#606775] block text-[10px] uppercase">Data Provenance Classification</span>
            <span className="text-[#FFB000] font-black text-sm">SYNTHETIC DEMONSTRATION DATA</span>
          </div>
          <div className="p-3 rounded bg-[#17191D] border border-[#222733]">
            <span className="text-[#606775] block text-[10px] uppercase">Circuit Physical Blueprint</span>
            <span className="text-white font-black text-sm">Silverstone GP (5.891 km)</span>
          </div>
          <div className="p-3 rounded bg-[#17191D] border border-[#222733]">
            <span className="text-[#606775] block text-[10px] uppercase">Telemetry Ingestion Volume</span>
            <span className="text-[#00E5FF] font-black text-sm">48 FP2 Laps • 52 Race Laps</span>
          </div>
          <div className="p-3 rounded bg-[#17191D] border border-[#222733]">
            <span className="text-[#606775] block text-[10px] uppercase">ML Modeling Method</span>
            <span className="text-[#00E676] font-black text-sm">Two-Stage Robust Huber + Ridge</span>
          </div>
        </div>

        {/* Transparent Disclaimer */}
        <div className="p-3.5 rounded bg-[#08090B] border border-[#222733] text-xs text-[#9A9FA8] leading-relaxed space-y-2">
          <div className="font-bold text-white flex items-center space-x-1.5 font-sans">
            <AlertTriangle className="w-4 h-4 text-[#FFB000]" />
            <span>Ethical AI & Competition Integrity Commitment</span>
          </div>
          <p>
            TreadTrace does not fabricate claims of private proprietary team contracts. In compliance with strict engineering ethics, our demonstration environment uses mathematically generated telemetry with known physical ground truths (0.033 s/kg fuel burn, logarithmic track rubber accumulation, and non-linear tyre graining cliffs).
          </p>
          <p>
            All regression curves, 95% confidence intervals, and post-race validation metrics are calculated live by our Python scikit-learn backend.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded bg-[#E10600] hover:bg-[#FF2A1A] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            ACKNOWLEDGE & PROCEED
          </button>
        </div>
      </div>
    </div>
  );
};
