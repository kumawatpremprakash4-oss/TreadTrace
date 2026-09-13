export interface CircuitSectorInfo {
  tabId: string;
  tabLabel: string;
  cornerName: string;
  turnNumber: string;
  sector: "SECTOR 1" | "SECTOR 2" | "SECTOR 3";
  gear: number;
  speedKmh: number;
  lateralG: number;
  apexDescription: string;
  trackProgressPct: number; // 0 to 100% around the circuit lap
}

export const CIRCUIT_SECTORS: Record<string, CircuitSectorInfo> = {
  vehicle_twin: {
    tabId: "vehicle_twin",
    tabLabel: "4-WHEEL TWIN",
    cornerName: "WELLINGTON STRAIGHT & BROOKLANDS",
    turnNumber: "T5 - T6",
    sector: "SECTOR 2",
    gear: 7,
    speedKmh: 305,
    lateralG: 3.5,
    apexDescription: "Asymmetric braking & lateral load into Brooklands left-hander",
    trackProgressPct: 42,
  },
  analyzer: {
    tabId: "analyzer",
    tabLabel: "SESSIONS",
    cornerName: "ABBEY & FARM CURVE",
    turnNumber: "T1 - T2",
    sector: "SECTOR 1",
    gear: 7,
    speedKmh: 285,
    lateralG: 4.4,
    apexDescription: "High-speed right kink • Telemetry ingress point",
    trackProgressPct: 18,
  },
  confounders: {
    tabId: "confounders",
    tabLabel: "CONFOUNDERS",
    cornerName: "VILLAGE & THE LOOP",
    turnNumber: "T3 - T4",
    sector: "SECTOR 1",
    gear: 2,
    speedKmh: 88,
    lateralG: -4.8,
    apexDescription: "Heavy braking zone • Stripping aero wake & mass penalty",
    trackProgressPct: 32,
  },
  degradation: {
    tabId: "degradation",
    tabLabel: "DEGRADATION",
    cornerName: "BROOKLANDS & LUFFIELD",
    turnNumber: "T6 - T7",
    sector: "SECTOR 2",
    gear: 3,
    speedKmh: 142,
    lateralG: 3.8,
    apexDescription: "Long sustained lateral tyre scrub • Mechanical grip limit",
    trackProgressPct: 48,
  },
  tyre_memory: {
    tabId: "tyre_memory",
    tabLabel: "TYRE MEMORY",
    cornerName: "COPSE CORNER",
    turnNumber: "T9",
    sector: "SECTOR 2",
    gear: 8,
    speedKmh: 290,
    lateralG: 5.1,
    apexDescription: "Blind right apex flat-out • Maximum carcass thermal stress",
    trackProgressPct: 62,
  },
  prediction: {
    tabId: "prediction",
    tabLabel: "PREDICTION",
    cornerName: "MAGGOTTS & BECKETTS",
    turnNumber: "T10 - T13",
    sector: "SECTOR 2",
    gear: 6,
    speedKmh: 260,
    lateralG: 5.3,
    apexDescription: "Violent direction change • Compound crossover threshold",
    trackProgressPct: 75,
  },
  validation: {
    tabId: "validation",
    tabLabel: "VALIDATION",
    cornerName: "STOWE CORNER",
    turnNumber: "T15",
    sector: "SECTOR 3",
    gear: 6,
    speedKmh: 225,
    lateralG: 4.2,
    apexDescription: "End of Hangar Straight • Reality vs prediction showdown",
    trackProgressPct: 88,
  },
  model_evidence: {
    tabId: "model_evidence",
    tabLabel: "AI EVIDENCE",
    cornerName: "VALE & CLUB CHICANE",
    turnNumber: "T16 - T18",
    sector: "SECTOR 3",
    gear: 3,
    speedKmh: 110,
    lateralG: 2.9,
    apexDescription: "Final braking chicane • Checkered flag & model provenance",
    trackProgressPct: 98,
  },
};
