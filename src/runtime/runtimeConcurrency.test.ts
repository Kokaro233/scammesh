import { afterEach, describe, expect, it, vi } from "vitest"
import { createScamEnvironment, loopsOverlap } from "./createScamEnvironment"
import { DUMMY_ALPHA_SIGNAL } from "./dummy/situations/own-answer"

describe("Mozaik dummy concurrency smoke", () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it("runs two official runLoop calls that overlap, share state, and adapt", async () => {
		const environment = createScamEnvironment()

		environment.start()
		await new Promise((resolve) => {
			setTimeout(resolve, 300)
		})

		const state = environment.resolveRuntime().state
		const alphaLoop = state.loops.alpha
		const betaLoop = state.loops.beta

		expect(alphaLoop.startedAt).toBeTypeOf("number")
		expect(betaLoop.startedAt).toBeTypeOf("number")
		expect(alphaLoop.endedAt).toBeTypeOf("number")
		expect(betaLoop.endedAt).toBeTypeOf("number")
		expect(loopsOverlap(alphaLoop, betaLoop)).toBe(true)
		expect(alphaLoop.startedAt).toBeLessThanOrEqual(betaLoop.endedAt ?? 0)
		expect(betaLoop.startedAt).toBeLessThan(alphaLoop.endedAt ?? 0)

		expect(state.publishedTypes).toContain("message.sent")
		expect(state.publishedTypes).toContain("inference.started")
		expect(state.publishedTypes).toContain("model.answer")
		expect(state.publishedTypes).toContain(DUMMY_ALPHA_SIGNAL)

		expect(state.adaptations).toHaveLength(1)
		expect(state.adaptations[0]).toMatchObject({
			sourceAgent: "alpha",
			targetAgent: "beta",
			triggerEvent: DUMMY_ALPHA_SIGNAL,
			betaStillRunning: true,
		})
		expect(state.sharedFlag).toBe("beta-heightened")
		expect(environment.resolveRuntime().state.getParticipants().length).toBe(4)
	})
})
