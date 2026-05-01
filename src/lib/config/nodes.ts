import type { NodeConfig } from '$lib/types';

/**
 * Edit this list to match your Tailscale tailnet.
 *
 * `host` should be the Tailscale MagicDNS name (preferred) or IP.
 * `hasMetrics: true` means a metrics agent (e.g. Glances API) is reachable
 * at that host on the configured port (see metrics adapter).
 */
export const NODES: NodeConfig[] = [
	{
		id: 'macmini',
		name: 'Mac mini',
		role: 'server',
		host: 'macmini',
		hasMetrics: true
	},
	{
		id: 'pc',
		name: 'PC',
		role: 'desktop',
		host: 'pc',
		hasMetrics: true
	},
	{
		id: 'vps',
		name: 'VPS',
		role: 'vps',
		host: 'vps',
		hasMetrics: true
	},
	{
		id: 'rpi',
		name: 'Raspberry Pi',
		role: 'rpi',
		host: 'rpi',
		hasMetrics: true
	},
	{
		id: 'mobile',
		name: 'Mobile',
		role: 'mobile',
		host: 'mobile',
		hasMetrics: false
	}
];
