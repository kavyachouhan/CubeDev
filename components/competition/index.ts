// Main components
export { default as CompetitionBrowser } from "./CompetitionBrowser";
export { default as CompetitionDetail } from "./CompetitionDetail";
export { default as CompetitionOverview } from "./CompetitionOverview";
export { default as SimulationConfig } from "./SimulationConfig";
export { default as SimulationRunner } from "./SimulationRunner";
export { default as RoundSimulator } from "./RoundSimulator";
export { default as RoundSimulatorRedesigned } from "./RoundSimulatorRedesigned";
export { default as WCAScorecard } from "./WCAScorecard";
export { default as ShareMenu } from "./ShareMenu";
export { default as AtmosphereControls } from "./AtmosphereControls";
export { default as CompetitionAnalytics } from "./CompetitionAnalytics";
export { default as CompetitionWalkthrough } from "./CompetitionWalkthrough";

// New redesigned components
export { default as CompetitionTimer } from "./CompetitionTimer";
export { default as CompetitionManualTimer } from "./CompetitionManualTimer";
export { default as CompetitionStackmatTimer } from "./CompetitionStackmatTimer";
export {
  default as CompetitionTimerModeSelector,
  type CompetitionTimerMode,
} from "./CompetitionTimerModeSelector";
export { default as CompetitionScramblePanel } from "./CompetitionScramblePanel";
export { default as SolveProgressIndicator } from "./SolveProgressIndicator";
export { default as SimulationAtmospherePanel } from "./SimulationAtmospherePanel";
export {
  default as CompetitionAudioManager,
  useCompetitionAudio,
} from "./CompetitionAudioManager";

// New simulation features
export { default as SimulationHistory } from "./SimulationHistory";
export { default as UpcomingCompetitionsSuggestions } from "./UpcomingCompetitionsSuggestions";
export { default as MockSchedule } from "./MockSchedule";
export { default as InspectionViolationTrainer } from "./InspectionViolationTrainer";
export { default as JudgeErrorSimulator } from "./JudgeErrorSimulator";

// Legacy components (can be removed later)
export { default as CompetitionSimulator } from "./CompetitionSimulator";
export { default as CompetitionList } from "./CompetitionList";
export { default as SimulationMode } from "./SimulationMode";
export { default as ResultCardGenerator } from "./ResultCardGenerator";
export { default as QualifyingTracker } from "./QualifyingTracker";
export { default as AnxietyMetrics } from "./AnxietyMetrics";

// Types and constants
export { WCA_EVENTS, type WCACompetition } from "./CompetitionBrowser";
export type {
  RoundResult,
  SolveResult,
  AtmosphereSettings,
} from "./CompetitionDetail";
export type { AtmosphereSettings as SimulationAtmosphereSettings } from "./SimulationConfig";
