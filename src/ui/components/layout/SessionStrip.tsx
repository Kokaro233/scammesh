import { scenarioTitle } from "../../demo/scenarios"
import { riskLabel } from "../../store/channels"
import { useScamStore } from "../../store/scamStore"
import type { AppPage } from "./nav"
import { getPageMeta } from "./nav"

export function SessionStrip({ page }: { page: AppPage }) {
	const { state } = useScamStore()
	const meta = getPageMeta(page)
	const live = state.demoStatus !== "idle" || state.signals.length > 0
	const clock = formatClock(state.demoElapsedMs)

	if (!live) {
		return (
			<div className="session-strip">
				<p>
					<span className="mono">ScamMesh</span>
					<span className="strip-div">/</span>
					<span>{meta.label}</span>
				</p>
				<p>
					System active
					<span className="strip-dot" />
					<span className="mono">6 channels</span>
				</p>
			</div>
		)
	}

	return (
		<div className={`session-strip is-${state.riskLevel}${state.transfer.status === "paused" ? " is-paused" : ""}`}>
			<p>
				<span className="mono">Live session</span>
				<span className="strip-div">/</span>
				<span>{scenarioTitle(state.scenarioId)}</span>
			</p>
			<p>
				<span className="mono">
					Risk {state.riskScore} / {riskLabel(state.riskLevel)}
				</span>
				<span className="strip-div">·</span>
				<span className="mono">{state.signals.length} signals</span>
				{state.transfer.visible && (state.riskLevel === "high" || state.transfer.status === "paused") ? (
					<>
						<span className="strip-div">·</span>
						<span className="mono">
							{state.transfer.currency} {state.transfer.amount}
						</span>
					</>
				) : null}
				{state.transfer.status === "paused" || state.transfer.status === "continued" ? (
					<>
						<span className="strip-div">·</span>
						<span>{state.transfer.status === "paused" ? "Paused" : "Continued"}</span>
					</>
				) : (
					<>
						<span className="strip-div">·</span>
						<span className="mono">{clock}</span>
					</>
				)}
			</p>
		</div>
	)
}

function formatClock(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000))
	const minutes = String(Math.floor(total / 60)).padStart(2, "0")
	const seconds = String(total % 60).padStart(2, "0")
	return `${minutes}:${seconds}`
}
