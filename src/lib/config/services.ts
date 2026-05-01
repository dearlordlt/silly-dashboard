import type { ServiceConfig } from '$lib/types';

/**
 * Edit this list to add/remove the services you want on the dashboard.
 *
 * `url` opens in a new tab. `healthUrl` (optional) is what gets pinged for
 * the green/red status dot — defaults to `url`. Pick something cheap like
 * `/health` or `/ping` if the service has one.
 */
export const SERVICES: ServiceConfig[] = [
	// --- Media ---
	{
		id: 'jellyfin',
		name: 'Jellyfin',
		url: 'http://macmini:8096',
		category: 'media',
		icon: 'play',
		nodeId: 'macmini',
		description: 'Media server'
	},
	{
		id: 'cinextma',
		name: 'Cinextma',
		url: 'http://macmini:3000',
		category: 'media',
		icon: 'film',
		nodeId: 'macmini',
		description: 'Streaming frontend'
	},

	// --- Downloads ---
	{
		id: 'qbittorrent',
		name: 'qBittorrent',
		url: 'http://macmini:8080',
		category: 'downloads',
		icon: 'download',
		nodeId: 'macmini',
		description: 'Torrent client'
	},

	// --- *arr stack ---
	{
		id: 'prowlarr',
		name: 'Prowlarr',
		url: 'http://macmini:9696',
		category: 'arr',
		icon: 'search',
		nodeId: 'macmini',
		description: 'Indexer manager'
	},
	{
		id: 'sonarr',
		name: 'Sonarr',
		url: 'http://macmini:8989',
		category: 'arr',
		icon: 'tv',
		nodeId: 'macmini',
		description: 'TV automation'
	},
	{
		id: 'radarr',
		name: 'Radarr',
		url: 'http://macmini:7878',
		category: 'arr',
		icon: 'clapperboard',
		nodeId: 'macmini',
		description: 'Movie automation'
	},

	// --- Admin / Infra ---
	{
		id: 'tailscale',
		name: 'Tailscale',
		url: 'https://login.tailscale.com/admin/machines',
		category: 'admin',
		icon: 'network',
		nodeId: 'macmini',
		description: 'Tailnet admin'
	},
	{
		id: 'portainer',
		name: 'Portainer',
		url: 'http://macmini:9000',
		category: 'admin',
		icon: 'container',
		nodeId: 'macmini',
		description: 'Docker UI'
	}
];
