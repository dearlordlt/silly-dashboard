export type NodeRole = 'server' | 'desktop' | 'vps' | 'rpi' | 'mobile';

export interface NodeConfig {
	id: string;
	name: string;
	role: NodeRole;
	/** Tailscale IP or MagicDNS hostname — used by metrics adapter to reach the agent */
	host: string;
	/** The node's Tailscale machine name (for display) */
	tailscaleName?: string;
	/** If false, the node has no metrics agent — show as presence-only */
	hasMetrics: boolean;
}

export interface AppConfig {
	nodes: NodeConfig[];
	services: ServiceConfig[];
}

export interface NodeMetrics {
	id: string;
	online: boolean;
	/** epoch ms — null when currently online */
	lastSeenAt: number | null;
	/** seconds since boot — requires a metrics agent on the node */
	uptime: number | null;
	cpu: number | null; // 0-100, requires agent
	memTotal: number | null; // bytes, requires agent
	memUsed: number | null; // bytes, requires agent
	diskTotal: number | null; // bytes, requires agent
	diskUsed: number | null; // bytes, requires agent
	netRx: number | null; // bytes/sec, requires agent
	netTx: number | null; // bytes/sec, requires agent
	loadAvg: [number, number, number] | null;
	tempC: number | null;
	/** session-cumulative bytes from Tailscale (real) */
	txBytesTotal: number | null;
	rxBytesTotal: number | null;
	os: string | null;
	updatedAt: number; // epoch ms
}

export type ServiceCategory =
	| 'media'
	| 'downloads'
	| 'arr'
	| 'admin'
	| 'dev'
	| 'monitoring'
	| 'other';

export interface ServiceConfig {
	id: string;
	name: string;
	url: string;
	/** URL to ping for health check; defaults to `url` */
	healthUrl?: string;
	category: ServiceCategory;
	/** lucide icon name */
	icon: string;
	/** which node hosts it — for grouping/filtering */
	nodeId: string;
	description?: string;
}

export interface ServiceHealth {
	id: string;
	online: boolean;
	latencyMs: number | null;
	statusCode: number | null;
	checkedAt: number;
}
