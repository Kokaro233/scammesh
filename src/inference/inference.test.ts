import { describe, expect, it } from "vitest"
import { loadScenario } from "../scenarios/loadScenario"
import { createInferenceProvider, createInferenceProviderFromEnv } from "./createInference"
import { readInferenceEnv, shouldUseMockProvider } from "./env"
import { LlmInferenceProvider } from "./llmProvider"
import { MockInferenceProvider } from "./mockProvider"
import { ANALYSIS_SCHEMA } from "./schema"

function messageFromMain() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.sourceChannel === "message")
	if (!feed || feed.sourceChannel !== "message") {
		throw new Error("expected main scenario SMS")
	}
	return feed.payload
}

function callCoercionFromMain() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "call-coercion")
	if (!feed || feed.sourceChannel !== "call") {
		throw new Error("expected coercion utterance")
	}
	return feed.payload
}

describe("inference adapter", () => {
	const mock = new MockInferenceProvider()
	const registry = loadScenario("bank-impersonation").trustedRegistry

	it("returns the same structured result for the same mock input", async () => {
		const input = { channel: "call" as const, payload: callCoercionFromMain() }
		const context = { agentId: "call" as const, channel: "call" as const, mode: "NORMAL" as const, registry }
		const first = await mock.analyze(input, ANALYSIS_SCHEMA, context)
		const second = await mock.analyze(input, ANALYSIS_SCHEMA, context)

		expect(first).toEqual(second)
		expect(first.detections.some((detection) => detection.type === "coercion_detected")).toBe(true)
		expect(first.usedFallback).toBe(false)
	})

	it("tightens the same SMS only after HEIGHTENED adaptation", async () => {
		const input = { channel: "message" as const, payload: messageFromMain() }
		const base = { agentId: "message" as const, channel: "message" as const, registry }
		const normal = await mock.analyze(input, ANALYSIS_SCHEMA, { ...base, mode: "NORMAL" })
		const heightened = await mock.analyze(input, ANALYSIS_SCHEMA, { ...base, mode: "HEIGHTENED" })

		expect(normal.detections.some((detection) => detection.type === "suspicious_link_detected")).toBe(false)
		expect(heightened.detections.some((detection) => detection.type === "suspicious_link_detected")).toBe(true)
	})

	it("does not flag the official benign SMS", async () => {
		const feed = loadScenario("benign-bank").feeds.find((item) => item.sourceChannel === "message")
		if (!feed || feed.sourceChannel !== "message") {
			throw new Error("expected benign SMS")
		}

		const result = await mock.analyze({ channel: "message", payload: feed.payload }, ANALYSIS_SCHEMA, {
			agentId: "message",
			channel: "message",
			mode: "PRIORITY",
			registry: loadScenario("benign-bank").trustedRegistry,
		})

		expect(result.detections).toEqual([])
	})

	it("uses mock when provider fields are empty and does not crash", async () => {
		const provider = createInferenceProvider({
			LLM_PROVIDER: "",
			LLM_API_KEY: "",
			LLM_MODEL: "",
			LLM_BASE_URL: "",
			MOCK_INFERENCE_MODE: "true",
		})

		const result = await provider.analyze({ channel: "call", payload: callCoercionFromMain() }, ANALYSIS_SCHEMA, {
			agentId: "call",
			channel: "call",
			mode: "NORMAL",
			registry,
		})

		expect(result.provider).toBe("mock")
		expect(result.detections.length).toBeGreaterThan(0)
	})

	it("falls back to mock when the LLM shell has no key", async () => {
		const env = readInferenceEnv({
			LLM_PROVIDER: "openai-compatible",
			LLM_API_KEY: "",
			LLM_MODEL: "gpt-5.5",
			MOCK_INFERENCE_MODE: "false",
		})
		expect(shouldUseMockProvider(env)).toBe(true)

		const llm = new LlmInferenceProvider(env, mock)
		const result = await llm.analyze({ channel: "call", payload: callCoercionFromMain() }, ANALYSIS_SCHEMA, {
			agentId: "call",
			channel: "call",
			mode: "NORMAL",
			registry,
		})

		expect(result.usedFallback).toBe(true)
		expect(result.provider).toBe("mock")
		expect(llm.missingConfigurationMessage()).toContain("LLM_API_KEY")
	})

	it("keeps createInferenceProvider on mock when MOCK_INFERENCE_MODE is true", () => {
		const provider = createInferenceProviderFromEnv(
			readInferenceEnv({
				LLM_PROVIDER: "openai-compatible",
				LLM_API_KEY: "placeholder-not-a-real-key",
				LLM_MODEL: "gpt-5.5",
				LLM_BASE_URL: "https://example.invalid/v1",
				MOCK_INFERENCE_MODE: "true",
			}),
		)

		expect(provider).toBeInstanceOf(MockInferenceProvider)
	})
})
