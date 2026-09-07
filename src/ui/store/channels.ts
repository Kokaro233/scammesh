import { Phone, MessageCircle, Globe, Smartphone, UserCheck, CreditCard, type LucideIcon } from "lucide-react"
import type { HistoryRisk, RiskLevel, SignalRisk, UiChannel } from "./types"

export const CHANNEL_NO: Record<UiChannel, string> = {
	call: "01",
	message: "02",
	browser: "03",
	device: "04",
	identity: "05",
	payment: "06",
}

export const CHANNEL_LABEL: Record<UiChannel, string> = {
	call: "Call",
	message: "Message",
	browser: "Browser",
	device: "Device",
	identity: "Identity",
	payment: "Payment",
}

export const CHANNEL_FILTER_LABEL: Record<UiChannel, string> = {
	call: "Calls",
	message: "Messages",
	browser: "Browser",
	device: "Device",
	identity: "Identity",
	payment: "Payments",
}

export const CHANNEL_ICON: Record<UiChannel, LucideIcon> = {
	call: Phone,
	message: MessageCircle,
	browser: Globe,
	device: Smartphone,
	identity: UserCheck,
	payment: CreditCard,
}

export const CHANNEL_LAYOUT: Record<UiChannel, { x: number; y: number; rotate: number }> = {
	call: { x: 17, y: 14, rotate: -0.4 },
	message: { x: 83, y: 14, rotate: 0.3 },
	browser: { x: 15, y: 50, rotate: 0.5 },
	device: { x: 85, y: 50, rotate: -0.4 },
	identity: { x: 17, y: 86, rotate: 0.3 },
	payment: { x: 83, y: 86, rotate: -0.5 },
}

export const RECEIPT_LAYOUT = { x: 50, y: 50 }

export const MESH_NOTE: Record<string, string> = {
	"link-call-message": "same window",
	"link-message-browser": "same domain",
	"link-browser-identity": "domain mismatch",
	"link-device-payment": "screen share",
}

export function riskLabel(level: RiskLevel): string {
	if (level === "normal") return "LOW"
	if (level === "watch") return "WATCH"
	if (level === "review") return "HIGH"
	return "HIGH RISK"
}

export function signalRiskLabel(risk: SignalRisk | HistoryRisk): string {
	if (risk === "low" || risk === "safe") return "Safe"
	if (risk === "review") return "Review"
	return "High"
}
