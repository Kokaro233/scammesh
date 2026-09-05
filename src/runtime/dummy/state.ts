import { RuntimeState } from "@mozaik-ai/core"

export type DummyParticipantName = "alpha" | "beta"

export interface DummyLoopTrace {
	startedAt?: number
	endedAt?: number
}

export interface DummyAdaptation {
	sourceAgent: "alpha"
	targetAgent: "beta"
	triggerEvent: "dummy.alpha.signal"
	reason: string
	occurredAt: number
	betaStillRunning: boolean
}

export class DummyRuntimeState extends RuntimeState {
	readonly loops: Record<DummyParticipantName, DummyLoopTrace> = {
		alpha: {},
		beta: {},
	}
	readonly adaptations: DummyAdaptation[] = []
	readonly publishedTypes: string[] = []
	sharedFlag = "idle"
}
