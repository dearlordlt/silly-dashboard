import type { NodeConfig, NodeMetrics } from '$lib/types';

/**
 * Metrics source abstraction.
 *
 * The default implementation generates plausible mock data so we can build
 * the UI before we wire up real metric agents. To switch to a real source
 * (Glances, node_exporter, etc.), swap in another module that exposes the
 * same `getMetrics` shape.
 */

interface MockState {
	cpu: number;
	memUsedPct: number;
	netRx: number;
	netTx: number;
	diskUsedPct: number;
	bootedAt: number;
}

const memTotalByRole: Record<NodeConfig['role'], number> = {
	server: 32 * 1024 ** 3,
	desktop: 64 * 1024 ** 3,
	vps: 4 * 1024 ** 3,
	rpi: 4 * 1024 ** 3,
	mobile: 8 * 1024 ** 3
};

const diskTotalByRole: Record<NodeConfig['role'], number> = {
	server: 8 * 1024 ** 4,
	desktop: 2 * 1024 ** 4,
	vps: 80 * 1024 ** 3,
	rpi: 256 * 1024 ** 3,
	mobile: 256 * 1024 ** 3
};

const state = new Map<string, MockState>();

function init(node: NodeConfig): MockState {
	const existing = state.get(node.id);
	if (existing) return existing;
	const fresh: MockState = {
		cpu: 10 + Math.random() * 30,
		memUsedPct: 30 + Math.random() * 30,
		netRx: Math.random() * 5_000_000,
		netTx: Math.random() * 1_000_000,
		diskUsedPct: 40 + Math.random() * 40,
		bootedAt: Date.now() - Math.floor(Math.random() * 14 * 86400_000)
	};
	state.set(node.id, fresh);
	return fresh;
}

function drift(value: number, min: number, max: number, jitter: number): number {
	const next = value + (Math.random() - 0.5) * jitter;
	return Math.max(min, Math.min(max, next));
}

export async function getMetrics(node: NodeConfig): Promise<NodeMetrics> {
	const now = Date.now();

	if (!node.hasMetrics) {
		// Presence-only nodes (e.g. mobile): we can't read system stats from
		// a phone via Tailscale, so we just say "online" if they're reachable.
		// For now, hard-mock as online.
		return {
			id: node.id,
			online: true,
			uptime: null,
			cpu: null,
			memTotal: null,
			memUsed: null,
			diskTotal: null,
			diskUsed: null,
			netRx: null,
			netTx: null,
			loadAvg: null,
			tempC: null,
			updatedAt: now
		};
	}

	const s = init(node);
	s.cpu = drift(s.cpu, 2, 95, 12);
	s.memUsedPct = drift(s.memUsedPct, 15, 92, 3);
	s.diskUsedPct = drift(s.diskUsedPct, 20, 95, 0.05);
	s.netRx = drift(s.netRx, 0, 50_000_000, 2_000_000);
	s.netTx = drift(s.netTx, 0, 20_000_000, 800_000);

	const memTotal = memTotalByRole[node.role];
	const diskTotal = diskTotalByRole[node.role];

	return {
		id: node.id,
		online: true,
		uptime: Math.floor((now - s.bootedAt) / 1000),
		cpu: s.cpu,
		memTotal,
		memUsed: Math.floor((s.memUsedPct / 100) * memTotal),
		diskTotal,
		diskUsed: Math.floor((s.diskUsedPct / 100) * diskTotal),
		netRx: s.netRx,
		netTx: s.netTx,
		loadAvg: [
			+(s.cpu / 50).toFixed(2),
			+(s.cpu / 60).toFixed(2),
			+(s.cpu / 80).toFixed(2)
		],
		tempC: node.role === 'rpi' ? 50 + Math.random() * 10 : null,
		updatedAt: now
	};
}
