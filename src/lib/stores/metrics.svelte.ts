import { browser } from '$app/environment';
import type { NodeMetrics } from '$lib/types';

/**
 * Reactive metrics store, fed by the /api/metrics SSE stream.
 *
 * Components consume `metricsStore.get(nodeId)` inside their template — Svelte 5
 * runes track the underlying `$state` map and re-render on each tick.
 */
class MetricsStore {
	private map = $state<Record<string, NodeMetrics>>({});
	connected = $state(false);
	lastError = $state<string | null>(null);

	private es: EventSource | null = null;

	connect() {
		if (!browser || this.es) return;
		const es = new EventSource('/api/metrics');
		this.es = es;

		es.addEventListener('open', () => {
			this.connected = true;
			this.lastError = null;
		});

		es.addEventListener('metrics', (e) => {
			try {
				const arr = JSON.parse((e as MessageEvent).data) as NodeMetrics[];
				const next = { ...this.map };
				for (const m of arr) next[m.id] = m;
				this.map = next;
			} catch (err) {
				this.lastError = (err as Error).message;
			}
		});

		es.addEventListener('error', () => {
			this.connected = false;
			// EventSource auto-reconnects; nothing else to do.
		});
	}

	disconnect() {
		this.es?.close();
		this.es = null;
		this.connected = false;
	}

	get(nodeId: string): NodeMetrics | undefined {
		return this.map[nodeId];
	}

	all(): NodeMetrics[] {
		return Object.values(this.map);
	}
}

export const metricsStore = new MetricsStore();
