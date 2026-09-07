import { DEMO_SCENARIOS } from "../../demo/scenarios"
import { useDemoSession, useScamStore } from "../../store/scamStore"
import type { DemoScenarioId } from "../../store/types"

export function DemoControls() {
	const { state, dispatch } = useScamStore()
	const session = useDemoSession()
	const running = state.demoStatus === "running"
	const paused = state.demoStatus === "paused"

	return (
		<div className="demo-controls playback-bar">
			<label className="scenario-select">
				<span>Scenario</span>
				<select
					value={state.scenarioId}
					disabled={running}
					onChange={(event) => {
						void session.changeScenario(event.target.value as DemoScenarioId)
					}}
				>
					{DEMO_SCENARIOS.map((item) => (
						<option key={item.id} value={item.id}>
							{item.title}
						</option>
					))}
				</select>
			</label>
			<button
				type="button"
				onClick={() => {
					if (running) return
					if (paused) {
						void session.resume()
						return
					}
					void session.start()
				}}
				disabled={running}
			>
				Run
			</button>
			<button type="button" onClick={() => void session.pause()} disabled={!running}>
				Pause
			</button>
			<button type="button" onClick={() => void session.start()}>
				Replay
			</button>
			<button type="button" onClick={() => void session.reset()}>
				Reset
			</button>
			<div className="speed-toggle" role="group" aria-label="Demo speed">
				<button
					className={state.demoSpeed === "normal" ? "is-on" : ""}
					type="button"
					onClick={() => dispatch({ type: "SET_DEMO_SPEED", speed: "normal" })}
				>
					Normal
				</button>
				<button
					className={state.demoSpeed === "fast" ? "is-on" : ""}
					type="button"
					onClick={() => dispatch({ type: "SET_DEMO_SPEED", speed: "fast" })}
				>
					Fast
				</button>
			</div>
		</div>
	)
}
