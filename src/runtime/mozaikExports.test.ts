import { createAgent, createHuman, defineRuntime, RuntimeState, SemanticEvent } from "@mozaik-ai/core"
import { describe, expect, it } from "vitest"

describe("official @mozaik-ai/core v4 exports", () => {
	it("exposes the current docs API", () => {
		expect(typeof defineRuntime).toBe("function")
		expect(typeof createAgent).toBe("function")
		expect(typeof createHuman).toBe("function")
		expect(typeof RuntimeState).toBe("function")
		expect(typeof SemanticEvent.create).toBe("function")
	})
})
