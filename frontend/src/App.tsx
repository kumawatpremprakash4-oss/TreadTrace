import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LiveTelemetryStrip } from "./components/LiveTelemetryStrip";
import { CircuitTrackRibbon } from "./components/CircuitTrackRibbon";
import { TrackTransitionOverlay } from "./components/TrackTransitionOverlay";
import { HeroLanding } from "./components/HeroLanding";
import { ProvenanceModal } from "./components/ProvenanceModal";
import { JudgeModeOverlay, JUDGE_STEPS } from "./components/JudgeModeOverlay";
import { MotorsportMotionBackground } from "./components/MotorsportMotionBackground";

import { FourWheelDigitalTwinPage } from "./pages/FourWheelDigitalTwinPage";
import { TyreFrontLeftPage } from "./pages/TyreFrontLeftPage";
import { TyreFrontRightPage } from "./pages/TyreFrontRightPage";
import { TyreRearLeftPage } from "./pages/TyreRearLeftPage";
import { TyreRearRightPage } from "./pages/TyreRearRightPage";
import { SessionAnalyzerPage } from "./pages/SessionAnalyzerPage";
import { ConfounderLabPage } from "./pages/ConfounderLabPage";
import { DegradationLabPage } from "./pages/DegradationLabPage";
import { TyreMemoryPage } from "./pages/TyreMemoryPage";
import { PredictionPage } from "./pages/PredictionPage";
import { ValidationPage } from "./pages/ValidationPage";
import { ModelEvidencePage } from "./pages/ModelEvidencePage";

import {
  fetchSessions,
  fetchSessionDetails,
  fetchConfounderAnalysis,
  fetchDegradationAnalysis,
  fetchTyreTwins,
  fetchRaceValidation,
  uploadSession,
} from "./services/api";

import {
  SessionMeta,
  ConfounderSummary,
  DegradationAnalysis,
  TyreTwin,
  ValidationResult,
  LapData,
} from "./types";

export function App() {
  const [isHeroMode, setIsHeroMode] = useState<boolean>(false);
  const [isProvenanceModalOpen, setIsProvenanceModalOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>("vehicle_twin");
  const [previousTab, setPreviousTab] = useState<string>("vehicle_twin");
  const [transitionActive, setTransitionActive] = useState<boolean>(false);

  const [judgeMode, setJudgeMode] = useState<boolean>(false);
  const [judgeStepIndex, setJudgeStepIndex] = useState<number>(0);

  const [availableSessions, setAvailableSessions] = useState<SessionMeta[]>([]);
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [confounders, setConfounders] = useState<ConfounderSummary | null>(null);
  const [degradation, setDegradation] = useState<DegradationAnalysis | null>(null);
  const [tyreTwins, setTyreTwins] = useState<TyreTwin[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /** Non-blocking upload status toast — replaces blocking window.alert() */
  const [uploadNotification, setUploadNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = async (targetSessionId?: string) => {
    try {
      setLoading(true);
      const sessions = await fetchSessions();
      setAvailableSessions(sessions);

      // Determine active session:
      // 1. Explicit targetSessionId passed to loadData
      // 2. Saved session in localStorage (if it exists in sessions list)
      // 3. Most recent uploaded session (if any exist)
      // 4. First session from sessions list
      // 5. Default "FP2-SILVERSTONE-2026"
      const savedSessionId = localStorage.getItem("treadtrace_active_session");
      const savedExists = savedSessionId && sessions.some((s) => s.session_id === savedSessionId);
      const latestUploaded = [...sessions].reverse().find((s) => s.session_id.startsWith("UPLOAD-"));

      const activeId =
        targetSessionId ||
        (savedExists ? savedSessionId : null) ||
        latestUploaded?.session_id ||
        sessions[0]?.session_id ||
        "FP2-SILVERSTONE-2026";

      localStorage.setItem("treadtrace_active_session", activeId);

      // Fetch session details first (required) — fail fast if missing.
      const sessDetails = await fetchSessionDetails(activeId);
      setSession(sessDetails);
      setLaps(sessDetails.laps || []);

      // Analysis endpoints (non-critical): use allSettled so one failure
      // doesn't wipe all state and black-screen the dashboard.
      const [confResult, degResult, twinsResult, valResult] = await Promise.allSettled([
        fetchConfounderAnalysis(activeId),
        fetchDegradationAnalysis(activeId),
        fetchTyreTwins(),
        fetchRaceValidation("RACE-SILVERSTONE-2026"),
      ]);

      if (confResult.status === "fulfilled") setConfounders(confResult.value);
      else console.warn("[TreadTrace] Confounder analysis unavailable:", confResult.reason);

      if (degResult.status === "fulfilled") setDegradation(degResult.value);
      else console.warn("[TreadTrace] Degradation analysis unavailable:", degResult.reason);

      if (twinsResult.status === "fulfilled") setTyreTwins(twinsResult.value);
      else console.warn("[TreadTrace] Tyre twins unavailable:", twinsResult.reason);

      if (valResult.status === "fulfilled") setValidation(valResult.value);
      else console.warn("[TreadTrace] Race validation unavailable:", valResult.reason);

    } catch (err) {
      console.error("[TreadTrace] Critical load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTab = (tab: string) => {
    if (tab !== currentTab) {
      setPreviousTab(currentTab);
      setTransitionActive(true);
      setCurrentTab(tab);
    }
    setIsHeroMode(false);
  };

  const handleStartJudgeTour = () => {
    setIsHeroMode(false);
    setJudgeMode(true);
    setJudgeStepIndex(0);
    handleSelectTab(JUDGE_STEPS[0].tabTarget);
  };

  const handleUploadSession = async (file: File) => {
    setUploadNotification(null);
    try {
      setLoading(true);
      const result = await uploadSession(file);
      localStorage.setItem("treadtrace_active_session", result.session_id);
      await loadData(result.session_id);
      setCurrentTab("analyzer");
      const msg = `Session ${result.session_id} uploaded and analysed — ${result.total_laps} laps ingested.`;
      setUploadNotification({ type: "success", text: msg });
      // Auto-dismiss success toast after 6 seconds
      setTimeout(() => setUploadNotification(null), 6000);
    } catch (err) {
      console.error("[TreadTrace] Upload error:", err);
      const errMsg = (err instanceof Error ? err.message : String(err)) || "Check file format (CSV / JSON / XLSX).";
      setUploadNotification({ type: "error", text: `Upload failed: ${errMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleMemoryUpdated = async () => {
    try {
      const updatedTwins = await fetchTyreTwins();
      setTyreTwins(updatedTwins);
    } catch (err) {
      console.error("Failed to refresh tyre twins:", err);
    }
  };

  if (isHeroMode) {
    return (
      <HeroLanding
        onEnterGarage={() => {
          setIsHeroMode(false);
          setTransitionActive(true);
        }}
        onLaunchJudgeTour={handleStartJudgeTour}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07080A] text-[#F5F5F5] flex flex-col font-sans select-none relative overflow-x-hidden">

      {/* Non-blocking upload status toast (replaces window.alert) */}
      {uploadNotification && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-[9999] max-w-sm w-full px-5 py-3.5 rounded-lg text-[11px] font-bold font-mono shadow-2xl border flex items-start justify-between gap-3 animate-tab-entrance ${
            uploadNotification.type === "success"
              ? "bg-[#00E676]/10 border-[#00E676]/50 text-[#00E676]"
              : "bg-[#E10600]/10 border-[#E10600]/50 text-[#FF2A1A]"
          }`}
        >
          <span className="leading-relaxed flex-1">{uploadNotification.text}</span>
          <button
            onClick={() => setUploadNotification(null)}
            className="text-current opacity-60 hover:opacity-100 text-base leading-none flex-shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Background Motorsport Motion Environment (Fixed behind content) */}
      <MotorsportMotionBackground />

      {/* Racetrack Tab Shift Fullscreen Transition (450ms Flyby) */}
      <TrackTransitionOverlay
        active={transitionActive}
        targetTab={currentTab}
        previousTab={previousTab}
        onComplete={() => setTransitionActive(false)}
      />

      {/* Pit Wall Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        judgeMode={judgeMode}
        onToggleJudgeMode={() => {
          if (!judgeMode) {
            handleStartJudgeTour();
          } else {
            setJudgeMode(false);
          }
        }}
        onOpenProvenance={() => setIsProvenanceModalOpen(true)}
        onReturnToLanding={() => setIsHeroMode(true)}
      />

      {/* Live Rolling Telemetry Strip */}
      <LiveTelemetryStrip />

      {/* Circuit Track Ribbon with Car Progress & SFX */}
      <CircuitTrackRibbon
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Guided Tour Banner for Judges */}
      {judgeMode && (
        <JudgeModeOverlay
          currentStepIndex={judgeStepIndex}
          onSetStepIndex={setJudgeStepIndex}
          onClose={() => setJudgeMode(false)}
          onNavigateTab={handleSelectTab}
        />
      )}

      {/* Dataset Provenance Audit Modal */}
      <ProvenanceModal
        isOpen={isProvenanceModalOpen}
        onClose={() => setIsProvenanceModalOpen(false)}
      />

      {/* Main Container with Velocity Tab Entrance */}
      <main
        key={currentTab}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 animate-tab-entrance"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-10 h-10 border-4 border-[#E10600] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-[#9A9FA8] tracking-widest uppercase">
              ISOLATING PRACTICE CONFOUNDERS & FITTING MODELS...
            </span>
          </div>
        ) : (
          <>
            {(currentTab === "vehicle_twin" || currentTab === "tyres") && (
              <FourWheelDigitalTwinPage
                initialCorner="RL"
                sessionId={session?.session_id}
                maxLaps={laps.length || session?.total_laps || 35}
              />
            )}
            {(currentTab === "tyres/front-left" || currentTab === "FL") && (
              <TyreFrontLeftPage
                sessionId={session?.session_id}
                maxLaps={laps.length || session?.total_laps || 35}
              />
            )}
            {(currentTab === "tyres/front-right" || currentTab === "FR") && (
              <TyreFrontRightPage
                sessionId={session?.session_id}
                maxLaps={laps.length || session?.total_laps || 35}
              />
            )}
            {(currentTab === "tyres/rear-left" || currentTab === "RL") && (
              <TyreRearLeftPage
                sessionId={session?.session_id}
                maxLaps={laps.length || session?.total_laps || 35}
              />
            )}
            {(currentTab === "tyres/rear-right" || currentTab === "RR") && (
              <TyreRearRightPage
                sessionId={session?.session_id}
                maxLaps={laps.length || session?.total_laps || 35}
              />
            )}
            {currentTab === "analyzer" && (
              <SessionAnalyzerPage
                session={session}
                laps={laps}
                onUploadSession={handleUploadSession}
                availableSessions={availableSessions}
                onSelectSession={(id: string) => loadData(id)}
              />
            )}
            {currentTab === "confounders" && (
              <ConfounderLabPage confounderData={confounders} />
            )}
            {currentTab === "degradation" && (
              <DegradationLabPage degradationData={degradation} />
            )}
            {currentTab === "tyre_memory" && (
              <TyreMemoryPage tyreTwins={tyreTwins} />
            )}
            {currentTab === "prediction" && <PredictionPage />}
            {currentTab === "validation" && (
              <ValidationPage
                validationData={validation}
                onMemoryUpdated={handleMemoryUpdated}
              />
            )}
            {currentTab === "model_evidence" && <ModelEvidencePage />}
          </>
        )}
      </main>

      {/* Pit Wall Footer */}
      <footer className="border-t border-[#1E232B] bg-[#0b0d12] py-4 mt-8 text-xs font-mono text-[#9A9FA8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[#606775]">
            <span className="font-bold text-white">TREADTRACE AI ENGINE</span>
            <span>•</span>
            <span>MULTIVARIATE MOTORSPORT TYRE INTELLIGENCE & DIGITAL TWIN</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={() => setIsProvenanceModalOpen(true)}
              className="text-[#FFB000] hover:underline cursor-pointer flex items-center space-x-1"
            >
              <span>DATA PROVENANCE: SYNTHETIC DEMONSTRATION</span>
            </button>
            <span className="text-[#222733]">•</span>
            <span className="text-[#00E676] font-bold">ALL ML MODELS LIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
