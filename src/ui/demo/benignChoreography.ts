import type { DemoEvent } from "./choreography"

export function buildBenignChoreography(): DemoEvent[] {
	return [
		{
			id: "official-sms",
			at: 3_000,
			ops: [
				{
					kind: "channel",
					channel: "message",
					activity: "Official notification",
					title: "Message",
					description: "Apex Bank activity notice on the official domain.",
					status: "checking",
					timestamp: "22:14:03",
				},
			],
		},
		{
			id: "official-browser",
			at: 6_000,
			ops: [
				{
					kind: "channel",
					channel: "browser",
					activity: "Official page",
					title: "Browser",
					description: "secure.apexbank.com.my/activity",
					status: "checking",
					timestamp: "22:14:06",
				},
			],
		},
		{
			id: "identity-verified",
			at: 10_000,
			ops: [
				{
					kind: "channel",
					channel: "identity",
					activity: "Verified",
					title: "Identity",
					description: "Official Apex Bank domain and known beneficiary match the registry.",
					status: "confirmed",
					timestamp: "22:14:10",
				},
			],
		},
		{
			id: "transfer-appears",
			at: 14_000,
			ops: [
				{
					kind: "transfer",
					transfer: {
						visible: true,
						amount: "300",
						amountValue: 300,
						recipient: "Lee Wei Ming",
						bank: "Apex Bank",
						beneficiary: "Existing",
						time: "22:14:14",
						status: "pending",
					},
				},
				{
					kind: "channel",
					channel: "payment",
					activity: "Known beneficiary",
					title: "Payment",
					description: "RM 300 to a known payee on the official rail.",
					status: "checking",
					timestamp: "22:14:14",
				},
			],
		},
		{
			id: "benign-complete",
			at: 18_000,
			ops: [
				{
					kind: "channel",
					channel: "payment",
					activity: "Official transfer",
					title: "Payment",
					description: "No coordinated fraud pattern detected.",
					status: "confirmed",
					timestamp: "22:14:18",
				},
				{
					kind: "risk",
					score: 18,
					level: "normal",
					headline: "Normal",
					summary: "No coordinated fraud pattern detected.",
				},
			],
		},
	]
}
