import type { AgentAdaptation, AgentId, Channel, RiskSnapshot, ScamEvent, ScenarioId } from "./types"

export const UI_EVENT_KINDS = [
	"started",
	"observation",
	"semantic_event",
	"adaptation",
	"risk_escalation",
	"reset",
	"finished",
] as const

export type UiEventKind = (typeof UI_EVENT_KINDS)[number]

export type UiEvent =
	| { kind: "started"; scenarioId: ScenarioId; at: number }
	| { kind: "observation"; agentId: AgentId; channel: Channel; summary: string; at: number }
	| { kind: "semantic_event"; event: ScamEvent }
	| { kind: "adaptation"; adaptation: AgentAdaptation }
	| { kind: "risk_escalation"; snapshot: RiskSnapshot }
	| { kind: "reset"; at: number }
	| { kind: "finished"; at: number }
