export type Pt = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }
export type CanvasSize = { w: number; h: number }
export type LinkGroup = "top" | "bottom" | "left" | "right" | "cross"

export type MeshStroke = {
	d: string
	from: Pt
	to: Pt
	mx: number
	my: number
}

export function center(box: Box): Pt {
	return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

export function dock(box: Box, side: "n" | "s" | "e" | "w", along = 0.5): Pt {
	const t = clamp(along, 0.28, 0.72)
	if (side === "n") {
		return { x: box.x + box.w * t, y: box.y }
	}
	if (side === "s") {
		return { x: box.x + box.w * t, y: box.y + box.h }
	}
	if (side === "e") {
		return { x: box.x + box.w, y: box.y + box.h * t }
	}
	return { x: box.x, y: box.y + box.h * t }
}

export function edgePoint(box: Box, toward: Pt, inset = 0): Pt {
	const c = center(box)
	const dx = toward.x - c.x
	const dy = toward.y - c.y
	const hw = Math.max(box.w / 2, 1)
	const hh = Math.max(box.h / 2, 1)
	const sx = Math.abs(dx) < 0.001 ? Number.POSITIVE_INFINITY : hw / Math.abs(dx)
	const sy = Math.abs(dy) < 0.001 ? Number.POSITIVE_INFINITY : hh / Math.abs(dy)
	const t = Math.min(sx, sy)
	const ex = c.x + dx * t
	const ey = c.y + dy * t
	const len = Math.hypot(dx, dy) || 1
	return { x: ex + (dx / len) * inset, y: ey + (dy / len) * inset }
}

export function segmentsIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
	const cross = (p: Pt, q: Pt, r: Pt) => (r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)
	const d1 = cross(a, b, c)
	const d2 = cross(a, b, d)
	const d3 = cross(c, d, a)
	const d4 = cross(c, d, b)
	return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

export function segmentHitsBox(a: Pt, b: Pt, box: Box, pad = 10): boolean {
	const x0 = box.x - pad
	const y0 = box.y - pad
	const x1 = box.x + box.w + pad
	const y1 = box.y + box.h + pad
	const inside = (p: Pt) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1
	if (inside(a) || inside(b)) {
		return true
	}
	const tl = { x: x0, y: y0 }
	const tr = { x: x1, y: y0 }
	const br = { x: x1, y: y1 }
	const bl = { x: x0, y: y1 }
	return (
		segmentsIntersect(a, b, tl, tr) || segmentsIntersect(a, b, tr, br) || segmentsIntersect(a, b, br, bl) || segmentsIntersect(a, b, bl, tl)
	)
}

export function pathClearsBox(from: Pt, vias: Pt[], to: Pt, box: Box, pad = 8): boolean {
	const points = [from, ...vias, to]
	for (let index = 0; index < points.length - 1; index += 1) {
		if (segmentHitsBox(points[index], points[index + 1], box, pad)) {
			return false
		}
	}
	return true
}

export function classifyLink(source: Box, target: Box, receipt: Box | null): LinkGroup {
	if (!receipt) {
		const sc = center(source)
		const tc = center(target)
		if (Math.abs(sc.x - tc.x) > Math.abs(sc.y - tc.y)) {
			return sc.y + tc.y < 400 ? "top" : "bottom"
		}
		return sc.x + tc.x < 400 ? "left" : "right"
	}
	const sc = center(source)
	const tc = center(target)
	if (Math.max(sc.x, tc.x) < receipt.x + 12) {
		return "left"
	}
	if (Math.min(sc.x, tc.x) > receipt.x + receipt.w - 12) {
		return "right"
	}
	if (Math.max(sc.y, tc.y) < receipt.y + 12) {
		return "top"
	}
	if (Math.min(sc.y, tc.y) > receipt.y + receipt.h - 12) {
		return "bottom"
	}
	return "cross"
}

export function detourPoint(from: Pt, to: Pt, box: Box, pad = 28, canvas?: CanvasSize): Pt {
	return routeWaypoints(from, to, box, pad, canvas)[0] ?? { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
}

export function routeWaypoints(from: Pt, to: Pt, box: Box, pad = 28, canvas?: CanvasSize, lane = 0): Pt[] {
	const goTop = lane % 2 === 0
	const spread = pad + Math.floor(lane / 2) * 16
	const y = goTop ? Math.max(16, box.y - spread) : Math.min((canvas?.h ?? box.y + box.h + spread * 2) - 16, box.y + box.h + spread)
	return uniquePoints([
		{ x: from.x, y },
		{ x: to.x, y },
	])
}

export function curvePath(from: Pt, to: Pt, vias: Pt[] = [], avoid: Box | null = null): string {
	if (vias.length === 0) {
		return bowed(from, to, avoid, 10)
	}
	if (vias.length === 1) {
		return `${pt(from, "M")} ${pt(vias[0], "Q")} ${pt(to)}`
	}
	return `${pt(from, "M")} C ${pair(vias[0])}, ${pair(vias[1])}, ${pair(to)}`
}

export function linkStroke(source: Box, target: Box, receipt: Box | null = null, canvas?: CanvasSize, lane = 0): MeshStroke {
	const group = classifyLink(source, target, receipt)
	return strokeForGroup(source, target, receipt, canvas, group, lane)
}

export function layoutMesh(
	links: Array<{ id: string; source: Box; target: Box }>,
	receipt: Box | null,
	canvas?: CanvasSize,
): Record<string, MeshStroke> {
	const buckets: Record<LinkGroup, typeof links> = {
		top: [],
		bottom: [],
		left: [],
		right: [],
		cross: [],
	}
	for (const link of links) {
		buckets[classifyLink(link.source, link.target, receipt)].push(link)
	}
	const strokes: Record<string, MeshStroke> = {}
	for (const group of Object.keys(buckets) as LinkGroup[]) {
		buckets[group].forEach((link, lane) => {
			strokes[link.id] = strokeForGroup(link.source, link.target, receipt, canvas, group, lane)
		})
	}
	return strokes
}

function strokeForGroup(source: Box, target: Box, receipt: Box | null, canvas: CanvasSize | undefined, group: LinkGroup, lane: number): MeshStroke {
	const along = 0.38 + lane * 0.12
	if (group === "left" || group === "right") {
		const side = group === "left" ? "w" : "e"
		const from = dock(source, side, along)
		const to = dock(target, side, along)
		const bow = 16 + lane * 14
		const mid = {
			x: (from.x + to.x) / 2 + (group === "left" ? -bow : bow),
			y: (from.y + to.y) / 2,
		}
		const label = offsetLabel(from, to, mid, receipt, group === "left" ? -1 : 1)
		return { d: `${pt(from, "M")} ${pt(mid, "Q")} ${pt(to)}`, from, to, mx: label.x, my: label.y }
	}
	if (group === "top" || group === "bottom") {
		const side = group === "top" ? "n" : "s"
		const from = dock(source, side, along)
		const to = dock(target, side, along)
		const bow = 12 + lane * 10
		const mid = {
			x: (from.x + to.x) / 2,
			y: (from.y + to.y) / 2 + (group === "top" ? -bow : bow),
		}
		const label = offsetLabel(from, to, mid, receipt, group === "top" ? -1 : 1)
		return { d: `${pt(from, "M")} ${pt(mid, "Q")} ${pt(to)}`, from, to, mx: label.x, my: label.y }
	}

	const goTop = lane % 2 === 0
	const spread = 26 + Math.floor(lane / 2) * 16
	const from = dock(source, goTop ? "n" : "s", along)
	const to = dock(target, goTop ? "n" : "s", along)
	const railY = goTop
		? Math.max(18, (receipt?.y ?? Math.min(from.y, to.y)) - spread)
		: Math.min((canvas?.h ?? 800) - 18, (receipt ? receipt.y + receipt.h : Math.max(from.y, to.y)) + spread)
	const cp1 = { x: from.x, y: railY }
	const cp2 = { x: to.x, y: railY }
	const label = offsetLabel(cp1, cp2, { x: (cp1.x + cp2.x) / 2, y: railY }, receipt, goTop ? -1 : 1)
	return {
		d: `${pt(from, "M")} C ${pair(cp1)}, ${pair(cp2)}, ${pair(to)}`,
		from,
		to,
		mx: label.x,
		my: label.y,
	}
}

function offsetLabel(from: Pt, to: Pt, along: Pt, receipt: Box | null, prefer: number): Pt {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const len = Math.hypot(dx, dy) || 1
	let nx = (-dy / len) * 18
	let ny = (dx / len) * 18
	if (prefer < 0 && ny > 0) {
		nx = -nx
		ny = -ny
	}
	if (prefer > 0 && ny < 0 && Math.abs(dx) > Math.abs(dy)) {
		nx = -nx
		ny = -ny
	}
	let point = { x: along.x + nx, y: along.y + ny }
	if (receipt && pointInBox(point, receipt, 12)) {
		point = { x: along.x - nx, y: along.y - ny }
	}
	return point
}

function bowed(from: Pt, to: Pt, avoid: Box | null, bow: number): string {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const len = Math.hypot(dx, dy) || 1
	let nx = -dy / len
	let ny = dx / len
	if (avoid) {
		const mx = (from.x + to.x) / 2
		const my = (from.y + to.y) / 2
		const acx = avoid.x + avoid.w / 2
		const acy = avoid.y + avoid.h / 2
		const toward = (mx + nx - acx) ** 2 + (my + ny - acy) ** 2
		const away = (mx - nx - acx) ** 2 + (my - ny - acy) ** 2
		if (toward < away) {
			nx = -nx
			ny = -ny
		}
	}
	return `${pt(from, "M")} ${pt({ x: (from.x + to.x) / 2 + nx * bow, y: (from.y + to.y) / 2 + ny * bow }, "Q")} ${pt(to)}`
}

function pointInBox(point: Pt, box: Box, pad = 0): boolean {
	return point.x >= box.x - pad && point.x <= box.x + box.w + pad && point.y >= box.y - pad && point.y <= box.y + box.h + pad
}

function uniquePoints(points: Pt[]): Pt[] {
	const seen = new Set<string>()
	return points.filter((point) => {
		const key = `${round(point.x)}:${round(point.y)}`
		if (seen.has(key)) {
			return false
		}
		seen.add(key)
		return true
	})
}

function pt(point: Pt, command = ""): string {
	const pairText = pair(point)
	return command ? `${command} ${pairText}` : pairText
}

function pair(point: Pt): string {
	return `${round(point.x)} ${round(point.y)}`
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function round(value: number): number {
	return Math.round(value * 10) / 10
}
