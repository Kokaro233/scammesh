import { EVENT_TYPES } from "../../runtime/events"
import type { Channel, CorrelationEdge, SessionState } from "../../shared/types"

export const GRAPH_NODE_IDS = [
	"victim",
	"call",
	"message",
	"website",
	"device",
	"transaction",
	"claimedBank",
	"officialBank",
] as const

export type GraphNodeId = (typeof GRAPH_NODE_IDS)[number]

export interface GraphNode {
	id: GraphNodeId
	label: string
	x: number
	y: number
	active: boolean
}

export interface GraphEdge {
	edgeId: string
	from: GraphNodeId
	to: GraphNodeId
	label: string
}

export interface ScamGraphView {
	nodes: GraphNode[]
	edges: GraphEdge[]
	highlightChain: boolean
}

const NODE_LAYOUT: Record<GraphNodeId, { label: string; x: number; y: number }> = {
	victim: { label: "Victim", x: 70, y: 190 },
	call: { label: "Call", x: 240, y: 70 },
	message: { label: "Message", x: 240, y: 190 },
	website: { label: "Website", x: 240, y: 310 },
	device: { label: "Device", x: 430, y: 90 },
	transaction: { label: "Transaction", x: 430, y: 290 },
	claimedBank: { label: "Claimed Bank", x: 640, y: 90 },
	officialBank: { label: "Official Bank", x: 640, y: 290 },
}

const CHANNEL_TO_NODE: Record<Channel, GraphNodeId> = {
	call: "call",
	message: "message",
	browser: "website",
	device: "device",
	transaction: "transaction",
	identity: "claimedBank",
}

export function nodeIdForChannel(channel: Channel): GraphNodeId {
	return CHANNEL_TO_NODE[channel]
}

function uniqueEdges(edges: GraphEdge[]) {
	const seen = new Set<string>()
	return edges.filter((edge) => {
		const key = `${edge.from}:${edge.to}:${edge.label}`
		if (seen.has(key)) {
			return false
		}
		seen.add(key)
		return true
	})
}

export function buildScamGraph(session: SessionState): ScamGraphView {
	const activeChannels = new Set(session.events.map((event) => event.channel))
	const claimed = session.events.some(
		(event) =>
			event.type === EVENT_TYPES.IMPERSONATION_CLAIMED ||
			event.type === EVENT_TYPES.DOMAIN_MISMATCH_DETECTED ||
			event.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
	)
	const officialChecked = session.events.some((event) => event.channel === "identity")
	const victimActive = ["call", "message", "browser", "device", "transaction"].some((channel) =>
		activeChannels.has(channel as Channel),
	)

	const nodes: GraphNode[] = GRAPH_NODE_IDS.map((id) => {
		const active =
			id === "victim"
				? victimActive
				: id === "officialBank"
					? officialChecked
					: id === "claimedBank"
						? claimed
						: [...activeChannels].some((channel) => CHANNEL_TO_NODE[channel] === id)
		return { id, ...NODE_LAYOUT[id], active }
	})

	const edges = uniqueEdges(
		session.correlations.map((edge: CorrelationEdge) => ({
			edgeId: edge.edgeId,
			from: nodeIdForChannel(edge.fromChannel),
			to: nodeIdForChannel(edge.toChannel),
			label: edge.label,
		})),
	)

	return {
		nodes,
		edges,
		highlightChain: session.events.some((event) => event.type === EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED),
	}
}
