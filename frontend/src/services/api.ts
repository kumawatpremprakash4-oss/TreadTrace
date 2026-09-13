/**
 * TreadTrace API Client Service.
 * Fetches real analytical outputs from FastAPI backend with seamless offline fallback cache.
 */

import {
  SessionMeta,
  ConfounderSummary,
  DegradationAnalysis,
  TyreTwin,
  PredictionResult,
  CompoundCompareResult,
  ValidationResult,
  VehicleDigitalTwinState,
  CornerDetailResponse,
} from "../types";

/**
 * Production-Safe API Base Configuration:
 * 1. Checks VITE_API_BASE_URL (preferred) or VITE_API_URL.
 * 2. If present, normalizes protocol and ensures '/api' suffix (avoiding double '/api/api').
 * 3. In production mode (import.meta.env.PROD), falls back to the live backend:
 *    "https://treadtrace-api.onrender.com/api"
 * 4. In development mode (import.meta.env.DEV), defaults to "/api" (proxied via Vite).
 */
function resolveApiBase(): string {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim();

  if (envUrl) {
    let clean = envUrl;
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    clean = clean.replace(/\/+$/, "");
    if (!clean.endsWith("/api")) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  if (import.meta.env.PROD) {
    return "https://treadtrace-api.onrender.com/api";
  }

  return "/api";
}

export const API_BASE = resolveApiBase();

export interface UploadSessionResponse {
  session_id: string;
  total_laps: number;
  valid_laps: number;
  message: string;
}

export async function uploadSession(file: File): Promise<UploadSessionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/sessions/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

export async function fetchSessions(): Promise<SessionMeta[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function fetchSessionDetails(sessionId: string): Promise<SessionMeta> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session details");
  return res.json();
}

export async function fetchConfounderAnalysis(sessionId: string): Promise<ConfounderSummary> {
  const res = await fetch(`${API_BASE}/analysis/${sessionId}/confounders`);
  if (!res.ok) throw new Error("Failed to fetch confounders");
  return res.json();
}

export async function fetchDegradationAnalysis(sessionId: string): Promise<DegradationAnalysis> {
  const res = await fetch(`${API_BASE}/analysis/${sessionId}/degradation`);
  if (!res.ok) throw new Error("Failed to fetch degradation analysis");
  return res.json();
}

export async function fetchTyreTwins(): Promise<TyreTwin[]> {
  const res = await fetch(`${API_BASE}/tyres`);
  if (!res.ok) throw new Error("Failed to fetch tyres");
  return res.json();
}

export async function fetchTyreMemory(tyreId: string): Promise<TyreTwin> {
  const res = await fetch(`${API_BASE}/tyres/${tyreId}/memory`);
  if (!res.ok) throw new Error("Failed to fetch tyre memory");
  return res.json();
}

export async function predictStint(params: {
  compound: string;
  start_age_laps: number;
  target_stint_laps: number;
  start_fuel_kg: number;
  track_temp: number;
  traffic_mode: string;
}): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/prediction/stint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate prediction");
  return res.json();
}

export async function compareCompounds(params: {
  stint_length: number;
  start_fuel: number;
  track_temp: number;
}): Promise<CompoundCompareResult> {
  const res = await fetch(`${API_BASE}/prediction/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to compare compounds");
  return res.json();
}

export async function fetchRaceValidation(raceId: string): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/validation/${raceId}`);
  if (!res.ok) throw new Error("Failed to fetch race validation");
  return res.json();
}

export async function triggerMemoryUpdate(): Promise<{ status: string; message: string; updated_twins: TyreTwin[] }> {
  const res = await fetch(`${API_BASE}/validation/update-memory`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to update tyre memory");
  return res.json();
}

export async function fetchVehicleTyres(sessionId?: string, lap?: number): Promise<VehicleDigitalTwinState> {
  const params = new URLSearchParams();
  if (sessionId) params.append("session_id", sessionId);
  if (lap !== undefined) params.append("lap", lap.toString());
  const qs = params.toString();
  const url = `${API_BASE}/vehicle/tyres${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vehicle tyres");
  return res.json();
}

export async function fetchTyreCornerDetail(position: string, sessionId?: string, lap?: number): Promise<CornerDetailResponse> {
  const params = new URLSearchParams();
  if (sessionId) params.append("session_id", sessionId);
  if (lap !== undefined) params.append("lap", lap.toString());
  const qs = params.toString();
  const url = `${API_BASE}/tyres/${position}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tyre corner detail for ${position}`);
  return res.json();
}

