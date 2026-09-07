const ink = "#7e949c"

export function SecurityPaper() {
	return (
		<div className="app-paper" aria-hidden="true">
			<svg className="app-paper-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
				<defs>
					<filter id="paper-fiber" x="0" y="0" width="100%" height="100%">
						<feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" stitchTiles="stitch" result="n" />
						<feColorMatrix type="saturate" values="0" in="n" />
						<feComponentTransfer>
							<feFuncA type="table" tableValues="0 0.5" />
						</feComponentTransfer>
					</filter>
					<linearGradient id="paper-field" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="#ece8df" />
						<stop offset="38%" stopColor="#f4f1ea" />
						<stop offset="100%" stopColor="#e8ecec" />
					</linearGradient>
					<radialGradient id="paper-wash" cx="58%" cy="42%" r="68%">
						<stop offset="0%" stopColor="#f4f1ea" stopOpacity="0.72" />
						<stop offset="52%" stopColor="#f4f1ea" stopOpacity="0.38" />
						<stop offset="100%" stopColor="#f4f1ea" stopOpacity="0" />
					</radialGradient>
					<radialGradient id="edge-mask" cx="56%" cy="44%" r="66%">
						<stop offset="0%" stopColor="#fff" stopOpacity="0" />
						<stop offset="62%" stopColor="#fff" stopOpacity="0.12" />
						<stop offset="100%" stopColor="#fff" stopOpacity="1" />
					</radialGradient>
					<mask id="paper-edge">
						<rect width="1600" height="1000" fill="url(#edge-mask)" />
					</mask>
					<pattern id="register-lines" width="1600" height="12" patternUnits="userSpaceOnUse">
						<path d="M0 12 H1600" stroke={ink} strokeWidth="0.35" opacity="0.4" />
					</pattern>
				</defs>

				<rect width="1600" height="1000" fill="url(#paper-field)" />
				<rect width="1600" height="1000" filter="url(#paper-fiber)" opacity="0.08" />
				<rect width="1600" height="1000" fill="url(#register-lines)" mask="url(#paper-edge)" opacity="0.7" />

				<g fill="none" stroke={ink} mask="url(#paper-edge)">
					<g strokeWidth="0.6" opacity="0.46">
						<WaveBand y={36} amp={11} />
						<WaveBand y={52} amp={9} phase={40} />
						<WaveBand y={68} amp={10} phase={18} />
						<WaveBand y={932} amp={11} />
						<WaveBand y={948} amp={9} phase={40} />
						<WaveBand y={964} amp={10} phase={18} />
					</g>
					<g strokeWidth="0.45" opacity="0.26">
						<SideWave x={38} />
						<SideWave x={52} phase={22} />
						<SideWave x={1548} />
						<SideWave x={1562} phase={22} />
					</g>
				</g>

				<g fill="none" stroke={ink} strokeWidth="0.5" opacity="0.42" mask="url(#paper-edge)">
					<g transform="translate(96 88)">
						<Rosette radius={82} />
					</g>
					<g transform="translate(1510 96)">
						<Rosette radius={70} />
					</g>
					<g transform="translate(108 910)">
						<Rosette radius={64} />
					</g>
					<g transform="translate(1496 888)">
						<Rosette radius={96} />
					</g>
				</g>

				<g fill="none" stroke={ink} strokeWidth="0.55" opacity="0.22" mask="url(#paper-edge)">
					<Hatch x={22} y={210} />
					<Hatch x={22} y={460} />
					<Hatch x={22} y={710} />
					<Hatch x={1560} y={190} />
					<Hatch x={1560} y={440} />
					<Hatch x={1560} y={690} />
				</g>

				<g fill="none" stroke={ink} strokeWidth="0.7" opacity="0.22">
					<Crop x={18} y={16} />
					<Crop x={1582} y={16} flip />
					<Crop x={18} y={984} down />
					<Crop x={1582} y={984} flip down />
				</g>

				<rect width="1600" height="1000" fill="url(#paper-wash)" />
			</svg>
		</div>
	)
}

function Rosette({ radius }: { radius: number }) {
	const rings = [1, 0.78, 0.58, 0.4, 0.22]
	const angles = [0, 15, 30, 45, 60, 75]
	return (
		<>
			{rings.map((scale) => (
				<circle key={scale} r={radius * scale} />
			))}
			{angles.map((deg) => (
				<ellipse key={deg} rx={radius} ry={radius * 0.36} transform={`rotate(${deg})`} />
			))}
		</>
	)
}

function WaveBand({ y, amp, phase = 0 }: { y: number; amp: number; phase?: number }) {
	return <path d={sine(0 + phase, y, 1600, amp, 220)} />
}

function SideWave({ x, phase = 0 }: { x: number; phase?: number }) {
	return <path d={sineVertical(x, 0 + phase, 1000, 14, 180)} />
}

function Hatch({ x, y }: { x: number; y: number }) {
	return (
		<g>
			{Array.from({ length: 9 }, (_, index) => (
				<line key={index} x1={x} y1={y + index * 3.4} x2={x + 16} y2={y + 9 + index * 3.4} />
			))}
		</g>
	)
}

function Crop({ x, y, flip = false, down = false }: { x: number; y: number; flip?: boolean; down?: boolean }) {
	const hx = flip ? -14 : 14
	const vy = down ? -14 : 14
	return (
		<g>
			<path d={`M${x} ${y} h${hx}`} />
			<path d={`M${x} ${y} v${vy}`} />
		</g>
	)
}

function sine(startX: number, y: number, width: number, amp: number, period: number): string {
	const step = period / 2
	let d = `M ${startX} ${y}`
	for (let x = startX; x < startX + width + step; x += step) {
		const peak = ((x - startX) / step) % 2 === 0 ? y - amp : y + amp
		d += ` Q ${x + step / 2} ${peak} ${x + step} ${y}`
	}
	return d
}

function sineVertical(x: number, startY: number, height: number, amp: number, period: number): string {
	const step = period / 2
	let d = `M ${x} ${startY}`
	for (let y = startY; y < startY + height + step; y += step) {
		const peak = ((y - startY) / step) % 2 === 0 ? x - amp : x + amp
		d += ` Q ${peak} ${y + step / 2} ${x} ${y + step}`
	}
	return d
}
