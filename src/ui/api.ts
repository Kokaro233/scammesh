import type { SimulationStateView } from "../shared/simulationView"
import type { ScenarioId } from "../shared/types"

export interface ScenarioOption {
	id: ScenarioId
	title: string
	summary: string
}

export async function fetchSimulationState(): Promise<SimulationStateView> {
	const response = await fetch("/api/simulation/state")
	if (!response.ok) {
		throw new Error("Could not load simulation state")
	}
	return (await response.json()) as SimulationStateView
}

export async function fetchScenarios(): Promise<ScenarioOption[]> {
	const response = await fetch("/api/scenarios")
	if (!response.ok) {
		throw new Error("Could not load scenarios")
	}
	const body = (await response.json()) as { scenarios: ScenarioOption[] }
	return body.scenarios
}

export async function startSimulation(scenarioId: ScenarioId, speed = 2) {
	const response = await fetch("/api/simulation/start", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ scenarioId, speed }),
	})
	if (!response.ok) {
		throw new Error("Could not start simulation")
	}
	return (await response.json()) as SimulationStateView
}

export async function resetSimulation() {
	const response = await fetch("/api/simulation/reset", { method: "POST" })
	if (!response.ok) {
		throw new Error("Could not reset simulation")
	}
	return (await response.json()) as SimulationStateView
}
