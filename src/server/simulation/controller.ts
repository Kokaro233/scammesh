import { createScamSession } from "../../runtime/createScamSession"
import { loadScenario } from "../../scenarios/loadScenario"
import { SCENARIO_IDS, type ScenarioFeedItem, type ScenarioId } from "../../shared/types"
import type { SimulationStateView, SimulationStatus } from "../../shared/simulationView"
import type { UiEvent } from "../../shared/uiEvents"
import { injectScenarioFeed } from "./injectFeed"
import { summarizeObservation } from "./observations"
import { idleSimulationView, toSimulationView } from "./publicState"

export interface StartSimulationInput {
	scenarioId?: ScenarioId
	speed?: number
	identityDelay?: boolean
}

type LiveSession = ReturnType<typeof createScamSession>

export class SimulationController {
	private session: LiveSession | null = null
	private status: SimulationStatus = "idle"
	private scenarioId: ScenarioId | null = null
	private speed = 1
	private identityDelay = false
	private clockStart = 0
	private elapsedMs = 0
	private injected = new Set<string>()
	private timers: ReturnType<typeof setTimeout>[] = []
	private poll: ReturnType<typeof setInterval> | null = null
	private listeners = new Set<(event: UiEvent) => void>()
	private eventCursor = 0
	private adaptationCursor = 0
	private snapshotCursor = 0
	private observationCursor = 0

	subscribe(listener: (event: UiEvent) => void) {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	listenerCount() {
		return this.listeners.size
	}

	view(): SimulationStateView {
		return toSimulationView(this.status, this.scenarioId, this.session?.resolveRuntime().state)
	}

	start(input: StartSimulationInput = {}) {
		const scenarioId = input.scenarioId ?? "bank-impersonation"
		if (!SCENARIO_IDS.includes(scenarioId)) {
			throw new Error(`Unknown scenario: ${scenarioId}`)
		}

		this.clearRuntime()
		this.session = createScamSession()
		this.scenarioId = scenarioId
		this.speed = input.speed && input.speed > 0 ? input.speed : 1
		this.identityDelay = Boolean(input.identityDelay)
		this.status = "running"
		this.elapsedMs = 0
		this.clockStart = Date.now()
		this.injected = new Set()
		this.resetCursors()

		const runtime = this.session.resolveRuntime()
		runtime.state.session.sessionId = `sim-${scenarioId}-${Date.now()}`
		runtime.state.session.startedAt = Date.now()
		this.session.start()
		this.emit({ kind: "started", scenarioId, at: Date.now() })
		this.flush()
		this.scheduleRemaining()
		this.ensurePoll()
		return this.view()
	}

	pause() {
		if (this.status !== "running") {
			return this.view()
		}
		this.elapsedMs = Date.now() - this.clockStart
		this.clearFeedTimers()
		this.status = "paused"
		this.flush()
		return this.view()
	}

	resume() {
		if (this.status !== "paused" || !this.session || !this.scenarioId) {
			return this.view()
		}
		this.status = "running"
		this.clockStart = Date.now() - this.elapsedMs
		this.scheduleRemaining()
		this.ensurePoll()
		this.flush()
		return this.view()
	}

	reset() {
		this.clearRuntime()
		this.status = "idle"
		this.scenarioId = null
		this.elapsedMs = 0
		this.injected = new Set()
		this.resetCursors()
		this.emit({ kind: "reset", at: Date.now() })
		return idleSimulationView()
	}

	private feedDelay(feed: ScenarioFeedItem) {
		const extra = this.identityDelay && feed.sourceChannel === "identity" ? 4_000 : 0
		return Math.max(0, Math.floor((feed.timestampOffsetMs + extra) / this.speed))
	}

	private scheduleRemaining() {
		if (!this.scenarioId) {
			return
		}

		const scenario = loadScenario(this.scenarioId)
		for (const feed of scenario.feeds) {
			if (this.injected.has(feed.feedId)) {
				continue
			}
			const delay = this.feedDelay(feed) - this.elapsedMs
			this.timers.push(
				setTimeout(() => {
					if (!this.session || this.status !== "running") {
						return
					}
					this.injected.add(feed.feedId)
					injectScenarioFeed(this.session, feed)
					this.flush()
				}, Math.max(0, delay)),
			)
		}

		const lastDelay = Math.max(0, ...scenario.feeds.map((feed) => this.feedDelay(feed)))
		this.timers.push(
			setTimeout(() => {
				if (this.status === "running") {
					this.flush()
					this.status = "finished"
					this.emit({ kind: "finished", at: Date.now() })
				}
			}, Math.max(0, lastDelay + 400 - this.elapsedMs)),
		)
	}

	private emit(event: UiEvent) {
		for (const listener of this.listeners) {
			listener(event)
		}
	}

	private flush() {
		if (!this.session) {
			return
		}

		const state = this.session.resolveRuntime().state
		while (this.observationCursor < state.analyzeLog.length) {
			const entry = state.analyzeLog[this.observationCursor]
			this.observationCursor += 1
			this.emit({
				kind: "observation",
				agentId: entry.agentId,
				channel: entry.channel,
				summary: summarizeObservation(entry),
				at: Date.now(),
			})
		}
		while (this.eventCursor < state.session.events.length) {
			const event = state.session.events[this.eventCursor]
			this.eventCursor += 1
			this.emit({ kind: "semantic_event", event })
		}
		while (this.adaptationCursor < state.session.adaptations.length) {
			const adaptation = state.session.adaptations[this.adaptationCursor]
			this.adaptationCursor += 1
			this.emit({ kind: "adaptation", adaptation })
		}
		while (this.snapshotCursor < state.session.riskSnapshots.length) {
			const snapshot = state.session.riskSnapshots[this.snapshotCursor]
			this.snapshotCursor += 1
			this.emit({ kind: "risk_escalation", snapshot })
		}
	}

	private resetCursors() {
		this.eventCursor = 0
		this.adaptationCursor = 0
		this.snapshotCursor = 0
		this.observationCursor = 0
	}

	private ensurePoll() {
		if (this.poll) {
			return
		}
		this.poll = setInterval(() => {
			if (this.status === "running" || this.status === "paused" || this.status === "finished") {
				this.flush()
			}
		}, 50)
	}

	private clearFeedTimers() {
		for (const timer of this.timers) {
			clearTimeout(timer)
		}
		this.timers = []
	}

	private clearTimers() {
		this.clearFeedTimers()
		if (this.poll) {
			clearInterval(this.poll)
			this.poll = null
		}
	}

	private clearRuntime() {
		this.clearTimers()
		if (this.session) {
			this.session.dispose()
			this.session = null
		}
	}
}

export function createSimulationController() {
	return new SimulationController()
}
