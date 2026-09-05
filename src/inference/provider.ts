import type { AgentId, Channel, CheckMode, ScenarioFeedItem, TrustedRegistry } from "../shared/types"
import type { ANALYSIS_SCHEMA, AnalysisResult } from "./schema"

export interface InferenceContext {
	agentId: AgentId
	channel: Channel
	mode: CheckMode
	registry?: TrustedRegistry
}

export interface AnalyzeInput {
	channel: Channel
	payload: ScenarioFeedItem["payload"] | { text: string }
}

export interface InferenceProvider {
	analyze(input: AnalyzeInput, schema: typeof ANALYSIS_SCHEMA, context: InferenceContext): Promise<AnalysisResult>
}
