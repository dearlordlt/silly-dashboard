import { readFileSync, watch, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import type { AppConfig, NodeConfig, ServiceConfig } from '$lib/types';

/**
 * Runtime configuration loader.
 *
 * Reads `data/config.json` (gitignored — user-local) and falls back to
 * `data/config.example.json` if the personal copy doesn't exist. The file is
 * watched for changes so edits propagate without restarting the server.
 *
 * If validation fails, we keep serving the last good config and log the error.
 */

const DATA_DIR = resolve(cwd(), 'data');
const USER_PATH = resolve(DATA_DIR, 'config.json');
const EXAMPLE_PATH = resolve(DATA_DIR, 'config.example.json');

let cached: AppConfig | null = null;
let lastError: string | null = null;
let watcherStarted = false;

function activePath(): string {
	return existsSync(USER_PATH) ? USER_PATH : EXAMPLE_PATH;
}

function validate(raw: unknown): AppConfig {
	if (!raw || typeof raw !== 'object') throw new Error('config: root must be an object');
	const obj = raw as Record<string, unknown>;
	const nodes = obj.nodes;
	const services = obj.services;
	if (!Array.isArray(nodes)) throw new Error('config.nodes must be an array');
	if (!Array.isArray(services)) throw new Error('config.services must be an array');

	const seenNodeIds = new Set<string>();
	const validNodes: NodeConfig[] = nodes.map((n, i) => {
		if (!n || typeof n !== 'object') throw new Error(`config.nodes[${i}] not an object`);
		const node = n as Record<string, unknown>;
		const id = String(node.id ?? '');
		if (!id) throw new Error(`config.nodes[${i}].id required`);
		if (seenNodeIds.has(id)) throw new Error(`duplicate node id: ${id}`);
		seenNodeIds.add(id);
		return {
			id,
			name: String(node.name ?? id),
			role: (node.role as NodeConfig['role']) ?? 'other',
			host: String(node.host ?? ''),
			tailscaleName:
				typeof node.tailscaleName === 'string' ? node.tailscaleName : undefined,
			hasMetrics: !!node.hasMetrics
		};
	});

	const seenServiceIds = new Set<string>();
	const validServices: ServiceConfig[] = services.map((s, i) => {
		if (!s || typeof s !== 'object') throw new Error(`config.services[${i}] not an object`);
		const svc = s as Record<string, unknown>;
		const id = String(svc.id ?? '');
		if (!id) throw new Error(`config.services[${i}].id required`);
		if (seenServiceIds.has(id)) throw new Error(`duplicate service id: ${id}`);
		seenServiceIds.add(id);
		return {
			id,
			name: String(svc.name ?? id),
			url: String(svc.url ?? ''),
			healthUrl: typeof svc.healthUrl === 'string' ? svc.healthUrl : undefined,
			category: (svc.category as ServiceConfig['category']) ?? 'other',
			icon: String(svc.icon ?? 'globe'),
			nodeId: String(svc.nodeId ?? ''),
			description: typeof svc.description === 'string' ? svc.description : undefined
		};
	});

	return { nodes: validNodes, services: validServices };
}

function load(): AppConfig {
	const path = activePath();
	const raw = readFileSync(path, 'utf-8');
	const parsed = JSON.parse(raw);
	return validate(parsed);
}

function ensureWatcher() {
	if (watcherStarted) return;
	watcherStarted = true;
	if (!existsSync(DATA_DIR)) return;
	try {
		watch(DATA_DIR, { persistent: false }, (_evt, filename) => {
			if (!filename) return;
			if (filename !== 'config.json' && filename !== 'config.example.json') return;
			try {
				cached = load();
				lastError = null;
				console.log(`[config] reloaded from ${filename}`);
			} catch (err) {
				lastError = (err as Error).message;
				console.error(`[config] reload failed:`, err);
				// keep serving cached
			}
		});
	} catch (err) {
		console.warn('[config] watcher unavailable:', err);
	}
}

export function getConfig(): AppConfig {
	if (cached) {
		ensureWatcher();
		return cached;
	}
	try {
		cached = load();
		lastError = null;
	} catch (err) {
		lastError = (err as Error).message;
		console.error('[config] initial load failed, using empty config:', err);
		cached = { nodes: [], services: [] };
	}
	ensureWatcher();
	return cached;
}

export function getConfigError(): string | null {
	return lastError;
}
