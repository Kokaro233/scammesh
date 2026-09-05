import type { SimulationStateView } from "../shared/simulationView"
import { buildScamGraph } from "./graph/graphModel"

export function LiveScamGraph({ state }: { state: SimulationStateView }) {
	const graph = buildScamGraph(state.session)

	return (
		<section className={`graph${graph.highlightChain ? " graph-hot" : ""}`}>
			<h3>Live Scam Graph</h3>
			<p>
				{graph.highlightChain
					? "Cross-channel pattern detected. The connected chain is highlighted."
					: graph.edges.length === 0
						? "Nodes stay apart until a correlation rule fires."
						: `${graph.edges.length} correlation edge${graph.edges.length === 1 ? "" : "s"} from real rules.`}
			</p>
			<svg className="scam-svg" viewBox="0 0 720 380" role="img" aria-label="Live scam correlation graph">
				{graph.edges.map((edge) => {
					const from = graph.nodes.find((node) => node.id === edge.from)
					const to = graph.nodes.find((node) => node.id === edge.to)
					if (!from || !to) {
						return null
					}
					const midX = (from.x + to.x) / 2
					const midY = (from.y + to.y) / 2
					return (
						<g key={edge.edgeId} className={graph.highlightChain ? "edge hot" : "edge"}>
							<line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
							<text x={midX} y={midY - 8}>
								{edge.label}
							</text>
						</g>
					)
				})}
				{graph.nodes.map((node) => (
					<g
						key={node.id}
						className={`node${node.active ? " active" : ""}${graph.highlightChain && node.active ? " hot" : ""}`}
					>
						<circle cx={node.x} cy={node.y} r="28" />
						<text x={node.x} y={node.y + 4}>
							{node.label}
						</text>
					</g>
				))}
			</svg>
		</section>
	)
}
