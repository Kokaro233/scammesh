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
		let booted = false

		const hydrate = async () => {
			if (closed || sessionHydrateLocked()) {
				return
			}
			try {
				const view = await fetchSimulationState()
				if (closed || sessionHydrateLocked()) {
					return
				}
				// A finished session from a previous visit hides Start demo and looks stuck.
				// Clear it once on first load so refresh can restart cleanly.
				if (!booted && view.status === "finished") {
					booted = true
					const cleared = await withSessionLock(() => resetSimulation())
					if (!closed && !sessionHydrateLocked()) {
						dispatch({ type: "HYDRATE", view: cleared })
					}
					return
				}
				booted = true
				dispatch({ type: "HYDRATE", view })
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
				// Lock before DEMO_START so the 500ms poll cannot hydrate an idle
				// server frame and wipe local "running" (looks like a fake Run).
				try {
					const view = await withSessionLock(async () => {
						dispatch({ type: "DEMO_START" })
						return startSimulation(scenarioId, feedSpeed(speed), {
							identityDelay: state.simulateIdentityDelay,
						})
					})
					dispatch({ type: "HYDRATE", view })
				} catch (error) {
					console.error("simulation start failed", error)
					dispatch({ type: "DEMO_RESET" })
				}
			},
			async pause() {
				if (state.demoStatus !== "running") {
					return
				}
				try {
					const view = await withSessionLock(async () => {
						dispatch({ type: "DEMO_PAUSE" })
						return pauseSimulation()
					})
					dispatch({ type: "HYDRATE", view })
				} catch (error) {
					console.error("simulation pause failed", error)
					dispatch({ type: "DEMO_RESUME" })
				}
			},
			async resume() {
				if (state.demoStatus !== "paused") {
					return
				}
				try {
					const view = await withSessionLock(async () => {
						dispatch({ type: "DEMO_RESUME" })
						return resumeSimulation()
					})
					dispatch({ type: "HYDRATE", view })
				} catch (error) {
					console.error("simulation resume failed", error)
					dispatch({ type: "DEMO_PAUSE" })
				}
			},
			async reset() {
				try {
					const view = await withSessionLock(async () => {
						dispatch({ type: "DEMO_RESET" })
						return resetSimulation()
					})
					dispatch({ type: "HYDRATE", view })
				} catch (error) {
					console.error("simulation reset failed", error)
					dispatch({ type: "DEMO_RESET" })
				}
			},
			async changeScenario(scenarioId: DemoScenarioId) {
				try {
					const view = await withSessionLock(async () => {
						dispatch({ type: "SET_SCENARIO", scenarioId })
						return resetSimulation()
					})
					dispatch({ type: "HYDRATE", view })
				} catch (error) {
					console.error("scenario change failed", error)
					dispatch({ type: "SET_SCENARIO", scenarioId })
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
