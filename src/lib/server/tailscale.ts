import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface TSPeer {
	hostName: string;
	dnsName: string;
	tailscaleIPs: string[];
	os: string;
	online: boolean;
	lastSeen: string | null;
	rxBytes: number;
	txBytes: number;
}

export interface TSStatus {
	self: TSPeer | null;
	peers: TSPeer[];
	fetchedAt: number;
}

interface RawPeer {
	HostName?: string;
	DNSName?: string;
	TailscaleIPs?: string[];
	OS?: string;
	Online?: boolean;
	LastSeen?: string;
	RxBytes?: number;
	TxBytes?: number;
}

interface RawStatus {
	Self?: RawPeer;
	Peer?: Record<string, RawPeer>;
}

function mapPeer(p: RawPeer): TSPeer {
	const lastSeen = p.LastSeen && !p.LastSeen.startsWith('0001-') ? p.LastSeen : null;
	return {
		hostName: p.HostName ?? '',
		dnsName: (p.DNSName ?? '').replace(/\.$/, ''),
		tailscaleIPs: p.TailscaleIPs ?? [],
		os: p.OS ?? '',
		online: !!p.Online,
		lastSeen,
		rxBytes: p.RxBytes ?? 0,
		txBytes: p.TxBytes ?? 0
	};
}

const TTL_MS = 8000;
let cache: TSStatus | null = null;
let inflight: Promise<TSStatus> | null = null;

async function loadStatus(): Promise<TSStatus> {
	try {
		const { stdout } = await exec('tailscale', ['status', '--json'], {
			timeout: 5000,
			maxBuffer: 4 * 1024 * 1024
		});
		const raw = JSON.parse(stdout) as RawStatus;
		const peers = raw.Peer ? Object.values(raw.Peer).map(mapPeer) : [];
		const self = raw.Self ? mapPeer(raw.Self) : null;
		return { self, peers, fetchedAt: Date.now() };
	} catch (err) {
		console.error('[tailscale] status failed:', (err as Error).message);
		return { self: null, peers: [], fetchedAt: Date.now() };
	}
}

export async function getTailscaleStatus(): Promise<TSStatus> {
	if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
	if (inflight) return inflight;
	inflight = loadStatus().then((s) => {
		cache = s;
		inflight = null;
		return s;
	});
	return inflight;
}

/**
 * Find the Tailscale peer (or self) corresponding to a configured node.
 * Match by tailscaleName (case-insensitive) first, then by IP.
 */
export function findPeer(
	status: TSStatus,
	identifiers: { tailscaleName?: string; host?: string }
): TSPeer | null {
	const all = status.self ? [status.self, ...status.peers] : status.peers;
	const name = identifiers.tailscaleName?.toLowerCase();
	const host = identifiers.host?.toLowerCase();
	for (const p of all) {
		if (name && p.hostName.toLowerCase() === name) return p;
	}
	for (const p of all) {
		if (host && p.tailscaleIPs.some((ip) => ip.toLowerCase() === host)) return p;
	}
	for (const p of all) {
		if (host && p.dnsName.toLowerCase().startsWith(host)) return p;
	}
	return null;
}
