import type { SimulationStateView } from "../shared/simulationView"

const SAFETY_TIPS = [
	"Hang up and call back only via a number you already trust.",
	"Close the unexpected page. Do not enter an OTP or card number.",
	"Do not enable screen sharing or remote-control apps for a caller.",
	"Do not transfer. Pause and verify the payee yourself.",
	"Contact the bank through an independently verified official channel.",
]

export function ActionPage({
	state,
	onBack,
	onRestart,
}: {
	state: SimulationStateView
	onBack: () => void
	onRestart: () => void
}) {
	return (
		<main className="page">
			<header className="topbar">
				<div>
					<p className="tagline">Action</p>
					<h1>Human-in-the-loop next steps</h1>
				</div>
				<button className="ghost" type="button" onClick={onBack}>
					Back to room
				</button>
			</header>
			<section className="panel">
				<h3>Prototype recommendations</h3>
				{state.session.recommendedActions.length === 0 ? (
					<p>No payment pause is recommended yet. Keep watching the live room.</p>
				) : (
					<ul>
						{state.session.recommendedActions.map((action) => (
							<li key={action.actionId}>
								<strong>{action.title}</strong> — {action.detail}
							</li>
						))}
					</ul>
				)}
			</section>
			<section className="panel">
				<h3>Safe checks a person can do</h3>
				<ul>
					{SAFETY_TIPS.map((tip) => (
						<li key={tip}>{tip}</li>
					))}
				</ul>
				<p className="disclaimer">Prototype only / no real transaction interception.</p>
			</section>
			<button className="primary" type="button" onClick={onRestart}>
				Restart Demo
			</button>
		</main>
	)
}
