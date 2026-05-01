export type NodeRole = 'server' | 'desktop' | 'vps' | 'rpi' | 'mobile';

export interface NodeConfig {
	id: string;
	name: string;
	role: NodeRole;
	/** Tailscale MagicDNS hostname or IP — used by metrics adapter to reach the agent */
	host: string;
	/** Optional Tailscale IP for display */
	tailscaleIp?: string;
	/** If false, the node has no metrics agent — show as presence-only */
	hasMetrics: boolean;
}

export interface NodeMetrics {
	id: string;
	online: boolean;
	/** seconds since boot */
	uptime: number | null;
	cpu: number | null; // 0-100
	memTotal: number | null; // bytes
	memUsed: number | null; // bytes
	diskTotal: number | null; // bytes
	diskUsed: number | null; // bytes
	netRx: number | null; // bytes/sec
	netTx: number | null; // bytes/sec
	loadAvg: [number, number, number] | null;
	tempC: number | null;
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
