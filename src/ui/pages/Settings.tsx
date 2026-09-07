import { useEffect, useState } from "react"
import { fetchSystemStatus, type HealthStatus } from "../api"
import { scenarioTitle } from "../demo/scenarios"
import { useScamStore } from "../store/scamStore"

export function SettingsPage() {
	const { state, dispatch } = useScamStore()
	const [health, setHealth] = useState<HealthStatus | null>(null)
	const [healthError, setHealthError] = useState(false)

	useEffect(() => {
		let cancelled = false
		void fetchSystemStatus()
			.then((payload) => {
				if (!cancelled) {
					setHealth(payload)
					setHealthError(false)
				}
			})
			.catch(() => {
				if (!cancelled) {
					setHealthError(true)
				}
			})
		return () => {
			cancelled = true
		}
	}, [state.demoStatus])

	const inferenceMode = health?.inferenceMode === "live" ? "Live provider" : health ? "Deterministic mock" : healthError ? "Unavailable" : "…"
	const runtime = health?.mozaikRuntime === "active" ? "Active" : healthError ? "Unavailable" : "…"
	const agentCount = health?.agentCount ?? 6

	return (
		<div className="page-settings">
			<section className="settings-sheet">
				<p className="ops-heading">Demo behavior</p>
				<label className="settings-row">
					<span>
						Playback speed
						<em>{state.demoSpeed === "fast" ? "Fast · compressed feed timing" : "Normal · standard feed timing"}</em>
					</span>
					<select
						value={state.demoSpeed}
						onChange={(event) => dispatch({ type: "SET_DEMO_SPEED", speed: event.target.value === "fast" ? "fast" : "normal" })}
					>
						<option value="normal">Normal</option>
						<option value="fast">Fast</option>
					</select>
				</label>
				<label className="settings-row">
					<span>
						Identity response delay
						<em>When enabled, the next run delays the identity feed inject on the server by 4 seconds. Other agents keep running.</em>
					</span>
					<input
						type="checkbox"
						checked={state.simulateIdentityDelay}
						onChange={(event) => dispatch({ type: "SET_IDENTITY_DELAY", enabled: event.target.checked })}
					/>
				</label>
			</section>

			<section className="settings-sheet">
				<p className="ops-heading">System</p>
				<dl className="settings-facts">
					<div>
						<dt>Inference mode</dt>
						<dd>{inferenceMode}</dd>
					</div>
					<div>
						<dt>Mozaik runtime</dt>
						<dd>{runtime}</dd>
					</div>
					<div>
						<dt>Concurrent agents</dt>
						<dd>{agentCount} active</dd>
					</div>
					<div>
						<dt>Event transport</dt>
						<dd>SSE</dd>
					</div>
					<div>
						<dt>Session</dt>
						<dd className="mono">{health?.session ?? state.demoStatus}</dd>
					</div>
					<div>
						<dt>Demo scenario</dt>
						<dd>{scenarioTitle(state.scenarioId)}</dd>
					</div>
				</dl>
			</section>

			<section className="settings-sheet">
				<p className="ops-heading">About this demo</p>
				<p className="settings-fine">
					Default demo: mocked channel feeds and mock inference, with a real Mozaik session of six concurrent agents.
					<br />
					A live OpenAI-compatible inference path is implemented; this demo stays deterministic for reproducibility.
					<br />
					No real payments are executed. No real calls or messages are accessed.
				</p>
			</section>
		</div>
	)
}
