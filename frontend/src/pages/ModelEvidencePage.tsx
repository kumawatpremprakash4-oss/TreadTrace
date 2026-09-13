import React from "react";
import { ShieldCheck, Cpu, Database, AlertTriangle, HelpCircle, Layers, CheckCircle2, Award, Terminal } from "lucide-react";

export const ModelEvidencePage: React.FC = () => {
  const featureImportances = [
    { feature: "Tyre Stint Age (Laps Completed)", weight: 92, category: "Degradation" },
    { feature: "Tyre Compound Specification (C2 / C3 / C4)", weight: 85, category: "Baseline Pace" },
    { feature: "Fuel Mass (kg burn-off penalty)", weight: 78, category: "Vehicle Mass Confounder" },
    { feature: "Track Grip Evolution (Session Rubbering)", weight: 64, category: "Environmental Confounder" },
    { feature: "Track Surface Temperature (°C Window)", weight: 58, category: "Thermal Sensitivity" },
    { feature: "Dirty Air Traffic Wake (Proximity Delta)", weight: 45, category: "Aero Confounder" },
  ];

  return (
    <div className="space-y-6 text-[#F5F5F5] font-sans select-none">
      {/* Title & Governance Header */}
      <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-black uppercase tracking-tight italic font-mono text-white">
                AI EVIDENCE, PROVENANCE & MODEL GOVERNANCE
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#FFB000]/20 border border-[#FFB000]/40 text-[#FFB000] text-[10px] font-mono font-bold tracking-wider uppercase">
                PROVENANCE AUDIT
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono px-3.5 py-2 rounded-lg bg-[#08090B] border border-[#00E676]/40 text-[#00E676]">
            <ShieldCheck className="w-4 h-4 text-[#00E676]" />
            <span className="font-bold tracking-wider">NO FAKE AI • NO FABRICATED CLAIMS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Attribution */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-4 shadow-xl">
          <div className="border-b border-[#1E232B] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-[#00E5FF]" />
              <span>MULTIVARIATE FEATURE IMPORTANCE & SENSITIVITY</span>
            </h2>
          </div>

          <div className="space-y-4">
            {featureImportances.map((item, idx) => (
              <div key={idx} className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{item.feature}</span>
                  <span className="text-[#00E5FF] font-bold">{item.weight}% weight</span>
                </div>
                <div className="w-full h-2 bg-[#08090B] rounded-full overflow-hidden border border-[#1E232B]">
                  <div
                    className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00E676] rounded-full"
                    style={{ width: `${item.weight}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#606775] block uppercase tracking-wider">
                  CATEGORY: {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Provenance & Scope */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-4 shadow-xl">
          <div className="border-b border-[#1E232B] pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#FFB000]" />
              <span>DATA PROVENANCE & DATASET METADATA</span>
            </h2>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div className="p-4 rounded-lg bg-[#08090B] border border-[#222733] space-y-2">
              <div className="flex justify-between border-b border-[#181C24] pb-1.5">
                <span className="text-[#9A9FA8]">DATASET SOURCE:</span>
                <span className="font-bold text-[#FFB000]">SYNTHETIC DEMO TELEMETRY v1.0</span>
              </div>
              <div className="flex justify-between border-b border-[#181C24] pb-1.5">
                <span className="text-[#9A9FA8]">CIRCUIT BLUEPRINT:</span>
                <span className="font-bold text-white">SILVERSTONE GP (5.891 KM)</span>
              </div>
              <div className="flex justify-between border-b border-[#181C24] pb-1.5">
                <span className="text-[#9A9FA8]">PRACTICE SAMPLE:</span>
                <span className="font-bold text-[#00E5FF]">48 LAPS (3 STINTS, 3 COMPOUNDS)</span>
              </div>
              <div className="flex justify-between border-b border-[#181C24] pb-1.5">
                <span className="text-[#9A9FA8]">RACE VALIDATION:</span>
                <span className="font-bold text-[#00E676]">52 LAPS (FULL GP DISTANCE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9A9FA8]">REPRODUCIBILITY SEEDS:</span>
                <span className="font-bold text-white">SEED 42 (FP2) / SEED 101 (RACE)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#08090B] border border-[#FFB000]/30 text-[#9A9FA8] leading-relaxed text-[11px] space-y-1">
              <div className="font-bold text-[#FFB000] flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ENGINEERING NOTE ON PROVENANCE</span>
              </div>
              <p>
                TreadTrace strictly labels this demonstration dataset as synthetic to maintain full engineering integrity. The physical relationships (0.033s/kg fuel penalty, logarithmic track rubber accumulation, and dirty air turbulence loss) are modeled from published race engineering physics equations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Edge Cases & System Robustness */}
      <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-4 shadow-xl">
        <div className="border-b border-[#1E232B] pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider font-mono text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#00E676]" />
            <span>EDGE CASE HANDLING & GRACEFUL TELEMETRY DEGRADATION</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-[#08090B] border border-[#222733] space-y-1.5">
            <span className="font-bold text-white block uppercase tracking-wider text-[#00E5FF]">
              MISSING FUEL SENSOR
            </span>
            <p className="text-[#9A9FA8] leading-relaxed">
              System calculates fuel mass from stint lap count and average engine fuel flow rate (1.62 kg/lap). Confidence badge adjusts to 75%.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#08090B] border border-[#222733] space-y-1.5">
            <span className="font-bold text-white block uppercase tracking-wider text-[#FFB000]">
              UNPRECEDENTED TRACK TEMP
            </span>
            <p className="text-[#9A9FA8] leading-relaxed">
              If race track temperature exceeds the historical training envelope, the model automatically widens the 95% confidence band.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#08090B] border border-[#222733] space-y-1.5">
            <span className="font-bold text-white block uppercase tracking-wider text-[#00E676]">
              CORRUPTED GPS / SECTORS
            </span>
            <p className="text-[#9A9FA8] leading-relaxed">
              Degradation regression falls back to overall lap time and tyre age without crashing, isolating macro-level confounders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
