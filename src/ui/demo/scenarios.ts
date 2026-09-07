import type { DemoScenarioId } from "../store/types"

export const DEMO_SCENARIOS: Array<{ id: DemoScenarioId; title: string; summary: string }> = [
	{
		id: "bank-impersonation",
		title: "Apex Bank impersonation",
		summary: "HIGH RISK · Pause transfer recommended",
	},
	{
		id: "benign-bank",
		title: "Official bank transfer",
		summary: "LOW · Official transfer · No intervention",
	},
	{
		id: "ambiguous",
		title: "Unknown caller + official banking",
		summary: "Incomplete pattern · Verify before continuing",
	},
]

export function scenarioTitle(id: DemoScenarioId): string {
	return DEMO_SCENARIOS.find((item) => item.id === id)?.title ?? id
}
