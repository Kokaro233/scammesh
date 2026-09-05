import { afterEach, describe, expect, it } from "vitest"
import { healthPayload } from "./health"

describe("healthPayload", () => {
	const previous = process.env.MOCK_INFERENCE_MODE

	afterEach(() => {
		if (previous === undefined) {
			delete process.env.MOCK_INFERENCE_MODE
		} else {
			process.env.MOCK_INFERENCE_MODE = previous
		}
	})

	it("reports mock inference from the environment", () => {
		process.env.MOCK_INFERENCE_MODE = "true"
		expect(healthPayload()).toEqual({
			ok: true,
			service: "scammesh",
			phase: 1,
			mockInferenceMode: true,
		})
	})
})
