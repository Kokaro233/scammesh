import receiptSurface from "../../../assets/transfer-receipt.png"
import type { TransferRecord } from "../../store/types"

export function TransferReceipt({
	transfer,
	quiet = false,
}: {
	transfer: TransferRecord
	quiet?: boolean
}) {
	return (
		<article className={`transfer-receipt${quiet ? " is-quiet" : ""}`} data-status={transfer.status}>
			<img className="transfer-receipt-surface" src={receiptSurface} alt="" />
			<div className="transfer-receipt-content">
				<p className="transfer-kicker">Transfer receipt</p>
				<p className={`transfer-status status-${transfer.status}`} key={transfer.status}>
					{transferStatus(transfer.status)}
				</p>
				<p className="transfer-amount">
					<span>{transfer.currency}</span>
					<strong className="display-serif" key={transfer.amount}>
						{transfer.amount}
					</strong>
				</p>
				<dl className="transfer-fields">
					<div>
						<dt>Recipient</dt>
						<dd>{transfer.recipient}</dd>
					</div>
					<div>
						<dt>Bank</dt>
						<dd>{transfer.bank}</dd>
					</div>
					<div>
						<dt>Beneficiary</dt>
						<dd>{transfer.beneficiary}</dd>
					</div>
					<div>
						<dt>Transfer time</dt>
						<dd className="mono">{transfer.time}</dd>
					</div>
				</dl>
			</div>
		</article>
	)
}

function transferStatus(status: TransferRecord["status"]): string {
	if (status === "pausing") return "Pausing"
	if (status === "paused") return "Paused"
	if (status === "continued") return "Continued"
	return "Pending"
}
