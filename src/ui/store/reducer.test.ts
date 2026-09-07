import { describe, expect, it } from "vitest"
import { createInitialSessionState } from "../../runtime/sessionState"
import type { SimulationStateView } from "../../shared/simulationView"
import { createInitialState } from "./initialState"
import { scamReducer } from "./reducer"

function runningView(risk = 42): SimulationStateView {
	return {
		status: "running",
		scenarioId: "bank-impersonation",
		session: {
			...createInitialSessionState(1_000),
			overallRisk: risk,
			riskLevel: risk >= 80 ? "CRITICAL" : "WATCH",
			events: [
				{
					eventId: "e-call",
					type: "coercion_detected",
					producerId: "call",
					occurredAt: 2_000,
					severity: "high",
					confidence: 0.9,
					channel: "call",
					entityRefs: [],
					summary: "Caller used freeze-or-stay language",
					payload: { tactic: "account freeze", excerpt: "do not hang up" },
				},
			],
		},
		loops: {
			call: {},
			message: {},
			browser: {},
			device: {},
			transaction: {},
			identity: {},
		},
		agents: [],
		callTranscript: [{ speaker: "caller", text: "This is Apex Bank Anti-Fraud Centre." }],
		transactionIntents: [
			{
				amount: 8000,
				currency: "MYR",
				beneficiaryName: "Apex Safe Holding",
				beneficiaryAccount: "9901882233",
				isNewBeneficiary: true,
				paymentRail: "DuitNow",
				reversible: false,
			},
		],
	}
}

describe("scamReducer live session", () => {
	it("starts quiet with no seeded metrics", () => {
		const state = createInitialState()
		expect(state.signals).toEqual([])
		expect(state.connections).toEqual([])
		expect(state.callTranscript).toEqual([])
		expect(state.history).toEqual([])
		expect(state.transfer.visible).toBe(false)
		expect(state.riskScore).toBe(0)
		expect(state.riskLevel).toBe("normal")
		expect(state.stampVisible).toBe(false)
		expect(state.overviewStats).toEqual({
			riskSignals: 0,
			needReview: 0,
			transfersProtected: 0,
			identityChecks: 0,
		})
	})

	it("hydrates risk and transcript from the live view", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "HYDRATE", view: runningView(64) })
		expect(state.demoStatus).toBe("running")
		expect(state.riskScore).toBe(64)
		expect(state.riskLevel).toBe("watch")
		expect(state.headline).toBe("WATCH")
		expect(state.callTranscript.some((line) => line.text.includes("Anti-Fraud Centre"))).toBe(true)
		expect(state.signals[0]?.channel).toBe("call")
		expect(state.transfer.recipient).toBe("Apex Safe Holding")
		expect(state.transfer.bank).toBe("DuitNow")
		expect(state.transfer.amount).toBe("8,000")
	})

	it("keeps a local pause decision when later frames arrive", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "HYDRATE", view: runningView(88) })
		state = scamReducer(state, { type: "PAUSE_TRANSFER_START" })
		state = scamReducer(state, { type: "PAUSE_TRANSFER_FINISH" })
		expect(state.transfer.status).toBe("paused")
		expect(state.overviewStats.transfersProtected).toBe(1)
		expect(state.history[0]?.result).toBe("Paused")
		expect(state.history[0]?.description).toBe("Apex Safe Holding")
		state = scamReducer(state, { type: "HYDRATE", view: runningView(90) })
		expect(state.transfer.status).toBe("paused")
		expect(state.headline).toBe("Transfer paused")
		expect(state.overviewStats.transfersProtected).toBe(1)
	})

	it("records continue without treating it as a protected transfer", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "HYDRATE", view: runningView(88) })
		state = scamReducer(state, { type: "SET_INTERVENTION", phase: "confirm-continue" })
		state = scamReducer(state, { type: "CONTINUE_ANYWAY" })
		expect(state.transfer.status).toBe("continued")
		expect(state.history[0]?.result).toBe("Continued")
		expect(state.overviewStats.transfersProtected).toBe(0)
	})

	it("resets to a quiet desk without leftover transfer or history", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "HYDRATE", view: runningView(88) })
		state = scamReducer(state, { type: "PAUSE_TRANSFER_START" })
		state = scamReducer(state, { type: "PAUSE_TRANSFER_FINISH" })
		state = scamReducer(state, { type: "DEMO_RESET" })
		expect(state.riskScore).toBe(0)
		expect(state.signals).toHaveLength(0)
		expect(state.transfer.visible).toBe(false)
		expect(state.history).toEqual([])
		expect(state.overviewStats.transfersProtected).toBe(0)
		expect(state.intervention).toBe("closed")
	})

	it("clears the previous session when the scenario changes", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "HYDRATE", view: runningView(88) })
		state = scamReducer(state, { type: "SET_SCENARIO", scenarioId: "benign-bank" })
		expect(state.scenarioId).toBe("benign-bank")
		expect(state.signals).toHaveLength(0)
		expect(state.transfer.visible).toBe(false)
		expect(state.riskScore).toBe(0)
		expect(state.demoStatus).toBe("idle")
	})

	it("keeps identity delay and speed across start and reset", () => {
		let state = createInitialState()
		state = scamReducer(state, { type: "SET_IDENTITY_DELAY", enabled: true })
		state = scamReducer(state, { type: "SET_DEMO_SPEED", speed: "fast" })
		state = scamReducer(state, { type: "DEMO_START" })
		expect(state.simulateIdentityDelay).toBe(true)
		expect(state.demoSpeed).toBe("fast")
		expect(state.demoStatus).toBe("running")
		state = scamReducer(state, { type: "DEMO_RESET" })
		expect(state.simulateIdentityDelay).toBe(true)
		expect(state.demoSpeed).toBe("fast")
	})
})
