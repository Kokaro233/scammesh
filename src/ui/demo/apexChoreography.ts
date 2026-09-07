import type { DemoEvent } from "./choreography"

export function buildApexChoreography(identityDelay: boolean): DemoEvent[] {
	const identityCompleteAt = identityDelay ? 28_000 : 24_000

	const events: DemoEvent[] = [
		{
			id: "call-start",
			at: 3_000,
			ops: [
				{
					kind: "channel",
					channel: "call",
					activity: "Incoming call",
					title: "Incoming call",
					description: "This is Apex Bank Anti-Fraud Centre.",
					status: "checking",
					timestamp: "22:14:03",
				},
				{
					kind: "transcript",
					line: { id: "tr-1", time: "22:14:03", text: "This is Apex Bank Anti-Fraud Centre." },
				},
			],
		},
		{
			id: "call-unusual",
			at: 6_000,
			ops: [
				{
					kind: "channel",
					channel: "call",
					activity: "Monitoring",
					title: "Incoming call",
					description: "We detected unusual activity on your account.",
					status: "checking",
					timestamp: "22:14:06",
				},
				{
					kind: "transcript",
					line: { id: "tr-2", time: "22:14:06", text: "We detected unusual activity on your account." },
				},
			],
		},
		{
			id: "coercion",
			at: 8_000,
			ops: [
				{
					kind: "channel",
					channel: "call",
					activity: "Possible impersonation",
					title: "Possible impersonation",
					description: "Do not hang up or your account may be frozen.",
					status: "unverified",
					risk: "review",
					timestamp: "22:14:08",
				},
				{
					kind: "transcript",
					line: { id: "tr-3", time: "22:14:08", text: "Do not hang up or your account may be frozen." },
				},
				{
					kind: "signal",
					signal: {
						id: "sig-call-coercion",
						channel: "call",
						title: "High-pressure language",
						description: "Caller warned the account may be frozen if the person hangs up.",
						risk: "review",
						timestamp: "22:14:08",
						status: "unverified",
					},
				},
				{
					kind: "risk",
					score: 31,
					level: "watch",
					headline: "Watch",
					summary: "One unusual call signal. Not enough to confirm a scam.",
				},
				{
					kind: "coord",
					event: {
						id: "coord-coercion",
						source: "call",
						type: "coercion_detected",
						description: "High-pressure language detected on the call.",
						timestamp: "22:14:08",
					},
				},
			],
		},
		{
			id: "call-isolation",
			at: 10_000,
			ops: [
				{
					kind: "transcript",
					line: { id: "tr-4", time: "22:14:10", text: "Do not tell anyone. This is confidential." },
				},
				{
					kind: "channel",
					channel: "call",
					activity: "Possible impersonation",
					title: "Possible impersonation",
					description: "Do not tell anyone. This is confidential.",
					status: "unverified",
					risk: "review",
					timestamp: "22:14:10",
				},
			],
		},
		{
			id: "sms-arrives",
			at: 11_000,
			ops: [
				{
					kind: "channel",
					channel: "message",
					activity: "Checking",
					title: "Message",
					description: "Apex Bank �?Verify your account immediately.",
					status: "checking",
					timestamp: "22:14:11",
				},
			],
		},
		{
			id: "message-adapted",
			at: 12_000,
			ops: [
				{
					kind: "channel",
					channel: "message",
					activity: "Inspection level increased",
					title: "Message",
					description: "Inspection level increased after the call signal.",
					status: "checking",
					timestamp: "22:14:12",
				},
				{
					kind: "coord",
					event: {
						id: "coord-msg-adapt",
						source: "call",
						target: "message",
						type: "coercion_detected",
						description: "Message inspection level increased because the caller used high-pressure language.",
						timestamp: "22:14:12",
					},
				},
			],
		},
		{
			id: "suspicious-domain",
			at: 14_000,
			ops: [
				{
					kind: "channel",
					channel: "message",
					activity: "Suspicious banking link",
					title: "Suspicious link",
					description: "Link domain does not match the bank’s official site.",
					status: "related",
					risk: "high",
					timestamp: "22:14:14",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-msg-domain",
						channel: "message",
						title: "Suspicious banking link",
						description: "SMS asks the person to verify an account on secure-bank-verify.example.",
						risk: "high",
						timestamp: "22:14:14",
						status: "related",
					},
				},
				{
					kind: "connection",
					connection: {
						id: "link-call-message",
						source: "call",
						target: "message",
						reason: "Call pressure arrived with a banking link in the same minute",
						status: "confirmed",
						createdAt: "22:14:14",
					},
				},
				{
					kind: "risk",
					score: 47,
					level: "watch",
					headline: "Watch",
					summary: "Call and message now look related. Still unverified.",
				},
				{
					kind: "coord",
					event: {
						id: "coord-domain",
						source: "message",
						type: "suspicious_domain",
						description: "Suspicious banking domain found in the message.",
						timestamp: "22:14:14",
					},
				},
				{ kind: "reason", text: "Suspicious banking link" },
			],
		},
		{
			id: "browser-open",
			at: 16_000,
			ops: [
				{
					kind: "channel",
					channel: "browser",
					activity: "Checking current page",
					title: "Browser",
					description: "secure-bank-verify.example/login",
					status: "checking",
					timestamp: "22:14:16",
				},
			],
		},
		{
			id: "browser-adapted",
			at: 17_000,
			ops: [
				{
					kind: "channel",
					channel: "browser",
					activity: "Domain inspection prioritized",
					title: "Unverified page",
					description: "Domain inspection prioritized after the message.",
					status: "checking",
					timestamp: "22:14:17",
				},
				{
					kind: "coord",
					event: {
						id: "coord-browser-adapt",
						source: "message",
						target: "browser",
						type: "suspicious_domain",
						description: "Browser inspection prioritized because the SMS domain is unofficial.",
						timestamp: "22:14:17",
					},
				},
			],
		},
		{
			id: "otp-harvest",
			at: 19_000,
			ops: [
				{
					kind: "channel",
					channel: "browser",
					activity: "OTP requested",
					title: "Unverified banking domain",
					description: "Page is requesting a one-time password.",
					status: "related",
					risk: "high",
					timestamp: "22:14:19",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-browser-otp",
						channel: "browser",
						title: "OTP requested",
						description: "Unofficial page is asking for a bank OTP.",
						risk: "high",
						timestamp: "22:14:19",
						status: "related",
					},
				},
				{
					kind: "connection",
					connection: {
						id: "link-message-browser",
						source: "message",
						target: "browser",
						reason: "SMS URL matches the current suspicious page",
						status: "confirmed",
						createdAt: "22:14:19",
					},
				},
				{
					kind: "risk",
					score: 58,
					level: "review",
					headline: "Review",
					summary: "Multiple unusual signals detected.",
				},
				{
					kind: "coord",
					event: {
						id: "coord-otp",
						source: "browser",
						type: "credential_harvesting_detected",
						description: "Page requested an OTP on an unofficial domain.",
						timestamp: "22:14:19",
					},
				},
				{ kind: "reason", text: "Unofficial banking domain" },
				{ kind: "reason", text: "OTP requested" },
			],
		},
		{
			id: "screen-share",
			at: 21_000,
			ops: [
				{
					kind: "channel",
					channel: "device",
					activity: "Screen sharing enabled",
					title: "Screen sharing",
					description: "Screen sharing is active on this device.",
					status: "related",
					risk: "review",
					timestamp: "22:14:21",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-device-share",
						channel: "device",
						title: "Screen sharing enabled",
						description: "Someone else can see the screen during this session.",
						risk: "review",
						timestamp: "22:14:21",
						status: "related",
					},
				},
				{
					kind: "connection",
					connection: {
						id: "link-device-browser",
						source: "device",
						target: "browser",
						reason: "Screen sharing is active on the unverified page",
						status: "confirmed",
						createdAt: "22:14:21",
					},
				},
				{
					kind: "risk",
					score: 65,
					level: "review",
					headline: "Review",
					summary: "Remote visibility is now part of the same session.",
				},
				{ kind: "reason", text: "Screen sharing enabled" },
			],
		},
	]

	if (identityDelay) {
		events.push({
			id: "identity-delayed",
			at: 24_000,
			ops: [
				{
					kind: "channel",
					channel: "identity",
					activity: "Verification delayed",
					title: "Identity",
					description: "Verification delayed. Other channels continue.",
					status: "delayed",
					delayed: true,
					timestamp: "22:14:24",
				},
				{
					kind: "coord",
					event: {
						id: "coord-identity-delay",
						source: "identity",
						type: "verification_delayed",
						description: "Identity verification delayed. Other participants continue processing.",
						timestamp: "22:14:24",
					},
				},
			],
		})
	}

	events.push({
		id: "identity-mismatch",
		at: identityCompleteAt,
		ops: [
			{
				kind: "channel",
				channel: "identity",
				activity: "Identity mismatch",
				title: "Identity mismatch",
				description: "Claimed bank identity could not be verified.",
				status: "confirmed",
				risk: "high",
				delayed: false,
				timestamp: "22:14:25",
			},
			{
				kind: "signal",
				signal: {
					id: "sig-identity",
					channel: "identity",
					title: "Identity mismatch",
					description: "Caller and domain do not match official bank records.",
					risk: "high",
					timestamp: "22:14:25",
					status: "confirmed",
				},
			},
			{
				kind: "connection",
				connection: {
					id: "link-call-identity",
					source: "call",
					target: "identity",
					reason: "Claimed bank identity could not be verified",
					status: "confirmed",
					createdAt: "22:14:25",
				},
			},
			{
				kind: "connection",
				connection: {
					id: "link-browser-identity",
					source: "browser",
					target: "identity",
					reason: "Current domain does not match official Apex Bank domain",
					status: "confirmed",
					createdAt: "22:14:25",
				},
			},
			{
				kind: "risk",
				score: 72,
				level: "review",
				headline: "Review",
				summary: "Identity check failed. Transfer monitoring should stay heightened.",
			},
			{
				kind: "coord",
				event: {
					id: "coord-identity",
					source: "identity",
					type: "identity_mismatch",
					description: "Caller identity mismatch and domain mismatch.",
					timestamp: "22:14:25",
				},
			},
			{ kind: "reason", text: "Caller identity mismatch" },
		],
	})

	events.push(
		{
			id: "transfer-appears",
			at: 28_000,
			ops: [
				{
					kind: "transfer",
					transfer: {
						visible: true,
						amount: "8,000",
						amountValue: 8000,
						recipient: "Apex Safe Holding",
						bank: "DuitNow",
						beneficiary: "New",
						time: "22:14:29",
						status: "pending",
					},
				},
				{
					kind: "channel",
					channel: "payment",
					activity: "Checking",
					title: "Payment",
					description: "Transfer draft detected · RM 8,000",
					status: "checking",
					timestamp: "22:14:29",
				},
			],
		},
		{
			id: "payment-adapted",
			at: 30_000,
			ops: [
				{
					kind: "channel",
					channel: "payment",
					activity: "Transfer monitoring escalated",
					title: "Payment",
					description: "Transfer monitoring escalated after earlier channel evidence.",
					status: "checking",
					timestamp: "22:14:30",
				},
				{
					kind: "coord",
					event: {
						id: "coord-pay-adapt",
						source: "identity",
						target: "payment",
						type: "identity_mismatch",
						description: "Payment monitoring escalated because the claimed bank identity could not be verified.",
						timestamp: "22:14:30",
					},
				},
				{
					kind: "coord",
					event: {
						id: "coord-browser-pay",
						source: "browser",
						target: "payment",
						type: "credential_harvesting_detected",
						description: "Payment monitoring tightened because OTP was requested on the unofficial page.",
						timestamp: "22:14:30",
					},
				},
			],
		},
		{
			id: "high-value",
			at: 32_000,
			ops: [
				{
					kind: "channel",
					channel: "payment",
					activity: "New beneficiary",
					title: "New beneficiary",
					description: "RM 8,000 to Apex Safe Holding",
					status: "confirmed",
					risk: "high",
					timestamp: "22:14:32",
				},
				{
					kind: "signal",
					signal: {
						id: "sig-payment",
						channel: "payment",
						title: "New beneficiary",
						description: "High-value transfer to a first-time beneficiary during an active risk pattern.",
						risk: "high",
						timestamp: "22:14:32",
						status: "confirmed",
					},
				},
				{
					kind: "risk",
					score: 100,
					level: "high",
					headline: "High Risk",
					summary: "Likely impersonation scam",
				},
				{
					kind: "coord",
					event: {
						id: "coord-payment",
						source: "payment",
						type: "high_value_new_beneficiary",
						description: "High-value transfer to a new beneficiary with coordinated risk context.",
						timestamp: "22:14:32",
					},
				},
				{ kind: "reason", text: "New beneficiary" },
				{ kind: "reason", text: "High-value transfer" },
			],
		},
		{
			id: "final-links",
			at: 33_000,
			ops: [
				{
					kind: "connection",
					connection: {
						id: "link-browser-payment",
						source: "browser",
						target: "payment",
						reason: "Transfer occurred during a credential-harvesting flow",
						status: "confirmed",
						createdAt: "22:14:33",
					},
				},
				{
					kind: "connection",
					connection: {
						id: "link-device-payment",
						source: "device",
						target: "payment",
						reason: "Screen sharing active during transfer",
						status: "confirmed",
						createdAt: "22:14:33",
					},
				},
			],
		},
		{
			id: "stamp",
			at: 34_000,
			ops: [{ kind: "stamp", visible: true }],
		},
		{
			id: "final-panel",
			at: 35_000,
			ops: [
				{
					kind: "risk",
					score: 100,
					level: "high",
					headline: "High Risk",
					summary: "Likely impersonation scam",
				},
			],
		},
	)

	return events.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
}
