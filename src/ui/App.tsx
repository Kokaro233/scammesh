import { useEffect, useState } from "react"
import type { SimulationStateView } from "../shared/simulationView"
import type { ScenarioId } from "../shared/types"
import type { UiEvent } from "../shared/uiEvents"
import { fetchScenarios, fetchSimulationState, resetSimulation, startSimulation, type ScenarioOption } from "./api"
import { DefenseRoom } from "./DefenseRoom"
import { HomeScreen } from "./HomeScreen"

export function App() {
	const [view, setView] = useState<"home" | "room">("home")
	const [scenarios, setScenarios] = useState<ScenarioOption[]>([])
	const [selected, setSelected] = useState<ScenarioId>("bank-impersonation")
	const [state, setState] = useState<SimulationStateView | null>(null)
	const [events, setEvents] = useState<UiEvent[]>([])
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		void fetchScenarios()
			.then((items) => {
				setScenarios(items)
			})
			.catch((reason: unknown) => {
				setError(reason instanceof Error ? reason.message : "Scenario list unavailable")
			})
	}, [])

	useEffect(() => {
		if (view !== "room") {
			return
		}

		const source = new EventSource("/api/events")
		source.onmessage = (message) => {
			const event = JSON.parse(message.data) as UiEvent
			setEvents((current) => [...current, event].slice(-80))
			void fetchSimulationState().then(setState)
		}
		const poll = window.setInterval(() => {
			void fetchSimulationState().then(setState)
		}, 400)

		return () => {
			source.close()
			window.clearInterval(poll)
		}
	}, [view])

	async function onStart() {
		setError(null)
		try {
			const next = await startSimulation(selected, 2)
			setState(next)
			setEvents([])
			setView("room")
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Start failed")
		}
	}

	async function onReset() {
		await resetSimulation()
		setEvents([])
		setState(null)
		setView("home")
	}

	if (view === "room" && state) {
		return <DefenseRoom state={state} events={events} onReset={() => void onReset()} />
	}

	return (
		<HomeScreen
			scenarios={scenarios}
			selected={selected}
			error={error}
			onSelect={setSelected}
			onStart={() => void onStart()}
		/>
	)
}
