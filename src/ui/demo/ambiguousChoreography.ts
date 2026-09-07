import type { DemoEvent } from "./choreography"

export function buildAmbiguousChoreography(): DemoEvent[] {
	return [
		{
			id: "call-start",
			at: 3_000,
			ops: [
				{
					kind: "channel",
					channel: "call",
					activity: "Incoming call",
					title: "Incoming call",
					description: "Unknown number asking about a pending payment.",
					status: "checking",
					timestamp: "22:14:03",
				},
				{
					kind: "transcript",
					line: { id: "tr-amb-1", time: "22:14:03", text: "This is about a pending payment on your account." },
				},
			],
		},
		{
			id: "unknown-caller",
			at: 8_000,
			ops: [
				{
					kind: "transcript",
					line: { id: "tr-amb-2", time: "22:14:08", text: "Please confirm it quickly so we can finish processing." },
				},
				{
					kind: "channel",
					channel: "call",
					activity: "Unknown caller",
					title: "Unknown caller",
					description: "Please confirm it quickly so we can finish processing.",
					status: "unverified",
					risk: "review",
					timestamp: "22:14:08",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-unknown-caller",
						channel: "call",
						title: "Unknown caller",
						description: "An unknown number asked the person to confirm a payment quickly.",
						risk: "review",
						timestamp: "22:14:08",
						status: "unverified",
					},
				},
				{
					kind: "risk",
					score: 36,
					level: "watch",
					headline: "Watch",
					summary: "An unknown caller is unusual. Official banking has not been checked yet.",
				},
			],
		},
		{
			id: "official-sms",
			at: 12_000,
			ops: [
				{
					kind: "channel",
					channel: "message",
					activity: "Official notification",
					title: "Message",
					description: "Official Apex Bank security notice.",
					status: "checking",
					timestamp: "22:14:12",
				},
			],
		},
		{
			id: "official-browser",
			at: 16_000,
			ops: [
				{
					kind: "channel",
					channel: "browser",
					activity: "Official page",
					title: "Browser",
					description: "secure.apexbank.com.my â€?no OTP harvest.",
					status: "checking",
					timestamp: "22:14:16",
				},
			],
		},
		{
			id: "transfer-appears",
			at: 20_000,
			ops: [
				{
					kind: "transfer",
					transfer: {
						visible: true,
						amount: "1,200",
						amountValue: 1200,
						recipient: "Apex Safe Holding",
						bank: "DuitNow",
						beneficiary: "New",
						time: "22:14:20",
						status: "pending",
					},
				},
				{
					kind: "channel",
					channel: "payment",
					activity: "New beneficiary",
					title: "Payment",
					description: "RM 1,200 to a first-time beneficiary.",
					status: "checking",
					risk: "review",
					timestamp: "22:14:20",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-new-payee",
						channel: "payment",
						title: "New beneficiary",
						description: "A moderate transfer to a first-time beneficiary, without a coordinated harvest pattern.",
						risk: "review",
						timestamp: "22:14:20",
						status: "unverified",
					},
				},
			],
		},
		{
			id: "incomplete-pattern",
			at: 23_000,
			ops: [
				{
					kind: "channel",
					channel: "identity",
					activity: "Incomplete match",
					title: "Identity",
					description: "Caller is unverified. Official bank domain is verified.",
					status: "unverified",
					risk: "review",
					timestamp: "22:14:23",
				},
				{
					kind: "risk",
					score: 54,
					level: "review",
					headline: "Review",
					summary: "Incomplete risk pattern. Verify before continuing.",
				},
				{ kind: "reason", text: "Unknown caller" },
				{ kind: "reason", text: "New beneficiary" },
			],
		},
	]
}
