import type { SimulationStateView } from "../shared/simulationView"

export function RiskPanel({ state }: { state: SimulationStateView }) {
	const snapshot = state.session.riskSnapshots.at(-1)
	const reasons = snapshot?.reasons.slice(0, 5) ?? []
	const channels = snapshot?.channelsInvolved ?? []

	return (
		<aside className="risk-panel">
			<h3>Risk panel</h3>
			<p>
				Score <strong>{state.session.overallRisk}</strong> ·{" "}
				<span className={`level-${state.session.riskLevel}`}>{state.session.riskLevel}</span>
			</p>
			<p>Channels involved: {channels.length > 0 ? channels.join(", ") : "none yet"}</p>
			<ul className="reasons">
				{reasons.length > 0 ? (
					reasons.map((reason) => <li key={reason}>{reason}</li>)
				) : (
					<li>No fusion reasons yet</li>
				)}
			</ul>
			<p>Demo rule score, not a real fraud probability.</p>
		</aside>
	)
}
