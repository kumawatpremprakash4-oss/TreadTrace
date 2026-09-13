import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { CornerTrajectoryPoint } from "../../types";
import { Activity, Info } from "lucide-react";

interface TyreDegradationChartProps {
  curve: CornerTrajectoryPoint[];
  currentLap: number;
  cliffLap: number;
  cornerName: string;
  compound: string;
}

export const TyreDegradationChart: React.FC<TyreDegradationChartProps> = ({
  curve,
  currentLap,
  cliffLap,
  cornerName,
  compound,
}) => {
  return (
    <div className="bg-[#101216] rounded-xl p-5 border border-[#222733] shadow-lg font-mono select-none space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E232B] pb-3">
        <div>
          <h3 className="text-sm font-black uppercase text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#FF2A1A]" />
            <span>CORNER DEGRADATION TRAJECTORY (HUBER REGRESSION)</span>
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#FF2A1A]" />
            <span className="text-[#9A9FA8]">MODEL DEGRADATION</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-2 bg-[#00E5FF]/20 border border-[#00E5FF]/40 rounded-xs" />
            <span className="text-[#9A9FA8]">95% CI BAND</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curve} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E232B" vertical={false} />
            <XAxis
              dataKey="tyre_age"
              stroke="#606775"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `L${val}`}
            />
            <YAxis
              stroke="#606775"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `+${val.toFixed(2)}s`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as CornerTrajectoryPoint;
                return (
                  <div className="bg-[#0B0D12] border border-[#2A313F] p-3 rounded shadow-xl text-xs space-y-1">
                    <div className="font-bold text-white border-b border-[#1E232B] pb-1 flex justify-between gap-4">
                      <span>TYRE AGE: LAP {pt.tyre_age}</span>
                      {pt.is_current_lap && (
                        <span className="text-[#00E676] font-black uppercase">CURRENT LAP</span>
                      )}
                    </div>
                    <div className="text-[#FF2A1A] font-bold">
                      PERFORMANCE LOSS: +{pt.model_degradation.toFixed(3)} s/lap
                    </div>
                    <div className="text-[#00E5FF] text-[10px]">
                      95% CONFIDENCE: +{pt.ci_lower.toFixed(3)}s — +{pt.ci_upper.toFixed(3)}s
                    </div>
                    {pt.cliff_onset && (
                      <div className="text-[#FFB000] font-black text-[10px]">
                        ⚠ NON-LINEAR THERMAL CLIFF ONSET
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* 95% Confidence Interval Upper and Lower Bounds */}
            <Area
              type="monotone"
              dataKey="ci_upper"
              stroke="transparent"
              fill="#00E5FF"
              fillOpacity={0.08}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="ci_lower"
              stroke="transparent"
              fill="#08090B"
              fillOpacity={1.0}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Model Degradation Curve */}
            <Line
              type="monotone"
              dataKey="model_degradation"
              stroke="#FF2A1A"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#FF2A1A", stroke: "#FFFFFF" }}
              isAnimationActive={true}
              animationDuration={850}
              animationEasing="ease-out"
            />

            {/* Reference Line: Current Lap */}
            <ReferenceLine
              x={currentLap}
              stroke="#00E676"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `CURRENT (L${currentLap})`,
                fill: "#00E676",
                fontSize: 10,
                position: "top",
              }}
            />

            {/* Reference Line: Thermal Cliff */}
            <ReferenceLine
              x={cliffLap}
              stroke="#FFB000"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `CLIFF ONSET (L${cliffLap})`,
                fill: "#FFB000",
                fontSize: 10,
                position: "top",
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="flex items-center justify-end text-[11px] text-[#9A9FA8] pt-2 border-t border-[#1E232B]">
        <span className="text-[#606775]">CORNER: {cornerName}</span>
      </div>
    </div>
  );
};
