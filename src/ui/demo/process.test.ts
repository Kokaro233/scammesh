import { describe, expect, it } from "vitest"
import { createInitialState } from "../store/initialState"
import { scamReducer } from "../store/reducer"
import type { ScamState } from "../store/types"
import { demoBeats, demoCaption } from "./process"

function withLiveTransfer(state: ScamState): ScamState {
	return {
		...state,
		demoStatus: "running",
		riskLevel: "high",
		headline: "HIGH RISK",
		summary: "Likely impersonation scam.",
		callTranscript: [{ id: "tr-1", time: "00:01", text: "This is Apex Bank Anti-Fraud Centre." }],
		channelStates: {
			...state.channelStates,
			message: { ...state.channelStates.message, status: "related" },
			browser: { ...state.channelStates.browser, status: "related" },
			device: { ...state.channelStates.device, status: "related" },
		},
		signals: [
			{
				id: "sig-identity",
				channel: "identity",
				title: "official identity mismatch",
				description: "Beneficiary is not a known Apex payee",
				risk: "high",
				timestamp: "00:28",
				status: "related",
			},
		],
		transfer: {
			...state.transfer,
			visible: true,
			amount: "8,000",
			amountValue: 8000,
			recipient: "Apex Safe Holding",
			bank: "DuitNow",
			status: "pending",
		},
	}
}

describe("demo process chain", () => {
	it("starts with every beat waiting", () => {
		const beats = demoBeats(createInitialState())
		expect(beats.every((item) => !item.done)).toBe(true)
		expect(demoCaption(createInitialState())).toContain("Start the demo")
	})

	it("advances call then transfer then pause from live session fields", () => {
		const live = withLiveTransfer(createInitialState())
		expect(demoBeats(live).find((item) => item.id === "call")?.done).toBe(true)
		expect(demoBeats(live).find((item) => item.id === "transfer")?.done).toBe(true)
		expect(demoCaption(live)).toContain("Pause this transfer")
		let paused = scamReducer(live, { type: "PAUSE_TRANSFER_START" })
		paused = scamReducer(paused, { type: "PAUSE_TRANSFER_FINISH" })
		expect(demoBeats(paused).every((item) => item.done)).toBe(true)
		expect(demoCaption(paused)).toContain("Overview and History")
	})

	it("uses a real adaptation in the caption", () => {
		const state: ScamState = {
			...createInitialState(),
			demoStatus: "running",
			signals: [
				{
					id: "sig-call",
					channel: "call",
					title: "coercion detected",
					description: "Caller used freeze-or-stay language",
					risk: "review",
					timestamp: "00:08",
					status: "related",
				},
				{
					id: "sig-message",
					channel: "message",
					title: "suspicious link detected",
					description: "SMS pointed at a clone domain",
					risk: "high",
					timestamp: "00:12",
					status: "related",
				},
			],
			coordinationEvents: [
				{
					id: "ad-1",
					source: "call",
					target: "message",
					type: "coercion_detected",
					description: "Call coercion raised message inspection",
					timestamp: "00:08",
				},
			],
			channelStates: {
				...createInitialState().channelStates,
				message: {
					...createInitialState().channelStates.message,
					activity: "Inspection level increased",
					status: "related",
				},
			},
		}
		expect(demoCaption(state)).toContain("message inspection")
	})
})
