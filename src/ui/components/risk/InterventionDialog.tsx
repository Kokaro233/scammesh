import type { AppPage } from "../layout/nav"
import type { InterventionPhase, TransferRecord } from "../../store/types"

export function InterventionDialog({
	phase,
	transfer,
	onConfirmContinue,
	onDismiss,
	onNavigate,
}: {
	phase: InterventionPhase
	transfer: TransferRecord
	onConfirmContinue: () => void
	onDismiss: () => void
	onNavigate: (page: AppPage) => void
}) {
	if (phase === "closed") {
		return null
	}

	const paused = phase === "paused"
	const continued = phase === "continued"
	const confirm = phase === "confirm-continue"

	return (
		<div className="decision-layer">
			<button className="drawer-backdrop" type="button" aria-label="Close decision" onClick={onDismiss} />
			<section className="decision-sheet" role="dialog" aria-modal="true" aria-labelledby="decision-title">
				<p className="panel-kicker">{confirm ? "Confirm" : "Decision"}</p>
				<h2 id="decision-title" className="display-serif">
					{confirm ? "Continue this transfer?" : paused ? "Transfer paused" : "Continued by you"}
				</h2>
				<p className="decision-amount display-serif">
					{transfer.currency} {transfer.amount}
				</p>
				<p className="decision-name">{transfer.recipient}</p>
				<p className="decision-copy">
					{confirm
						? "The six channels still form one impersonation pattern. This is a demo. No real payment is sent."
						: paused
							? "Held in this demo before it could be sent. This is not a real bank freeze."
							: "Allowed to proceed in this demo. The high-risk pattern is still recorded."}
				</p>
				{paused || continued ? (
					<ul className="decision-effects">
						<li>{paused ? "Receipt marked paused" : "Receipt marked continued"}</li>
						<li>Session written to History</li>
						{paused ? <li>Overview protected count updated</li> : <li>Hang up and verify independently</li>}
					</ul>
				) : null}
				<p className="consumer-note">Hang up and contact your bank through an independently verified number.</p>
				<div className="decision-actions">
					{confirm ? (
						<>
							<button className="btn-quiet" type="button" onClick={onDismiss}>
								Go back
							</button>
							<button className="btn-danger" type="button" onClick={onConfirmContinue}>
								Continue anyway
							</button>
						</>
					) : (
						<>
							<button
								className="btn-danger"
								type="button"
								onClick={() => {
									onDismiss()
									onNavigate("history")
								}}
							>
								View History
							</button>
							<button
								className="btn-quiet"
								type="button"
								onClick={() => {
									onDismiss()
									onNavigate("transfer")
								}}
							>
								Review transfer
							</button>
							<button className="text-link" type="button" onClick={onDismiss}>
								Stay on this desk
							</button>
						</>
					)}
				</div>
			</section>
		</div>
	)
}
