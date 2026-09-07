import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { MESH_NOTE } from "../../store/channels"
import type { SignalConnection, UiChannel } from "../../store/types"
import { UI_CHANNELS } from "../../store/types"
import { layoutMesh, type Box } from "./meshGeometry"

function unionBox(a: Box | null, b: Box | null): Box | null {
	if (!a) return b
	if (!b) return a
	const x = Math.min(a.x, b.x)
	const y = Math.min(a.y, b.y)
	return {
		x,
		y,
		w: Math.max(a.x + a.w, b.x + b.w) - x,
		h: Math.max(a.y + a.h, b.y + b.h) - y,
	}
}

type DeskBoxes = {
	w: number
	h: number
	receipt: Box | null
	channels: Partial<Record<UiChannel, Box>>
}

export function SignalMesh({ connections }: { connections: SignalConnection[] }) {
	const layerRef = useRef<HTMLDivElement>(null)
	const [desk, setDesk] = useState<DeskBoxes | null>(null)
	const latestId = connections[connections.length - 1]?.id

	useLayoutEffect(() => {
		const canvas = layerRef.current?.parentElement
		if (!canvas) {
			return
		}

		const measure = () => {
			const canvasRect = canvas.getBoundingClientRect()
			const w = canvas.clientWidth
			const h = canvas.clientHeight
			const boxOf = (el: HTMLElement): Box => {
				const rect = el.getBoundingClientRect()
				return {
					x: rect.left - canvasRect.left,
					y: rect.top - canvasRect.top,
					w: rect.width,
					h: rect.height,
				}
			}
			const channels: Partial<Record<UiChannel, Box>> = {}
			for (const channel of UI_CHANNELS) {
				const node = canvas.querySelector(`.desk-node-${channel}`)
				if (!(node instanceof HTMLElement)) {
					continue
				}
				const slip = node.firstElementChild instanceof HTMLElement ? node.firstElementChild : node
				channels[channel] = boxOf(slip)
			}
			const receiptNode = canvas.querySelector(".desk-receipt")
			const receiptEl =
				receiptNode instanceof HTMLElement
					? receiptNode.firstElementChild instanceof HTMLElement
						? receiptNode.firstElementChild
						: receiptNode
					: null
			const measured = receiptEl ? boxOf(receiptEl) : null
			const laidOut = receiptEl
				? {
						x: w * 0.5 - receiptEl.offsetWidth / 2,
						y: h * 0.5 - receiptEl.offsetHeight / 2,
						w: receiptEl.offsetWidth,
						h: receiptEl.offsetHeight,
					}
				: null
			setDesk({
				w,
				h,
				receipt: unionBox(measured, laidOut),
				channels,
			})
		}

		measure()
		const observer = new ResizeObserver(measure)
		observer.observe(canvas)
		for (const node of canvas.querySelectorAll(".desk-node, .desk-receipt")) {
			observer.observe(node)
		}
		return () => observer.disconnect()
	}, [])

	const strokes = useMemo(() => {
		if (!desk) {
			return {}
		}
		const links = connections.flatMap((connection) => {
			const source = desk.channels[connection.source]
			const target = desk.channels[connection.target]
			return source && target ? [{ id: connection.id, source, target }] : []
		})
		return layoutMesh(links, desk.receipt, desk)
	}, [connections, desk])

	const latestStroke = latestId ? strokes[latestId] : null

	return (
		<div className="signal-mesh-layer" ref={layerRef}>
			{desk && connections.length > 0 ? (
				<svg className="signal-mesh" width={desk.w} height={desk.h} viewBox={`0 0 ${desk.w} ${desk.h}`}>
					{connections.map((connection) => {
						const stroke = strokes[connection.id]
						if (!stroke) {
							return null
						}
						return (
							<g key={connection.id} className={connection.id === latestId ? "mesh-link is-latest" : "mesh-link is-quiet"}>
								<path className="mesh-line" d={stroke.d} />
								<circle className="mesh-dot" cx={stroke.from.x} cy={stroke.from.y} r="2.2" />
								<circle className="mesh-dot" cx={stroke.to.x} cy={stroke.to.y} r="2.2" />
							</g>
						)
					})}
				</svg>
			) : null}
			{latestStroke && latestId && MESH_NOTE[latestId] ? (
				<p className="mesh-label" style={{ left: latestStroke.mx, top: latestStroke.my }}>
					{MESH_NOTE[latestId]}
				</p>
			) : null}
		</div>
	)
}
