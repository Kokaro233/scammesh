import { CHANNELS, SCENARIO_IDS, type Channel, type Scenario, type ScenarioId } from "../shared/types"
import { ambiguousScenario } from "./ambiguousScenario"
import { bankImpersonationScenario } from "./bankImpersonation"
import { benignBankScenario } from "./benignBankScenario"

const SCENARIOS: Record<ScenarioId, Scenario> = {
	"bank-impersonation": bankImpersonationScenario,
	"benign-bank": benignBankScenario,
	ambiguous: ambiguousScenario,
}

const FORBIDDEN_JUDGEMENT_TOKENS = [
	"riskScore",
	"overallRisk",
	"cross_channel_pattern_detected",
	"cross_channel_pattern",
] as const

export function loadScenario(id: ScenarioId): Scenario {
	const scenario = SCENARIOS[id]
	return {
		...scenario,
		feeds: [...scenario.feeds].sort((left, right) => left.timestampOffsetMs - right.timestampOffsetMs),
	}
}

export function loadAllScenarios(): Scenario[] {
	return SCENARIO_IDS.map((id) => loadScenario(id))
}

export function feedsForChannel(scenario: Scenario, channel: Channel) {
	return scenario.feeds.filter((feed) => feed.sourceChannel === channel)
}

export function channelsCovered(scenario: Scenario): Channel[] {
	return CHANNELS.filter((channel) => scenario.feeds.some((feed) => feed.sourceChannel === channel))
}

export function forbiddenJudgementTokensIn(scenario: Scenario): string[] {
	const serialized = JSON.stringify(scenario)
	return FORBIDDEN_JUDGEMENT_TOKENS.filter((token) => serialized.includes(token))
}
