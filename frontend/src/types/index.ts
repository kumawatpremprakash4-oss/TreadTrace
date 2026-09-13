export interface LapData {
  lap_number: number;
  stint_id: number;
  stint_lap: number;
  tyre_id: string;
  compound: "SOFT" | "MEDIUM" | "HARD";
  tyre_age: number;
  lap_time: number;
  sector_1?: number;
  sector_2?: number;
  sector_3?: number;
  fuel_load: number;
  track_temperature: number;
  air_temperature?: number;
  traffic_level: number;
  clean_air: boolean;
  yellow_flag: boolean;
  classification: string;
  used_in_model?: boolean;
  estimated_penalty_seconds?: number;
  classification_reason?: string;
  base_performance?: number;
  estimated_tyre_deg?: number;
  estimated_fuel_effect?: number;
  estimated_traffic_effect?: number;
  estimated_track_evo?: number;
  estimated_temp_effect?: number;
  residual_noise?: number;
  normalised_lap_time?: number;
  confounder_explanation?: string;
  provenance?: string;
  inference_status?: string;
}

export interface SessionMeta {
  session_id: string;
  session_type: string;
  circuit: string;
  driver: string;
  car_number?: number;
  total_laps: number;
  provenance: string;
  weather?: string;
  track_temp_start?: number;
  laps?: LapData[];
}

export interface ConfounderSummary {
  total_laps_analyzed: number;
  valid_clean_laps: number;
  excluded_laps: number;
  learned_fuel_sensitivity_sec_per_kg: number;
  max_track_evolution_gain_sec: number;
  provenance: string;
  decomposed_laps: LapData[];
}

export interface CurvePoint {
  tyre_age: number;
  model_degradation: number;
  ci_lower: number;
  ci_upper: number;
  observed_raw_loss: number | null;
  normalised_loss: number | null;
  cliff_onset: boolean;
}

export interface CompoundCurveData {
  compound: "SOFT" | "MEDIUM" | "HARD";
  laps_analyzed: number;
  degradation_rate_sec_per_lap: number;
  naive_apparent_rate_sec_per_lap: number;
  cliff_lap_estimated: number;
  residual_std: number;
  confidence_score_pct: number;
  naive_mae_seconds: number;
  treadtrace_mae_seconds: number;
  error_reduction_pct: number;
  curve: CurvePoint[];
}

export interface DegradationAnalysis {
  provenance: string;
  overall_ab_comparison: {
    naive_baseline_mae: number;
    treadtrace_isolated_mae: number;
    accuracy_improvement_pct: number;
    analytical_verdict: string;
  };
  compounds: Record<string, CompoundCurveData>;
}

export interface StintHistoryEntry {
  timestamp: string;
  session_id: string;
  stint_id: number;
  laps_completed: number;
  cumulative_laps: number;
  avg_lap_time: number;
  observed_degradation_rate: number;
  avg_track_temp: number;
  peak_track_temp: number;
  post_stint_health_pct: number;
  condition_verdict: string;
}

export interface TyreTwin {
  tyre_id: string;
  compound: "SOFT" | "MEDIUM" | "HARD";
  initial_condition: string;
  allocation_set: number;
  accumulated_laps: number;
  heat_cycles: number;
  estimated_degradation_rate: number;
  current_health_pct: number;
  confidence_score: number;
  last_observed_state: string;
  avg_track_temp: number;
  peak_track_temp: number;
  stint_history: StintHistoryEntry[];
  model_evidence_notes: string[];
  definition: string;
  provenance: string;
}

export interface PredictionLapForecast {
  stint_lap: number;
  tyre_age: number;
  projected_lap_time: number;
  expected_tyre_loss: number;
  fuel_component: number;
  remaining_fuel_kg: number;
  confidence_pct: number;
  is_past_cliff: boolean;
}

export interface PredictionResult {
  compound: string;
  start_age_laps: number;
  target_stint_laps: number;
  start_fuel_kg: number;
  track_temp_celsius: number;
  effective_deg_rate_sec_per_lap: number;
  cliff_onset_lap: number;
  usable_stint_window_laps: number;
  predicted_average_lap_time: number;
  provenance: string;
  status: string;
  forecast_laps: PredictionLapForecast[];
}

export interface CrossoverPoint {
  lap: number;
  soft_pace: number;
  medium_pace: number;
  hard_pace: number;
  soft_deg: number;
  medium_deg: number;
  hard_deg: number;
}

export interface CompoundCompareResult {
  stint_length: number;
  start_fuel_kg: number;
  track_temp_celsius: number;
  soft_vs_medium_crossover_lap: number;
  medium_vs_hard_crossover_lap: number;
  strategic_recommendation: string;
  comparison_series: CrossoverPoint[];
  provenance: string;
}

export interface StintValidation {
  stint_id: number;
  compound: "SOFT" | "MEDIUM" | "HARD";
  tyre_id: string;
  laps_evaluated: number;
  predicted_degradation_rate: number;
  actual_degradation_rate: number;
  rate_error_sec_per_lap: number;
  mae_seconds: number;
  rmse_seconds: number;
  bias_seconds: number;
  verdict: "MATCHED EXPECTATION" | "UNDERPREDICTED" | "OVERPREDICTED";
  root_cause_explanation: string;
  comparison_points: Array<{
    stint_lap: number;
    actual_tyre_deg: number;
    predicted_tyre_deg: number;
    delta_seconds: number;
    actual_lap_time: number;
  }>;
}

export interface ValidationResult {
  race_session_id: string;
  circuit: string;
  provenance: string;
  overall_metrics: {
    total_laps_validated: number;
    overall_mae_seconds: number;
    overall_rmse_seconds: number;
    validation_status: string;
  };
  stints: StintValidation[];
}

export type CornerPosition = "FL" | "FR" | "RL" | "RR";
export type CornerRiskState = "NORMAL" | "WARNING" | "CRITICAL" | "FAILURE_RISK";
export type ThermalState = "OPTIMAL" | "WARM" | "STRESSED" | "CRITICAL";
export type CornerCliffStatus = "PRE_CLIFF" | "APPROACHING_CLIFF" | "CLIFF_ONSET" | "POST_CLIFF";

export interface RiskEvaluation {
  risk_score: number;
  risk_state: CornerRiskState;
  warning_level: number;
  thermal_status: ThermalState;
  cliff_status: CornerCliffStatus;
  laps_to_cliff: number;
  current_temperature: number;
  optimal_temperature: number;
  temp_delta: number;
  explanation: string;
  recommended_action: string;
  credibility_disclaimer: string;
}

export interface DegradationBreakdown {
  intrinsic_wear_sec: number;
  thermal_stress_sec: number;
  corner_load_bias_sec: number;
  cliff_acceleration_sec: number;
  total_performance_loss_sec: number;
}

export interface CornerProvenanceMetadata {
  status: string;
  load_factor: number;
  wear_multiplier: number;
  is_measured: boolean;
  is_modeled: boolean;
  is_estimated: boolean;
  corner_dynamics_rationale: string;
}

export interface CornerStintHistory {
  stint_id: number;
  session_id: string;
  laps_completed: number;
  avg_lap_time: number;
  observed_degradation_rate: number;
  peak_temp: number;
  condition_verdict: string;
}

export interface CornerTyreState {
  tyre_id: string;
  parent_set_id: string;
  position: CornerPosition;
  position_label: string;
  axis: "FRONT" | "REAR";
  side: "LEFT" | "RIGHT";
  compound: "SOFT" | "MEDIUM" | "HARD";
  compound_code: string;
  compound_color: string;
  accumulated_laps: number;
  tyre_age: number;
  heat_cycles: number;
  current_health_pct: number;
  estimated_degradation_rate: number;
  baseline_degradation_rate: number;
  current_temperature: number;
  peak_track_temp: number;
  avg_track_temp: number;
  remaining_useful_life: number;
  cliff_lap: number;
  degradation_pct: number;
  thermal_state: ThermalState;
  cliff_status: CornerCliffStatus;
  risk_state: CornerRiskState;
  risk_score: number;
  warning_level: number;
  last_observed_state: string;
  stint_history: CornerStintHistory[];
  model_evidence_notes: string[];
  degradation_breakdown: DegradationBreakdown;
  risk_evaluation: RiskEvaluation;
  provenance_metadata: CornerProvenanceMetadata;
}

export interface VehicleTyreAlert {
  position: CornerPosition;
  position_label: string;
  risk_state: CornerRiskState;
  risk_score: number;
  rul_laps: number;
  explanation: string;
  recommended_action: string;
}

export interface VehicleDigitalTwinState {
  vehicle_id: string;
  driver: string;
  circuit: string;
  session_id: string;
  lap: number;
  total_session_laps: number;
  fuel_load_kg: number;
  track_temperature: number;
  active_compound: "SOFT" | "MEDIUM" | "HARD";
  provenance: string;
  mapping_assumption: string;
  thresholds: Record<string, number>;
  tyres: Record<CornerPosition, CornerTyreState>;
  alerts: VehicleTyreAlert[];
  summary: {
    critical_tyres_count: number;
    warning_tyres_count: number;
    optimal_tyres_count: number;
    highest_risk_corner: string;
  };
}

export interface CornerTrajectoryPoint {
  tyre_age: number;
  model_degradation: number;
  ci_lower: number;
  ci_upper: number;
  cliff_onset: boolean;
  is_current_lap: boolean;
}

export interface CornerDetailResponse extends CornerTyreState {
  curve: CornerTrajectoryPoint[];
  vehicle_context: {
    vehicle_id: string;
    lap: number;
    fuel_load_kg: number;
    track_temp_celsius: number;
    active_alerts_count: number;
  };
}

