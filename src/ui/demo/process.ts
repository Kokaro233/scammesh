import type { ScamState } from "../store/types"

export type ProcessBeat = {
	id: string
	no: string
	label: string
	done: boolean
	current: boolean
}

export function demoBeats(state: ScamState): ProcessBeat[] {
	const steps =
		state.scenarioId === "benign-bank"
			? [
					{ id: "notice", no: "01", label: "Official notice", done: state.channelStates.message.status !== "monitoring" },
					{ id: "page", no: "02", label: "Official page", done: state.channelStates.browser.status !== "monitoring" },
					{
						id: "verified",
						no: "03",
						label: "Identity verified",
						done: state.channelStates.identity.status !== "monitoring" || state.signals.some((item) => item.channel === "identity"),
					},
					{ id: "transfer", no: "04", label: "RM 300", done: state.transfer.visible },
					{ id: "clear", no: "05", label: "No intervention", done: state.demoStatus === "complete" && state.riskLevel === "normal" },
				]
			: state.scenarioId === "ambiguous"
				? [
						{ id: "call", no: "01", label: "Unknown caller", done: state.signals.some((item) => item.channel === "call") },
						{ id: "official", no: "02", label: "Official banking", done: state.channelStates.browser.status !== "monitoring" },
						{ id: "transfer", no: "03", label: "New beneficiary", done: state.transfer.visible },
						{ id: "review", no: "04", label: "Review", done: state.riskLevel === "review" },
					]
				: [
						{ id: "call", no: "01", label: "Call", done: state.callTranscript.length > 0 },
						{ id: "message", no: "02", label: "Message", done: state.channelStates.message.status !== "monitoring" },
						{ id: "browser", no: "03", label: "Browser", done: state.channelStates.browser.status !== "monitoring" },
						{ id: "device", no: "04", label: "Device", done: state.channelStates.device.status !== "monitoring" },
						{ id: "identity", no: "05", label: "Identity", done: Boolean(state.signals.find((item) => item.channel === "identity")) },
						{ id: "transfer", no: "06", label: "Transfer", done: state.transfer.visible },
						{
							id: "act",
							no: "07",
							label: state.transfer.status === "paused" ? "Paused" : "Pause",
							done: state.transfer.status === "paused",
						},
					]

	const currentIndex = steps.findIndex((item) => !item.done)
	return steps.map((item, index) => ({
		...item,
		current: currentIndex === -1 ? index === steps.length - 1 && item.done : index === currentIndex,
	}))
}

export function demoCaption(state: ScamState): string {
	if (state.transfer.status === "paused") {
		return "Transfer paused. Overview and History now hold this session."
	}
	if (state.transfer.status === "continued") {
		return "Continued in this demo. History still holds the high-risk pattern."
	}
	if (state.riskLevel === "high" && state.transfer.visible && state.transfer.status === "pending") {
		return "The six channels now form one pattern. Pause this transfer."
	}
	if (state.demoStatus === "idle" && state.signals.length === 0) {
		return "Start the demo. The session plays itself: call, message, browser, device, identity, then the transfer."
	}
	if (state.scenarioId === "benign-bank" && state.demoStatus === "complete") {
		return "Official banking activity. No coordinated fraud pattern. No pause."
	}
	if (state.scenarioId === "ambiguous" && state.riskLevel === "review") {
		return "Incomplete pattern. Verify before continuing. No automatic pause."
	}
	const spoken = state.callTranscript[state.callTranscript.length - 1]?.text
	if (spoken && !state.transfer.visible && state.signals.every((item) => item.channel === "call")) {
		return spoken
	}
	const lastAdaptation = state.coordinationEvents.at(-1)
	if (lastAdaptation?.source === "call" && lastAdaptation.target === "message") {
		return lastAdaptation.description || "The call changed how Message inspects the inbox."
	}
	if (lastAdaptation?.source === "message" && lastAdaptation.target === "browser") {
		return lastAdaptation.description || "The message changed how Browser inspects the page."
	}
	if (lastAdaptation?.source === "device" && lastAdaptation.target === "payment") {
		return lastAdaptation.description || "Earlier findings changed how Payment inspects this transfer."
	}
	if (lastAdaptation?.source === "identity" && lastAdaptation.target === "payment") {
		return lastAdaptation.description || "Earlier findings changed how Payment inspects this transfer."
	}
	if (state.channelStates.payment.activity === "Transfer monitoring escalated") {
		return "Earlier findings changed how Payment inspects this transfer."
	}
	if (state.channelStates.message.activity === "Inspection level increased") {
		return "The call changed how Message inspects the inbox."
	}
	if (state.channelStates.browser.activity === "Domain inspection prioritized") {
		return "The message changed how Browser inspects the page."
	}
	if (lastAdaptation?.description) {
		return lastAdaptation.description
	}
	return state.summary
}
