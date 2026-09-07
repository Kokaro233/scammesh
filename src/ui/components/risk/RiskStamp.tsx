import stampUrl from "../../../assets/risk-stamp.png"

export function RiskStamp({ visible }: { visible: boolean }) {
	if (!visible) {
		return null
	}

	return <img className="risk-stamp" src={stampUrl} alt="High risk" key="risk-stamp" />
}
