export const UI_CHANNELS = ["call", "message", "browser", "device", "identity", "payment"] as const
export type UiChannel = (typeof UI_CHANNELS)[number]

export const DEMO_SCENARIO_IDS = ["bank-impersonation", "benign-bank", "ambiguous"] as const
export type DemoScenarioId = (typeof DEMO_SCENARIO_IDS)[number]

export type RiskLevel = "normal" | "watch" | "review" | "high"
export type SignalRisk = "low" | "review" | "high"
export type SignalStatus = "monitoring" | "checking" | "unverified" | "related" | "confirmed" | "delayed"
export type DemoStatus = "idle" | "running" | "paused" | "complete"
export type DemoSpeed = "normal" | "fast"
export type TransferStatus = "pending" | "pausing" | "paused" | "continued"
export type InterventionPhase = "closed" | "confirm-continue" | "paused" | "continued"
export type HistoryRisk = "high" | "review" | "safe"
export type HistorySource = "seed" | "live"

export type ChannelState = {
	channel: UiChannel
	label: string
	title: string
	description: string
	status: SignalStatus
	activity: string
	risk: SignalRisk
	timestamp: string
	delayed: boolean
}

export type Signal = {
	id: string
	channel: UiChannel
	title: string
	description: string
	risk: SignalRisk
	timestamp: string
	status: SignalStatus
}

export type SignalConnection = {
	id: string
	source: UiChannel
	target: UiChannel
	reason: string
	status: "possible" | "confirmed"
	createdAt: string
}

export type CoordinationEvent = {
	id: string
	source: UiChannel
	target?: UiChannel
	type: string
	description: string
	timestamp: string
}

export type TranscriptLine = {
	id: string
	time: string
	text: string
}

export type TransferRecord = {
	amount: string
	amountValue: number
	currency: "RM"
	recipient: string
	bank: string
	beneficiary: "New" | "Existing"
	time: string
	status: TransferStatus
	visible: boolean
}

export type HistoryItem = {
	id: string
	date: string
	time: string
	type: string
	description: string
	amount: string
	risk: HistoryRisk
	result: string
	source: HistorySource
	channel?: UiChannel
}

export type OverviewStats = {
	riskSignals: number
	needReview: number
	transfersProtected: number
	identityChecks: number
}

export type DayActivity = {
	label: string
	safe: number
	review: number
	high: number
}

export type ScamState = {
	scenarioId: DemoScenarioId
	riskScore: number
	riskLevel: RiskLevel
	headline: string
	summary: string
	reasons: string[]
	stampVisible: boolean
	channelStates: Record<UiChannel, ChannelState>
	signals: Signal[]
	connections: SignalConnection[]
	coordinationEvents: CoordinationEvent[]
	callTranscript: TranscriptLine[]
	transfer: TransferRecord
	history: HistoryItem[]
	overviewStats: OverviewStats
	weekActivity: DayActivity[]
	demoStatus: DemoStatus
	demoSpeed: DemoSpeed
	demoElapsedMs: number
	appliedEventIds: string[]
	simulateIdentityDelay: boolean
	coordinationOpen: boolean
	intervention: InterventionPhase
}

export type ScamAction =
	| { type: "SET_PAGE_UI"; coordinationOpen: boolean }
	| { type: "SET_INTERVENTION"; phase: InterventionPhase }
	| { type: "SET_DEMO_SPEED"; speed: DemoSpeed }
	| { type: "SET_IDENTITY_DELAY"; enabled: boolean }
	| { type: "SET_SCENARIO"; scenarioId: DemoScenarioId }
	| { type: "DEMO_START" }
	| { type: "DEMO_PAUSE" }
	| { type: "DEMO_RESUME" }
	| { type: "DEMO_RESET" }
	| { type: "HYDRATE"; view: import("../../shared/simulationView").SimulationStateView }
	| { type: "PAUSE_TRANSFER_START" }
	| { type: "PAUSE_TRANSFER_FINISH" }
	| { type: "CONTINUE_ANYWAY" }
