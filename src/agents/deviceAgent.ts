import { createAgent } from "@mozaik-ai/core"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import { createDeviceFeedHandler } from "./situations/whenDeviceFeed"
import { createLoopTraceHandlers } from "./situations/whenLoopEvents"
import { createStartLoopHandler } from "./situations/whenOthersSendAMessage"

export function createDeviceAgent(api: ScamSessionApi) {
	return createAgent({
		name: "Device Agent",
		capabilities: ["inference"],
		instruction:
			"You only inspect simulated device telemetry such as screen sharing, remote-control apps, and accessibility changes. You must not read call audio, page forms, or payment details.",
		tools: [],
		handlers: [
			createStartLoopHandler(api, "scam-device", "device"),
			createDeviceFeedHandler(api),
			...createLoopTraceHandlers(api, "device"),
		],
	})
}
