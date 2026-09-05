import { describe, expect, it } from "vitest"
import { AGENT_IDS } from "../shared/types"
import { createInitialSessionState, resetSessionState } from "./sessionState"

describe("resettable session state", () => {
	it("starts from the same empty contract every time", () => {
		const first = resetSessionState()
		const second = resetSessionState()

		expect(first).toEqual(second)
		expect(first.overallRisk).toBe(0)
		expect(first.riskLevel).toBe("LOW")
		expect(first.events).toEqual([])
		expect(first.adaptations).toEqual([])
		expect(first.riskSnapshots).toEqual([])
		expect(first.activeAgents).toEqual([...AGENT_IDS])
		expect(Object.values(first.agentModes).every((mode) => mode === "NORMAL")).toBe(true)
		expect(Object.values(first.agentStatuses).every((status) => status === "IDLE")).toBe(true)
	})

	it("does not reuse mutated session objects", () => {
		const session = createInitialSessionState(0)
		session.events.push({
			eventId: "mutated",
			type: "urgency_detected",
			producerId: "call",
			occurredAt: 1,
			severity: "low",
			confidence: 0.1,
			channel: "call",
			entityRefs: [],
			summary: "mutated",
			payload: { excerpt: "x" },
		})

		expect(resetSessionState().events).toEqual([])
	})
})
