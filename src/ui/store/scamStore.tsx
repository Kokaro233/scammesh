import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react"
import {
	fetchSimulationState,
	pauseSimulation,
	resetSimulation,
	resumeSimulation,
	startSimulation,
} from "../api"
import { sessionHydrateLocked, withSessionLock } from "../bridge/sessionLock"
import { createInitialState } from "./initialState"
import { scamReducer } from "./reducer"
import type { DemoScenarioId, DemoSpeed, ScamAction, ScamState } from "./types"

type StoreValue = {
	state: ScamState
	dispatch: (action: ScamAction) => void
}

const ScamStoreContext = createContext<StoreValue | null>(null)

export function ScamProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(scamReducer, undefined, createInitialState)

	return <ScamStoreContext.Provider value={{ state, dispatch }}>{children}</ScamStoreContext.Provider>
}

export function useScamStore(): StoreValue {
	const value = useContext(ScamStoreContext)
	if (!value) {
		throw new Error("useScamStore must be used inside ScamProvider")
	}
	return value
}

function feedSpeed(speed: DemoSpeed) {
	return speed === "fast" ? 4 : 2
}

export function useLiveSession(): void {
	const { dispatch } = useScamStore()

	useEffect(() => {
		let closed = false

		const hydrate = async () => {
			if (closed || sessionHydrateLocked()) {
				return
			}
			try {
				const view = await fetchSimulationState()
				if (!closed && !sessionHydrateLocked()) {
					dispatch({ type: "HYDRATE", view })
				}
			} catch {
				// Keep the last good frame if the server is briefly unreachable.
			}
		}

		const source = new EventSource("/api/events")
		source.onmessage = () => {
			void hydrate()
		}
		const poll = window.setInterval(() => {
			void hydrate()
		}, 500)
		void hydrate()

		return () => {
			closed = true
			source.close()
			window.clearInterval(poll)
		}
	}, [dispatch])
}

export function useDemoSession() {
	const { state, dispatch } = useScamStore()

	return useMemo(
		() => ({
			async start(overrides: { scenarioId?: DemoScenarioId; speed?: DemoSpeed } = {}) {
				const scenarioId = overrides.scenarioId ?? state.scenarioId
				const speed = overrides.speed ?? state.demoSpeed
				if (overrides.scenarioId) {
					dispatch({ type: "SET_SCENARIO", scenarioId: overrides.scenarioId })
				}
				if (overrides.speed) {
					dispatch({ type: "SET_DEMO_SPEED", speed: overrides.speed })
				}
				dispatch({ type: "DEMO_START" })
				try {
					const view = await withSessionLock(() =>
						startSimulation(scenarioId, feedSpeed(speed), { identityDelay: state.simulateIdentityDelay }),
					)
					dispatch({ type: "HYDRATE", view })
				} catch {
					dispatch({ type: "DEMO_RESET" })
				}
			},
			async pause() {
				if (state.demoStatus !== "running") {
					return
				}
				dispatch({ type: "DEMO_PAUSE" })
				try {
					const view = await withSessionLock(() => pauseSimulation())
					dispatch({ type: "HYDRATE", view })
				} catch {
					dispatch({ type: "DEMO_RESUME" })
				}
			},
			async resume() {
				if (state.demoStatus !== "paused") {
					return
				}
				dispatch({ type: "DEMO_RESUME" })
				try {
					const view = await withSessionLock(() => resumeSimulation())
					dispatch({ type: "HYDRATE", view })
				} catch {
					dispatch({ type: "DEMO_PAUSE" })
				}
			},
			async reset() {
				dispatch({ type: "DEMO_RESET" })
				try {
					const view = await withSessionLock(() => resetSimulation())
					dispatch({ type: "HYDRATE", view })
				} catch {
					// Local reset still stands.
				}
			},
			async changeScenario(scenarioId: DemoScenarioId) {
				dispatch({ type: "SET_SCENARIO", scenarioId })
				try {
					const view = await withSessionLock(() => resetSimulation())
					dispatch({ type: "HYDRATE", view })
				} catch {
					// Local scenario change still stands.
				}
			},
		}),
		[dispatch, state.demoSpeed, state.demoStatus, state.scenarioId, state.simulateIdentityDelay],
	)
}

export function usePauseTransfer() {
	const { state, dispatch } = useScamStore()
	const timer = useRef<number | null>(null)

	useEffect(() => {
		return () => {
			if (timer.current != null) {
				window.clearTimeout(timer.current)
			}
		}
	}, [])

	return useMemo(
		() => ({
			pause() {
				if (state.transfer.status === "paused" || state.transfer.status === "pausing") {
					return
				}
				dispatch({ type: "PAUSE_TRANSFER_START" })
				timer.current = window.setTimeout(() => {
					dispatch({ type: "PAUSE_TRANSFER_FINISH" })
				}, 360)
			},
			requestContinue() {
				if (state.transfer.status === "continued" || state.transfer.status === "paused") {
					return
				}
				dispatch({ type: "SET_INTERVENTION", phase: "confirm-continue" })
			},
			confirmContinue() {
				dispatch({ type: "CONTINUE_ANYWAY" })
			},
			dismiss() {
				dispatch({ type: "SET_INTERVENTION", phase: "closed" })
			},
			reopen() {
				if (state.transfer.status === "paused") {
					dispatch({ type: "SET_INTERVENTION", phase: "paused" })
					return
				}
				if (state.transfer.status === "continued") {
					dispatch({ type: "SET_INTERVENTION", phase: "continued" })
				}
			},
		}),
		[dispatch, state.transfer.status],
	)
}
