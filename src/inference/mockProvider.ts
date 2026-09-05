import type {
	BrowserPage,
	CallUtterance,
	DeviceTelemetry,
	IdentityLookup,
	InboundMessage,
	TransactionIntent,
} from "../shared/types"
import { EVENT_TYPES } from "../runtime/events"
import type { AnalyzeInput, InferenceContext, InferenceProvider } from "./provider"
import { ANALYSIS_SCHEMA, validateAnalysisResult, type AnalysisResult, type Detection } from "./schema"

function hasText(value: string, pattern: RegExp) {
	return pattern.test(value)
}

function hostnameFromUrl(url: string) {
	try {
		return new URL(url).hostname
	} catch {
		return url
	}
}

function isOfficialDomain(hostname: string, context: InferenceContext) {
	return Boolean(context.registry?.officialBankDomains.includes(hostname))
}

function analyzeCall(payload: CallUtterance): Detection[] {
	const detections: Detection[] = []
	if (payload.claimedIdentity || hasText(payload.text, /anti-fraud|fraud centre|apex bank/i)) {
		detections.push({
			type: EVENT_TYPES.IMPERSONATION_CLAIMED,
			severity: "high",
			confidence: 0.86,
			summary: "Caller claimed to represent a bank anti-fraud desk.",
			entityRefs: payload.claimedIdentity ? [payload.claimedIdentity] : ["Apex Bank"],
		})
	}
	if (hasText(payload.text, /do not hang up|don't hang up|stay on the line/i)) {
		detections.push({
			type: EVENT_TYPES.COERCION_DETECTED,
			severity: "high",
			confidence: 0.91,
			summary: "Caller told the user not to hang up.",
			entityRefs: [],
		})
	}
	if (hasText(payload.text, /do not tell anyone|confidential/i)) {
		detections.push({
			type: EVENT_TYPES.SECRECY_REQUEST_DETECTED,
			severity: "medium",
			confidence: 0.84,
			summary: "Caller asked the user to keep the call secret.",
			entityRefs: [],
		})
	}
	if (hasText(payload.text, /immediately|quickly|frozen|urgent/i)) {
		detections.push({
			type: EVENT_TYPES.URGENCY_DETECTED,
			severity: "medium",
			confidence: 0.8,
			summary: "Caller used urgency language.",
			entityRefs: [],
		})
	}
	return detections
}

function analyzeMessage(payload: InboundMessage, context: InferenceContext): Detection[] {
	const detections: Detection[] = []
	const official = payload.links.every((link) => isOfficialDomain(hostnameFromUrl(link.url), context))

	if (official || payload.links.length === 0) {
		return detections
	}

	if (context.mode === "NORMAL") {
		return detections
	}

	for (const link of payload.links) {
		const hostname = hostnameFromUrl(link.url)
		detections.push({
			type: EVENT_TYPES.SUSPICIOUS_LINK_DETECTED,
			severity: context.mode === "PRIORITY" ? "critical" : "high",
			confidence: context.mode === "PRIORITY" ? 0.93 : 0.88,
			summary: `Message contained a non-official link on ${hostname}.`,
			entityRefs: [hostname],
		})
	}

	if (hasText(payload.body, /otp|one-time|verify/i)) {
		detections.push({
			type: EVENT_TYPES.OTP_REQUEST_DETECTED,
			severity: "high",
			confidence: 0.82,
			summary: "Message asked the user to verify or enter an OTP.",
			entityRefs: [payload.sender],
		})
	}

	return detections
}

function analyzeBrowser(payload: BrowserPage, context: InferenceContext): Detection[] {
	const detections: Detection[] = []
	const official = isOfficialDomain(payload.hostname, context)
	const secrets = payload.formFields.map((field) => field.requestsSecret).filter((secret) => secret !== "none")

	if (!official) {
		detections.push({
			type: EVENT_TYPES.DOMAIN_MISMATCH_DETECTED,
			severity: "high",
			confidence: 0.9,
			summary: `${payload.hostname} does not match the official registry.`,
			entityRefs: [payload.hostname, payload.claimedBrand ?? "unknown-brand"],
		})
	}

	if (!official && (context.mode === "HEIGHTENED" || context.mode === "PRIORITY") && secrets.length > 0) {
		detections.push({
			type: EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED,
			severity: "critical",
			confidence: 0.94,
			summary: "Non-official page asked for card or OTP fields.",
			entityRefs: [payload.hostname, ...secrets],
		})
	}

	return detections
}

function analyzeDevice(payload: DeviceTelemetry): Detection[] {
	if (payload.kind === "screen_share_enabled") {
		return [
			{
				type: EVENT_TYPES.SCREEN_SHARE_ENABLED,
				severity: "high",
				confidence: 0.97,
				summary: "Screen sharing was enabled.",
				entityRefs: payload.appName ? [payload.appName] : [],
			},
		]
	}

	if (payload.kind === "remote_control_app_opened") {
		return [
			{
				type: EVENT_TYPES.REMOTE_CONTROL_DETECTED,
				severity: "critical",
				confidence: 0.96,
				summary: "A remote-control app was opened.",
				entityRefs: payload.appName ? [payload.appName] : [],
			},
		]
	}

	return []
}

function analyzeTransaction(payload: TransactionIntent): Detection[] {
	const detections: Detection[] = []
	if (payload.isNewBeneficiary) {
		detections.push({
			type: EVENT_TYPES.NEW_BENEFICIARY_DETECTED,
			severity: "medium",
			confidence: 0.89,
			summary: "Transfer targets a new beneficiary.",
			entityRefs: [payload.beneficiaryAccount],
		})
	}
	if (payload.amount >= 5_000) {
		detections.push({
			type: EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED,
			severity: "high",
			confidence: 0.87,
			summary: `High-value transfer of ${payload.currency} ${payload.amount}.`,
			entityRefs: [payload.beneficiaryAccount],
		})
	}
	if (!payload.reversible && (payload.isNewBeneficiary || payload.amount >= 1_000)) {
		detections.push({
			type: EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED,
			severity: "high",
			confidence: 0.85,
			summary: `${payload.paymentRail} payment is not reversible.`,
			entityRefs: [payload.paymentRail],
		})
	}
	return detections
}

function analyzeIdentity(payload: IdentityLookup, context: InferenceContext): Detection[] {
	const registry = context.registry
	if (!registry) {
		return []
	}

	if (payload.kind === "phone" && !registry.officialPhoneNumbers.includes(payload.value)) {
		return [
			{
				type: payload.claimedOrganization
					? EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH
					: EVENT_TYPES.UNVERIFIED_CONTACT_DETECTED,
				severity: "high",
				confidence: 0.92,
				summary: "Phone number is not in the trusted official registry.",
				entityRefs: [payload.value, payload.kind, payload.claimedOrganization].filter((item): item is string =>
					Boolean(item),
				),
			},
		]
	}

	if (payload.kind === "domain" && !registry.officialBankDomains.includes(payload.value)) {
		return [
			{
				type: EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
				severity: "high",
				confidence: 0.95,
				summary: "Domain is not an official bank domain.",
				entityRefs: [payload.value, payload.kind, payload.claimedOrganization].filter((item): item is string =>
					Boolean(item),
				),
			},
		]
	}

	if (payload.kind === "beneficiary" && !registry.knownPayees.some((payee) => payee.account === payload.value)) {
		return [
			{
				type: EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
				severity: "high",
				confidence: 0.9,
				summary: "Beneficiary is not a known official payee.",
				entityRefs: [payload.value, payload.kind, payload.claimedOrganization].filter((item): item is string =>
					Boolean(item),
				),
			},
		]
	}

	return []
}

export class MockInferenceProvider implements InferenceProvider {
	async analyze(
		input: AnalyzeInput,
		schema: typeof ANALYSIS_SCHEMA,
		context: InferenceContext,
	): Promise<AnalysisResult> {
		if (schema.name !== ANALYSIS_SCHEMA.name) {
			throw new Error("Mock provider only accepts the ScamMesh analysis schema")
		}

		let detections: Detection[] = []
		if (input.channel === "call" && "text" in input.payload) {
			detections = analyzeCall(input.payload as CallUtterance)
		} else if (input.channel === "message" && "links" in input.payload) {
			detections = analyzeMessage(input.payload as InboundMessage, context)
		} else if (input.channel === "browser" && "hostname" in input.payload) {
			detections = analyzeBrowser(input.payload as BrowserPage, context)
		} else if (input.channel === "device" && "kind" in input.payload) {
			detections = analyzeDevice(input.payload as DeviceTelemetry)
		} else if (input.channel === "transaction" && "beneficiaryAccount" in input.payload) {
			detections = analyzeTransaction(input.payload as TransactionIntent)
		} else if (input.channel === "identity" && "value" in input.payload) {
			detections = analyzeIdentity(input.payload as IdentityLookup, context)
		}

		return validateAnalysisResult({
			detections,
			provider: "mock",
			usedFallback: false,
		})
	}
}
