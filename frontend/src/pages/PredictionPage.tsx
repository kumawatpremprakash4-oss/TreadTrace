import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Sliders, Zap, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Play, Crosshair, Flag } from "lucide-react";
import { PredictionResult, CompoundCompareResult } from "../types";
import { predictStint, compareCompounds } from "../services/api";

export const PredictionPage: React.FC = () => {
  const [compound, setCompound] = useState<string>("MEDIUM");
  const [stintLength, setStintLength] = useState<number>(24);
  const [startFuel, setStartFuel] = useState<number>(65);
  const [trackTemp, setTrackTemp] = useState<number>(38);
  const [startAge, setStartAge] = useState<number>(0);
  const [trafficMode, setTrafficMode] = useState<string>("CLEAN");

  const [activeTab, setActiveTab] = useState<"SINGLE_STINT" | "CROSSOVER_MATRIX">("SINGLE_STINT");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [crossover, setCrossover] = useState<CompoundCompareResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const pred = await predictStint({
        compound,
        start_age_laps: startAge,
        target_stint_laps: stintLength,
        start_fuel_kg: startFuel,
        track_temp: trackTemp,
        traffic_mode: trafficMode,
      });
      setPrediction(pred);

      const cross = await compareCompounds({
        stint_length: stintLength,
        start_fuel: startFuel,
        track_temp: trackTemp,
      });
      setCrossover(cross);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, [compound, stintLength, startFuel, trackTemp, startAge, trafficMode]);

  return (
    <div className="space-y-6 text-[#F5F5F5] font-sans select-none">
      {/* Pit-Wall Strategy Header */}
      <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-black uppercase tracking-tight italic font-mono text-white">
              FORWARD STINT STRATEGY & CROSSOVER MATRIX
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#E10600]/20 border border-[#E10600]/40 text-[#FF2A1A] text-[10px] font-mono font-bold tracking-wider uppercase">
              STRATEGY SIMULATOR
            </span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-[#08090B] p-1 rounded-lg border border-[#222733] self-start md:self-center font-mono text-xs">
          <button
            onClick={() => setActiveTab("SINGLE_STINT")}
            className={`px-3 py-1.5 rounded-md font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === "SINGLE_STINT"
                ? "bg-[#E10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.4)]"
                : "text-[#9A9FA8] hover:text-white"
            }`}
          >
            STINT TRAJECTORY
          </button>
          <button
            onClick={() => setActiveTab("CROSSOVER_MATRIX")}
            className={`px-3 py-1.5 rounded-md font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === "CROSSOVER_MATRIX"
                ? "bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                : "text-[#9A9FA8] hover:text-white"
            }`}
          >
            COMPOUND CROSSOVER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Simulation Controls Sidebar */}
        <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-5 shadow-lg">
          <div className="flex items-center space-x-2 border-b border-[#1E232B] pb-3">
            <Sliders className="w-4 h-4 text-[#00E5FF]" />
            <h2 className="text-xs font-black uppercase tracking-wider font-mono text-white">
              SIMULATION PARAMETERS
            </h2>
          </div>

          {/* Compound Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-[#9A9FA8] uppercase tracking-wider block">
              Tyre Compound:
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { name: "SOFT", color: "#FF2A1A" },
                { name: "MEDIUM", color: "#FFB000" },
                { name: "HARD", color: "#F5F5F5" },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCompound(c.name)}
                  className={`py-2 text-xs font-black rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                    compound === c.name
                      ? "bg-[#1E232B] border-white text-white shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                      : "bg-[#08090B] border-[#222733] text-[#9A9FA8] hover:bg-[#15181E] hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stint Length Slider */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#9A9FA8]">Stint Length:</span>
              <span className="text-white font-bold">{stintLength} Laps</span>
            </div>
            <input
              type="range"
              min={10}
              max={35}
              value={stintLength}
              onChange={(e) => setStintLength(Number(e.target.value))}
              className="w-full accent-[#E10600] bg-[#08090B] h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Starting Fuel Slider */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#9A9FA8]">Start Fuel Load:</span>
              <span className="text-white font-bold">{startFuel} kg</span>
            </div>
            <input
              type="range"
              min={15}
              max={110}
              step={5}
              value={startFuel}
              onChange={(e) => setStartFuel(Number(e.target.value))}
              className="w-full accent-[#00E5FF] bg-[#08090B] h-1.5 rounded cursor-pointer"
            />
            <span className="text-[10px] text-[#606775] block">Burn: ~1.62 kg/lap (FP2 rate)</span>
          </div>

          {/* Track Temperature Slider */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#9A9FA8]">Track Temperature:</span>
              <span className="text-white font-bold">{trackTemp} °C</span>
            </div>
            <input
              type="range"
              min={25}
              max={52}
              value={trackTemp}
              onChange={(e) => setTrackTemp(Number(e.target.value))}
              className="w-full accent-[#FFB000] bg-[#08090B] h-1.5 rounded cursor-pointer"
            />
            <span className="text-[10px] text-[#606775] block">Cliff accelerates above 40°C</span>
          </div>

          {/* Starting Tyre Age Slider */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#9A9FA8]">Initial Scrubbed Laps:</span>
              <span className="text-white font-bold">{startAge} Laps</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              value={startAge}
              onChange={(e) => setStartAge(Number(e.target.value))}
              className="w-full accent-[#00E676] bg-[#08090B] h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Traffic Mode */}
          <div className="space-y-1.5 font-mono">
            <label className="text-[11px] text-[#9A9FA8] uppercase tracking-wider block">
              Aero Wake Turbulence:
            </label>
            <select
              value={trafficMode}
              onChange={(e) => setTrafficMode(e.target.value)}
              className="w-full text-xs border border-[#222733] rounded-lg p-2 bg-[#08090B] text-white focus:outline-none focus:border-[#00E5FF]"
            >
              <option value="CLEAN">Clean Air (Optimal Flow)</option>
              <option value="LIGHT">Light Traffic (+0.25s / lap)</option>
              <option value="HEAVY">Heavy Dirty Air (+0.75s / lap)</option>
            </select>
          </div>
        </div>

        {/* Results Visualizer Area */}
        <div className="lg:col-span-3 space-y-5">
          {activeTab === "SINGLE_STINT" ? (
            <>
              {/* Single Stint Projected Pace Card */}
              <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E232B] pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider font-mono text-white flex items-center space-x-2">
                      <span>PROJECTED STINT PACE • {compound} ({stintLength} LAPS)</span>
                    </h3>
                    <div className="text-xs font-mono text-[#9A9FA8] mt-1 space-x-3">
                      <span>
                        AVERAGE PACE:{" "}
                        <strong className="text-white">
                          {prediction?.predicted_average_lap_time?.toFixed(3) || "89.250"} s
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        CLIFF ONSET:{" "}
                        <strong className="text-[#FF2A1A]">
                          LAP {prediction?.cliff_onset_lap || 26}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded bg-[#00E676]/15 text-[#00E676] text-xs font-mono font-bold border border-[#00E676]/30">
                      USABLE WINDOW: {prediction?.usable_stint_window_laps || 24} LAPS
                    </span>
                  </div>
                </div>

                {/* Projected Pace Chart */}
                <div className="h-72 w-full bg-[#08090B] rounded-lg p-2 border border-[#1E232B]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prediction?.forecast_laps || []}
                      margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#181C24" />
                      <XAxis
                        dataKey="stint_lap"
                        stroke="#606775"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: "Stint Lap", position: "insideBottom", offset: -5, fontSize: 10, fill: "#606775" }}
                      />
                      <YAxis
                        stroke="#606775"
                        fontSize={11}
                        fontFamily="monospace"
                        domain={["dataMin - 0.4", "dataMax + 0.4"]}
                        unit="s"
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#101216] border border-[#00E5FF] p-3 rounded-lg text-xs font-mono shadow-2xl space-y-1">
                                <div className="font-bold text-[#00E5FF]">
                                  STINT LAP {label} • TYRE AGE {d.tyre_age}
                                </div>
                                <div className="text-white">Projected Pace: {d.projected_lap_time.toFixed(3)}s</div>
                                <div className="text-[#FF2A1A]">Isolated Tyre Loss: +{d.expected_tyre_loss.toFixed(3)}s</div>
                                <div className="text-[#9A9FA8]">Fuel Component: +{d.fuel_component.toFixed(3)}s ({d.remaining_fuel_kg}kg left)</div>
                                <div className="text-[#00E676]">Confidence: {d.confidence_pct}%</div>
                                {d.is_past_cliff && (
                                  <div className="text-[#FF2A1A] font-black uppercase">⚠️ THERMAL CLIFF EXCEEDED</div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="projected_lap_time"
                        stroke="#00E5FF"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#00E5FF", stroke: "#08090B", strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: "#FFFFFF", stroke: "#00E5FF", strokeWidth: 2 }}
                        name="Projected Lap Time"
                      />
                      {prediction?.cliff_onset_lap && (
                        <ReferenceLine
                          x={prediction.cliff_onset_lap}
                          stroke="#FF2A1A"
                          strokeDasharray="4 4"
                          label={{
                            value: `CLIFF ONSET (L${prediction.cliff_onset_lap})`,
                            fontSize: 10,
                            fill: "#FF2A1A",
                            position: "top",
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast Table Snippet */}
                <div className="overflow-x-auto border border-[#1E232B] rounded-lg bg-[#08090B]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#101216] text-[#9A9FA8] font-bold border-b border-[#1E232B]">
                      <tr>
                        <th className="p-2.5">LAP</th>
                        <th className="p-2.5">TYRE AGE</th>
                        <th className="p-2.5">PROJECTED PACE</th>
                        <th className="p-2.5">PURE TYRE LOSS</th>
                        <th className="p-2.5">CONFIDENCE</th>
                        <th className="p-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181C24]">
                      {prediction?.forecast_laps
                        ?.filter((_, i) => i % 4 === 0 || i === (prediction?.forecast_laps?.length || 0) - 1)
                        .map((f) => (
                          <tr key={f.stint_lap} className="hover:bg-[#15181E]/60 transition-colors">
                            <td className="p-2.5 font-bold text-white">L{f.stint_lap}</td>
                            <td className="p-2.5 text-[#9A9FA8]">{f.tyre_age} laps</td>
                            <td className="p-2.5 font-bold text-[#00E5FF]">{f.projected_lap_time.toFixed(3)} s</td>
                            <td className="p-2.5 text-[#FF2A1A] font-bold">+{f.expected_tyre_loss.toFixed(3)} s</td>
                            <td className="p-2.5 text-[#00E676] font-semibold">{f.confidence_pct}%</td>
                            <td className="p-2.5">
                              {f.is_past_cliff ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FF2A1A]/20 text-[#FF2A1A] border border-[#FF2A1A]/40">
                                  PAST CLIFF
                                </span>
                              ) : (
                                <span className="text-[#00E676] text-[10px] font-bold">OPTIMAL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Compound Crossover Matrix */}
              <div className="bg-[#101216] rounded-xl border border-[#222733] p-5 space-y-4 shadow-xl">
                <div className="border-b border-[#1E232B] pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider font-mono text-white">
                    COMPOUND CROSSOVER MATRIX (SOFT C4 VS MEDIUM C3 VS HARD C2)
                  </h3>
                </div>

                {/* Strategic AI Recommendation */}
                <div className="p-4 rounded-lg bg-[#08090B] border-l-4 border-[#00E5FF] border border-[#222733] text-xs font-mono leading-relaxed space-y-1">
                  <div className="font-bold text-[#00E5FF] uppercase tracking-wider flex items-center space-x-1.5">
                    <Flag className="w-3.5 h-3.5" />
                    <span>PIT WALL STRATEGY GUIDANCE</span>
                  </div>
                  <p className="text-[#F5F5F5]">
                    {crossover?.strategic_recommendation}
                  </p>
                </div>

                {/* Crossover Chart */}
                <div className="h-80 w-full bg-[#08090B] rounded-lg p-2 border border-[#1E232B]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={crossover?.comparison_series || []}
                      margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#181C24" />
                      <XAxis
                        dataKey="lap"
                        stroke="#606775"
                        fontSize={11}
                        fontFamily="monospace"
                        label={{ value: "Stint Lap Completed", position: "insideBottom", offset: -5, fontSize: 10, fill: "#606775" }}
                      />
                      <YAxis
                        stroke="#606775"
                        fontSize={11}
                        fontFamily="monospace"
                        domain={["dataMin - 0.4", "dataMax + 0.4"]}
                        unit="s"
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#101216] border border-[#222733] p-3 rounded-lg text-xs font-mono shadow-2xl space-y-1">
                                <div className="font-bold text-[#00E5FF]">LAP {label} COMPARISON</div>
                                <div className="text-[#FF2A1A]">Soft C4: {d.soft_pace.toFixed(3)}s (+{d.soft_deg.toFixed(3)}s deg)</div>
                                <div className="text-[#FFB000]">Medium C3: {d.medium_pace.toFixed(3)}s (+{d.medium_deg.toFixed(3)}s deg)</div>
                                <div className="text-[#F5F5F5]">Hard C2: {d.hard_pace.toFixed(3)}s (+{d.hard_deg.toFixed(3)}s deg)</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontFamily: "monospace", fontSize: "11px" }} />
                      <Line type="monotone" dataKey="soft_pace" stroke="#FF2A1A" strokeWidth={2.5} dot={false} name="Soft C4" />
                      <Line type="monotone" dataKey="medium_pace" stroke="#FFB000" strokeWidth={2.5} dot={false} name="Medium C3" />
                      <Line type="monotone" dataKey="hard_pace" stroke="#F5F5F5" strokeWidth={2.5} dot={false} name="Hard C2" />

                      {crossover?.soft_vs_medium_crossover_lap && (
                        <ReferenceLine
                          x={crossover.soft_vs_medium_crossover_lap}
                          stroke="#FF2A1A"
                          strokeDasharray="4 4"
                          label={{
                            value: `SOFT/MED CROSSOVER (L${crossover.soft_vs_medium_crossover_lap})`,
                            fontSize: 10,
                            fill: "#FF2A1A",
                            position: "top",
                          }}
                        />
                      )}
                      {crossover?.medium_vs_hard_crossover_lap && (
                        <ReferenceLine
                          x={crossover.medium_vs_hard_crossover_lap}
                          stroke="#00E5FF"
                          strokeDasharray="4 4"
                          label={{
                            value: `MED/HARD CROSSOVER (L${crossover.medium_vs_hard_crossover_lap})`,
                            fontSize: 10,
                            fill: "#00E5FF",
                            position: "bottom",
                          }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
