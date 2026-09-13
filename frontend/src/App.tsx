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

  const [session, setSession] = useState<SessionMeta | null>(null);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [confounders, setConfounders] = useState<ConfounderSummary | null>(null);
  const [degradation, setDegradation] = useState<DegradationAnalysis | null>(null);
  const [tyreTwins, setTyreTwins] = useState<TyreTwin[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (targetSessionId?: string) => {
    try {
      setLoading(true);
      const sessions = await fetchSessions();
      const activeId = targetSessionId || sessions[0]?.session_id || "FP2-SILVERSTONE-2026";

      const [sessDetails, confData, degData, twins, valData] = await Promise.all([
        fetchSessionDetails(activeId),
        fetchConfounderAnalysis(activeId),
        fetchDegradationAnalysis(activeId),
        fetchTyreTwins(),
        fetchRaceValidation("RACE-SILVERSTONE-2026"),
      ]);

      setSession(sessDetails);
      setLaps(sessDetails.laps || []);
      setConfounders(confData);
      setDegradation(degData);
      setTyreTwins(twins);
      setValidation(valData);
    } catch (err) {
      console.error("Error loading TreadTrace telemetry:", err);
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
    try {
      setLoading(true);
      const result = await uploadSession(file);
      await loadData(result.session_id);
      alert(`Custom telemetry session ${result.session_id} uploaded and analyzed successfully! (${result.total_laps} laps ingested)`);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading session file. Please ensure file is valid CSV or JSON.");
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
              <FourWheelDigitalTwinPage initialCorner="RL" />
            )}
            {(currentTab === "tyres/front-left" || currentTab === "FL") && (
              <TyreFrontLeftPage />
            )}
            {(currentTab === "tyres/front-right" || currentTab === "FR") && (
              <TyreFrontRightPage />
            )}
            {(currentTab === "tyres/rear-left" || currentTab === "RL") && (
              <TyreRearLeftPage />
            )}
            {(currentTab === "tyres/rear-right" || currentTab === "RR") && (
              <TyreRearRightPage />
            )}
            {currentTab === "analyzer" && (
              <SessionAnalyzerPage
                session={session}
                laps={laps}
                onUploadSession={handleUploadSession}
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
