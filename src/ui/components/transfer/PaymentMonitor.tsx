import receiptSurface from "../../../assets/transfer-receipt.png"

export function PaymentMonitor() {
	return (
		<article className="transfer-receipt is-empty">
			<img className="transfer-receipt-surface" src={receiptSurface} alt="" />
			<div className="transfer-receipt-content">
				<p className="transfer-kicker">Payment monitor</p>
				<p className="transfer-status">No active transfer</p>
				<p className="transfer-empty-copy">Waiting for payment activity</p>
			</div>
		</article>
	)
}
