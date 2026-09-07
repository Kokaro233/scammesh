import { demoBeats, demoCaption } from "../../demo/process"
import { useScamStore } from "../../store/scamStore"

export function DemoProcess({
	onStart,
	showStart = false,
	compact = false,
}: {
	onStart?: () => void
	showStart?: boolean
	compact?: boolean
}) {
	const { state } = useScamStore()
	const beats = demoBeats(state)
	const idle = state.demoStatus === "idle" && state.signals.length === 0
	const running = state.demoStatus === "running"

	return (
		<section className={`demo-process${running ? " is-live" : ""}${compact ? " is-compact" : ""}`} aria-label="Demo process">
			{compact ? (
				<p className="demo-process-now">{demoCaption(state)}</p>
			) : (
				<div className="demo-process-copy">
					<p className="ops-heading">Demo chain</p>
					<p>{demoCaption(state)}</p>
				</div>
			)}
			<ol className="demo-beats">
				{beats.map((beat, index) => (
					<li key={beat.id} className={beat.done ? "is-done" : beat.current && !idle ? "is-now" : ""}>
						{index > 0 ? <i aria-hidden="true" /> : null}
						<span className="mono">{beat.no}</span>
						{beat.label}
					</li>
				))}
			</ol>
			{showStart && onStart && idle ? (
				<button className="btn-danger demo-start-btn" type="button" onClick={onStart}>
					Start demo
				</button>
			) : null}
		</section>
	)
}
