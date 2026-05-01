import type { NodeConfig, NodeMetrics } from '$lib/types';
import { findPeer, getTailscaleStatus } from './tailscale';

/**
 * Real metrics source.
 *
 * - Online state, last-seen and net counters come from `tailscale status --json`.
 * - CPU / RAM / disk / uptime are intentionally `null` until a per-node metrics
 *   agent (Glances, node_exporter, etc.) is configured. We deliberately do NOT
 *   fabricate values — a null is honest, a fake bar is a lie.
 */

export async function getNodeMetrics(node: NodeConfig): Promise<NodeMetrics> {
	const ts = await getTailscaleStatus();
	const peer = findPeer(ts, { tailscaleName: node.tailscaleName, host: node.host });

	const online = peer?.online ?? false;
	const lastSeen = peer?.lastSeen ? Date.parse(peer.lastSeen) : null;

	return {
		id: node.id,
		online,
		lastSeenAt: Number.isFinite(lastSeen) ? lastSeen : null,
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
		// session-cumulative bytes from Tailscale — not a rate, but real
		txBytesTotal: peer?.txBytes ?? null,
		rxBytesTotal: peer?.rxBytes ?? null,
		os: peer?.os ?? null,
		updatedAt: Date.now()
	};
}
