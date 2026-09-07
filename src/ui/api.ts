import type { SimulationStateView } from "../shared/simulationView"
import type { ScenarioId } from "../shared/types"

export interface ScenarioOption {
	id: ScenarioId
	title: string
	summary: string
}

export interface HealthStatus {
	ok: boolean
	service: string
	phase: number
	mockInferenceMode: boolean
	inferenceMode: "mock" | "live"
	mozaikRuntime: string
	agentCount: number
	agents: string[]
	scenarioMode: string
	session?: string
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

export async function fetchHealth(): Promise<HealthStatus> {
	const response = await fetch("/health")
	if (!response.ok) {
		throw new Error("Could not load health")
	}
	return (await response.json()) as HealthStatus
}

export async function fetchSystemStatus(): Promise<HealthStatus> {
	const response = await fetch("/api/system/status")
	if (!response.ok) {
		throw new Error("Could not load system status")
	}
	return (await response.json()) as HealthStatus
}

export async function startSimulation(
	scenarioId: ScenarioId,
	speed = 2,
	options: { identityDelay?: boolean } = {},
) {
	const response = await fetch("/api/simulation/start", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			scenarioId,
			speed,
			identityDelay: Boolean(options.identityDelay),
		}),
	})
	if (!response.ok) {
		throw new Error("Could not start simulation")
	}
	return (await response.json()) as SimulationStateView
}

export async function pauseSimulation() {
	const response = await fetch("/api/simulation/pause", { method: "POST" })
	if (!response.ok) {
		throw new Error("Could not pause simulation")
	}
	return (await response.json()) as SimulationStateView
}

export async function resumeSimulation() {
	const response = await fetch("/api/simulation/resume", { method: "POST" })
	if (!response.ok) {
		throw new Error("Could not resume simulation")
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
