import type { SimulationStateView } from "../shared/simulationView"
import { adaptationChain, evidenceByChannel, whyNotSingleChannel } from "./evidence/evidenceModel"

export function EvidencePage({
	state,
	onBack,
	onAction,
}: {
	state: SimulationStateView
	onBack: () => void
	onAction: () => void
}) {
	const groups = evidenceByChannel(state.session)
	const steps = adaptationChain(state.session)
	const why = whyNotSingleChannel(state.session)

	return (
		<main className="page">
			<header className="topbar">
				<div>
					<p className="tagline">Evidence</p>
					<h1>Why these signals belong together</h1>
				</div>
				<div className="top-actions">
					<button className="ghost" type="button" onClick={onBack}>
						Back to room
					</button>
					<button className="ghost" type="button" onClick={onAction}>
						Action
					</button>
				</div>
			</header>
			<section className="panel">
				<h3>Not a single-channel false alarm</h3>
				<p>{why.explain}</p>
				{why.synergies.length > 0 ? (
					<ul className="reasons">
						{why.synergies.map((reason) => (
							<li key={reason}>{reason}</li>
						))}
					</ul>
				) : null}
			</section>
			<section className="panel">
				<h3>Adaptation chain</h3>
				{steps.length === 0 ? (
					<p>No agent has adapted yet.</p>
				) : (
					<ol>
						{steps.map((step) => (
							<li key={step.stepId}>{step.text}</li>
						))}
					</ol>
				)}
			</section>
			{groups.map((group) => (
				<section className="panel" key={group.channel}>
					<h3>{group.label}</h3>
					<ul>
						{group.items.map((item) => (
							<li key={item.eventId}>
								<strong>{item.type}</strong> — {item.summary}
								<div className="meta">
									produced by {item.producedBy}
									{item.usedBy.length > 0
										? ` · used by ${item.usedBy.join(", ")}`
										: " · not used by another agent yet"}
								</div>
							</li>
						))}
					</ul>
				</section>
			))}
		</main>
	)
}
