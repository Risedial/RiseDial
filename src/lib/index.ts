// Core library exports - to be implemented
export { DatabaseUtils as db, getDatabaseUtils, createDatabaseUtils } from './database';
export { config } from './config';

// Export AI orchestrator and agents
export { AIOrchestrator, aiOrchestrator } from './ai-orchestrator';
export { CompanionAgent } from './agents/companion-agent';
export { TherapistAgent } from './agents/therapist-agent';
export { ParadigmAgent } from './agents/paradigm-agent';
export { MemoryAgent } from './agents/memory-agent';

// Export crisis detection system
export { CrisisDetector, crisisDetector } from './crisis-detection';
export { CrisisHandler, crisisHandler } from './crisis-handler';
export { SafetyProtocols, safetyProtocols } from './safety-protocols';

// Export cost monitoring system
export { costMonitor } from './cost-monitor';
export { costAnalytics } from './cost-analytics';

// Export utilities
export { RiskAssessmentUtil } from '../utils/risk-assessment';

export * from './cost-monitor';
export * from './user-manager'; 