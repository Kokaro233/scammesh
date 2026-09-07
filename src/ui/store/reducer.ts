import { mapSimulationToUi } from "../bridge/mapSimulationToUi"
import { createInitialState } from "./initialState"
import type { ScamAction, ScamState, Signal } from "./types"

function keepPreferences(state: ScamState, reset: ScamState): ScamState {
	return {
		...reset,
		scenarioId: state.scenarioId,
		demoSpeed: state.demoSpeed,
		simulateIdentityDelay: state.simulateIdentityDelay,
	}
}

function ledgerStamp(now = new Date()) {
	return {
		date: now.toLocaleString("en-US", { month: "short", day: "numeric" }),
		time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
	}
}

function keepDecisionCopy(state: ScamState) {
	return state.intervention === "paused" || state.intervention === "continued" || state.transfer.status === "paused" || state.transfer.status === "continued"
}

export function scamReducer(state: ScamState, action: ScamAction): ScamState {
	switch (action.type) {
		case "SET_PAGE_UI":
			return { ...state, coordinationOpen: action.coordinationOpen }
		case "SET_INTERVENTION":
			return { ...state, intervention: action.phase }
		case "SET_DEMO_SPEED":
			return { ...state, demoSpeed: action.speed }
		case "SET_IDENTITY_DELAY":
			return { ...state, simulateIdentityDelay: action.enabled }
		case "SET_SCENARIO": {
			return {
				...keepPreferences(state, createInitialState()),
				scenarioId: action.scenarioId,
			}
		}
		case "DEMO_START":
			return {
				...keepPreferences(state, createInitialState()),
				demoStatus: "running",
			}
		case "DEMO_PAUSE":
			if (state.demoStatus !== "running") {
				return state
			}
			return { ...state, demoStatus: "paused" }
		case "DEMO_RESUME":
			if (state.demoStatus !== "paused") {
				return state
			}
			return { ...state, demoStatus: "running" }
		case "DEMO_RESET":
			return keepPreferences(state, createInitialState())
		case "HYDRATE": {
			const mapped = mapSimulationToUi(action.view, state)
			const keepDecision = keepDecisionCopy(state)
			return {
				...state,
				...mapped,
				demoSpeed: state.demoSpeed,
				simulateIdentityDelay: state.simulateIdentityDelay,
				coordinationOpen: state.coordinationOpen,
				intervention: state.intervention,
				history: state.history,
				transfer: {
					...state.transfer,
					...mapped.transfer,
					status: state.transfer.status,
					visible: mapped.transfer?.visible ?? state.transfer.visible,
				},
				overviewStats: {
					riskSignals: mapped.overviewStats?.riskSignals ?? state.overviewStats.riskSignals,
					needReview: mapped.overviewStats?.needReview ?? state.overviewStats.needReview,
					identityChecks: mapped.overviewStats?.identityChecks ?? state.overviewStats.identityChecks,
					transfersProtected: state.overviewStats.transfersProtected,
				},
				headline: keepDecision ? state.headline : (mapped.headline ?? state.headline),
				summary: keepDecision ? state.summary : (mapped.summary ?? state.summary),
			}
		}
		case "PAUSE_TRANSFER_START":
			if (state.transfer.status === "paused" || state.transfer.status === "pausing") {
				return state
			}
			return {
				...state,
				transfer: { ...state.transfer, status: "pausing" },
			}
		case "PAUSE_TRANSFER_FINISH": {
			if (state.transfer.status !== "pausing") {
				return state
			}
			const stamp = ledgerStamp()
			const row = {
				id: "hist-live-pause",
				date: stamp.date,
				time: stamp.time,
				type: "Transfer",
				description: state.transfer.recipient || "Transfer",
				amount: `${state.transfer.currency} ${state.transfer.amount}`,
				risk: "high" as const,
				result: "Paused",
				source: "live" as const,
				channel: "payment" as const,
			}
			return {
				...state,
				transfer: { ...state.transfer, status: "paused" },
				headline: "Transfer paused",
				summary: "This transfer was paused before it could be sent.",
				intervention: "paused",
				history: [row, ...state.history.filter((item) => item.id !== row.id)],
				overviewStats: {
					...state.overviewStats,
					transfersProtected: state.overviewStats.transfersProtected + (state.history.some((item) => item.id === row.id) ? 0 : 1),
				},
			}
		}
		case "CONTINUE_ANYWAY": {
			if (state.transfer.status === "continued" || state.transfer.status === "paused") {
				return state
			}
			const stamp = ledgerStamp()
			const row = {
				id: "hist-live-continue",
				date: stamp.date,
				time: stamp.time,
				type: "Transfer",
				description: state.transfer.recipient || "Transfer",
				amount: `${state.transfer.currency} ${state.transfer.amount}`,
				risk: "high" as const,
				result: "Continued",
				source: "live" as const,
				channel: "payment" as const,
			}
			return {
				...state,
				transfer: { ...state.transfer, status: "continued" },
				headline: "Continued by you",
				summary: "Allowed to proceed in this demo. The high-risk pattern is still recorded.",
				intervention: "continued",
				history: [row, ...state.history.filter((item) => item.id !== row.id)],
			}
		}
		default:
			return state
	}
}

export function recentActivity(state: ScamState): Array<{ time: string; type: string; detail: string; risk: Signal["risk"] | "safe" }> {
	if (state.signals.length === 0) {
		return state.history.slice(0, 4).map((item) => ({
			time: item.time,
			type: item.type,
			detail: item.amount || item.description,
			risk: item.risk === "safe" ? "safe" : item.risk,
		}))
	}
	return [...state.signals]
		.slice()
		.reverse()
		.slice(0, 4)
		.map((item) => ({
			time: item.timestamp.slice(0, 5),
			type: item.channel[0].toUpperCase() + item.channel.slice(1),
			detail: item.title,
			risk: item.risk,
		}))
}
