import type { CoordinationEvent, DemoScenarioId, Signal, SignalConnection, TranscriptLine, TransferRecord, UiChannel } from "../store/types"
import { buildAmbiguousChoreography } from "./ambiguousChoreography"
import { buildApexChoreography } from "./apexChoreography"
import { buildBenignChoreography } from "./benignChoreography"

export type DemoOp =
	| {
			kind: "channel"
			channel: UiChannel
			activity: string
			title?: string
			description?: string
			status?: Signal["status"]
			risk?: Signal["risk"]
			timestamp?: string
			delayed?: boolean
	  }
	| { kind: "signal"; signal: Signal }
	| { kind: "connection"; connection: SignalConnection }
	| { kind: "risk"; score: number; level: "normal" | "watch" | "review" | "high"; headline: string; summary: string }
	| { kind: "reason"; text: string }
	| { kind: "coord"; event: CoordinationEvent }
	| { kind: "stamp"; visible: boolean }
	| { kind: "transcript"; line: TranscriptLine }
	| { kind: "transfer"; transfer: Partial<TransferRecord> }

export type DemoEvent = {
	id: string
	at: number
	ops: DemoOp[]
}

export function buildChoreography(scenarioId: DemoScenarioId = "bank-impersonation", identityDelay = false): DemoEvent[] {
	if (scenarioId === "benign-bank") {
		return buildBenignChoreography()
	}
	if (scenarioId === "ambiguous") {
		return buildAmbiguousChoreography()
	}
	return buildApexChoreography(identityDelay)
}

export const DEMO_DURATION_MS = 36_000
