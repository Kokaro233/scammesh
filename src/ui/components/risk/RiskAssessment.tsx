import type { RiskLevel, TransferRecord } from "../../store/types"
import { RiskStamp } from "./RiskStamp"

export function RiskAssessment({
	score,
	level,
	headline,
	summary,
	reasons,
	stampVisible,
	transfer,
	onPause,
	onContinue,
	onReopen,
	onViewHistory,
	onReviewTransfer,
}: {
	score: number
	level: RiskLevel
	headline: string
	summary: string
	reasons: string[]
	stampVisible: boolean
	transfer: TransferRecord
	onPause: () => void
	onContinue: () => void
	onReopen: () => void
	onViewHistory: () => void
	onReviewTransfer: () => void
}) {
	const paused = transfer.status === "paused"
	const pausing = transfer.status === "pausing"
	const continued = transfer.status === "continued"
	const canAct = transfer.visible && (level === "high" || paused || pausing || continued)
	const decided = paused || continued

	return (
		<section className={`risk-assessment risk-rail level-${level}`}>
			<p className="panel-kicker">Risk assessment</p>
			<p className="risk-score display-serif tabular" key={score}>
				{score}
			</p>
			<p className="risk-level display-serif" key={headline}>
				{paused ? "Transfer paused" : continued ? "Continued by you" : headline}
			</p>
			<p className="risk-summary" key={summary}>
				{summary}
			</p>
			<p className="connected-count">
				<span>Connected signals</span>
				<strong className="tabular">{reasons.length}</strong>
			</p>
			{level === "normal" ? (
				<p className="system-notes">
					6 channels monitoring.
					<br />
					No action recommended.
				</p>
			) : null}
			{level === "watch" ? <p className="system-notes">Continue monitoring.</p> : null}
			{level === "review" ? <p className="system-notes">Review before continuing.</p> : null}
			<RiskStamp visible={stampVisible} />
			{reasons.length > 0 ? (
				<div className="risk-why">
					<ol>
						{reasons.map((reason, index) => (
							<li key={reason}>
								<span className="reason-no">{String(index + 1).padStart(2, "0")}</span>
								<span>{reason}</span>
							</li>
						))}
					</ol>
				</div>
			) : null}
			{canAct ? (
				<div className="risk-rail-actions consumer-action" key="consumer-action">
					{decided ? (
						<div className="decision-followup">
							<p className="decision-followup-title">{paused ? "Paused in this demo" : "Continued in this demo"}</p>
							<p className="decision-followup-copy">
								{paused
									? "This is not a real bank freeze. The session is now in History."
									: "No real payment was sent. The high-risk pattern is still recorded."}
							</p>
							<button className="btn-danger" type="button" onClick={onViewHistory}>
								View History
							</button>
							<button className="btn-quiet" type="button" onClick={onReviewTransfer}>
								Review transfer
							</button>
							<button className="text-link" type="button" onClick={onReopen}>
								Open decision
							</button>
						</div>
					) : (
						<>
							<button className="btn-danger" type="button" onClick={onPause} disabled={pausing}>
								{pausing ? "Pausing..." : "Pause transfer"}
							</button>
							<button className="btn-quiet" type="button" onClick={onContinue} disabled={pausing}>
								Continue anyway
							</button>
							<p className="consumer-note">Hang up and contact your bank through an independently verified number.</p>
						</>
					)}
				</div>
			) : null}
		</section>
	)
}
