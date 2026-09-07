import { describe, expect, it } from "vitest"
import { createInitialSessionState } from "../../runtime/sessionState"
import type { SimulationStateView } from "../../shared/simulationView"
import type { AgentAdaptation, CorrelationEdge, ScamEvent } from "../../shared/types"
import { createInitialState } from "../store/initialState"
import { connectionsFromSession, engineRiskLabel, mapSimulationToUi, signalsFromSession, toCssRisk, toUiChannel, transferFromSession } from "./mapSimulationToUi"

function event(partial: Partial<ScamEvent> & Pick<ScamEvent, "eventId" | "type" | "channel" | "producerId" | "summary">): ScamEvent {
	return {
		occurredAt: 2_000,
		severity: "high",
		confidence: 0.9,
		entityRefs: [],
		payload: { excerpt: partial.summary } as ScamEvent["payload"],
		...partial,
	}
}

function view(overrides: Partial<SimulationStateView> = {}): SimulationStateView {
	const { session: sessionOverride, ...rest } = overrides
	return {
		status: "running",
		scenarioId: "bank-impersonation",
		session: {
			...createInitialSessionState(1_000),
			...sessionOverride,
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
		callTranscript: [{ speaker: "caller", text: "This is Apex Bank Anti-Fraud Centre.", claimedIdentity: "Apex Bank Anti-Fraud Centre" }],
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
		...rest,
	}
}

describe("mapSimulationToUi", () => {
	it("maps transaction to payment and engine bands to CSS + display labels", () => {
		expect(toUiChannel("transaction")).toBe("payment")
		expect(toCssRisk("LOW")).toBe("normal")
		expect(toCssRisk("WATCH")).toBe("watch")
		expect(toCssRisk("HIGH")).toBe("review")
		expect(toCssRisk("CRITICAL")).toBe("high")
		expect(engineRiskLabel("CRITICAL")).toBe("CRITICAL")
	})

	it("skips coordination noise and keeps channel detections", () => {
		const mapped = signalsFromSession(
			view({
				session: {
					...createInitialSessionState(1_000),
					events: [
						event({
							eventId: "e-call",
							type: "coercion_detected",
							channel: "call",
							producerId: "call",
							summary: "Caller used freeze-or-stay language",
						}),
						event({
							eventId: "e-noise",
							type: "cross_channel_pattern_detected",
							channel: "call",
							producerId: "call",
							summary: "pattern",
							payload: { correlationKey: "k", channels: ["call", "message"] },
						}),
					],
				},
			}),
		)
		expect(mapped.map((item) => item.id)).toEqual(["e-call"])
		expect(mapped[0]?.title).toBe("coercion detected")
	})

	it("uses backend transfer facts and CRITICAL stamp", () => {
		const previous = createInitialState()
		const snapshotView = view({
			session: {
				...createInitialSessionState(1_000),
				overallRisk: 88,
				riskLevel: "CRITICAL",
				events: [
					event({
						eventId: "e-pay",
						type: "new_beneficiary_detected",
						channel: "transaction",
						producerId: "transaction",
						summary: "New DuitNow beneficiary Apex Safe Holding",
						payload: {
							beneficiaryName: "Apex Safe Holding",
							beneficiaryAccount: "9901882233",
							amount: 8000,
							currency: "MYR",
						},
					}),
				],
				riskSnapshots: [
					{
						snapshotId: "s1",
						occurredAt: 3_000,
						score: 88,
						level: "CRITICAL",
						reasons: ["+18 new beneficiary detected"],
						channelsInvolved: ["transaction"],
					},
				],
			},
		})
		const transfer = transferFromSession(snapshotView, previous.transfer)
		expect(transfer.visible).toBe(true)
		expect(transfer.recipient).toBe("Apex Safe Holding")
		expect(transfer.bank).toBe("DuitNow")
		expect(transfer.amount).toBe("8,000")
		const mapped = mapSimulationToUi(snapshotView, previous)
		expect(mapped.riskLevel).toBe("high")
		expect(mapped.headline).toBe("HIGH RISK")
		expect(mapped.summary).toBe("Likely impersonation scam.")
		expect(mapped.stampVisible).toBe(true)
		expect(mapped.riskScore).toBe(94)
	})

	it("keeps raw engine score outside the sealed Apex CRITICAL desk", () => {
		const previous = createInitialState()
		const mapped = mapSimulationToUi(
			view({
				scenarioId: "ambiguous",
				session: {
					...createInitialSessionState(1_000),
					overallRisk: 61,
					riskLevel: "HIGH",
				},
			}),
			previous,
		)
		expect(mapped.riskScore).toBe(61)
		expect(mapped.headline).toBe("HIGH")
	})

	it("maps correlations to payment and adaptations to the coordination log", () => {
		const edge: CorrelationEdge = {
			edgeId: "edge-1",
			fromEventId: "a",
			toEventId: "b",
			label: "remote session stayed open during the draft",
			fromChannel: "device",
			toChannel: "transaction",
		}
		const adaptation: AgentAdaptation = {
			adaptationId: "ad-1",
			sourceAgent: "identity",
			targetAgent: "transaction",
			triggerEvent: "official_identity_mismatch",
			triggerEventId: "e-id",
			beforeMode: "HEIGHTENED",
			afterMode: "PRIORITY",
			reason: "Unknown payee raised payment inspection",
			occurredAt: 4_000,
		}
		const mapped = mapSimulationToUi(
			view({
				session: {
					...createInitialSessionState(1_000),
					correlations: [edge],
					adaptations: [adaptation],
				},
			}),
			createInitialState(),
		)
		expect(connectionsFromSession(view({ session: { ...createInitialSessionState(1_000), correlations: [edge] } }))).toEqual([
			{
				id: "edge-1",
				source: "device",
				target: "payment",
				reason: "remote session stayed open during the draft",
				status: "confirmed",
				createdAt: "00:00",
			},
		])
		expect(mapped.coordinationEvents?.[0]).toMatchObject({
			source: "identity",
			target: "payment",
			description: "Unknown payee raised payment inspection",
		})
	})
})
