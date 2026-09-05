import { CHECK_MODES, SEVERITIES, type CheckMode, type Severity } from "../shared/types"
import { EVENT_TYPE_VALUES, isSemanticEventType, type SemanticEventType } from "../runtime/events"

export interface Detection {
	type: SemanticEventType
	severity: Severity
	confidence: number
	summary: string
	entityRefs: string[]
}

export interface AnalysisResult {
	detections: Detection[]
	proposedModeChange?: CheckMode
	provider: "mock" | "llm"
	usedFallback: boolean
}

export const ANALYSIS_SCHEMA = {
	name: "scammesh-analysis",
	strict: true,
	schema: {
		type: "object",
		additionalProperties: false,
		required: ["detections"],
		properties: {
			detections: {
				type: "array",
				items: {
					type: "object",
					additionalProperties: false,
					required: ["type", "severity", "confidence", "summary", "entityRefs"],
					properties: {
						type: { type: "string", enum: [...EVENT_TYPE_VALUES] },
						severity: { type: "string", enum: [...SEVERITIES] },
						confidence: { type: "number" },
						summary: { type: "string" },
						entityRefs: { type: "array", items: { type: "string" } },
					},
				},
			},
			proposedModeChange: { type: "string", enum: [...CHECK_MODES] },
		},
	},
} as const

export function validateAnalysisResult(value: unknown): AnalysisResult {
	if (!value || typeof value !== "object") {
		throw new Error("Analysis result must be an object")
	}

	const record = value as Partial<AnalysisResult> & { detections?: unknown }
	if (!Array.isArray(record.detections)) {
		throw new Error("Analysis result.detections must be an array")
	}

	const detections = record.detections.map((item, index) => {
		if (!item || typeof item !== "object") {
			throw new Error(`Detection ${index} must be an object`)
		}

		const detection = item as Partial<Detection>
		if (!detection.type || !isSemanticEventType(detection.type)) {
			throw new Error(`Detection ${index} has an unknown type`)
		}
		if (!detection.severity || !SEVERITIES.includes(detection.severity)) {
			throw new Error(`Detection ${index} has an invalid severity`)
		}
		if (typeof detection.confidence !== "number" || detection.confidence < 0 || detection.confidence > 1) {
			throw new Error(`Detection ${index} confidence must be between 0 and 1`)
		}
		if (typeof detection.summary !== "string" || detection.summary.length === 0) {
			throw new Error(`Detection ${index} needs a summary`)
		}
		if (!Array.isArray(detection.entityRefs) || detection.entityRefs.some((ref) => typeof ref !== "string")) {
			throw new Error(`Detection ${index} entityRefs must be string[]`)
		}

		return {
			type: detection.type,
			severity: detection.severity,
			confidence: detection.confidence,
			summary: detection.summary,
			entityRefs: [...detection.entityRefs].sort(),
		}
	})

	detections.sort((left, right) => left.type.localeCompare(right.type) || left.summary.localeCompare(right.summary))

	if (record.proposedModeChange && !CHECK_MODES.includes(record.proposedModeChange)) {
		throw new Error("proposedModeChange is not a valid check mode")
	}

	return {
		detections,
		proposedModeChange: record.proposedModeChange,
		provider: record.provider === "llm" ? "llm" : "mock",
		usedFallback: Boolean(record.usedFallback),
	}
}
