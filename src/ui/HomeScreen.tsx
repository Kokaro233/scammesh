import type { ScenarioOption } from "./api"
import type { ScenarioId } from "../shared/types"

export function HomeScreen({
	scenarios,
	selected,
	error,
	onSelect,
	onStart,
}: {
	scenarios: ScenarioOption[]
	selected: ScenarioId
	error: string | null
	onSelect: (id: ScenarioId) => void
	onStart: () => void
}) {
	return (
		<main className="home">
			<section className="home-card">
				<p className="tagline">Scams cross channels. Protection should too.</p>
				<h1>ScamMesh</h1>
				<p>Six isolated agents watch one live case together. No single agent sees the whole scam.</p>
				<div className="scenario-list">
					{scenarios.map((scenario) => (
						<label key={scenario.id} className={scenario.id === selected ? "active" : ""}>
							<input
								type="radio"
								name="scenario"
								checked={scenario.id === selected}
								onChange={() => onSelect(scenario.id)}
							/>
							<strong>{scenario.title}</strong>
							<span>{scenario.summary}</span>
						</label>
					))}
				</div>
				{error ? <p className="error">{error}</p> : null}
				<button className="primary" type="button" onClick={onStart}>
					Start Live Simulation
				</button>
			</section>
		</main>
	)
}
