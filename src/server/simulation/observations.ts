import type { AnalyzeLogEntry } from "../../runtime/scamSessionState"

export function summarizeObservation(entry: AnalyzeLogEntry) {
	const payload = entry.payload
	if (!payload || typeof payload !== "object") {
		return `${entry.channel} input`
	}

	const record = payload as Record<string, unknown>
	if (typeof record.text === "string") {
		return record.text.slice(0, 96)
	}
	if (typeof record.body === "string") {
		return record.body.slice(0, 96)
	}
	if (typeof record.hostname === "string") {
		return record.hostname
	}
	if (typeof record.kind === "string" && typeof record.value === "string") {
		return `${record.kind} ${record.value}`
	}
	if (typeof record.kind === "string") {
		return record.kind.replace(/_/g, " ")
	}
	if (typeof record.beneficiaryName === "string" && typeof record.amount === "number") {
		return `MYR ${record.amount} to ${record.beneficiaryName}`
	}
	return `${entry.channel} input`
}
