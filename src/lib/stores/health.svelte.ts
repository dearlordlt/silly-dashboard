import { browser } from '$app/environment';
import type { ServiceHealth } from '$lib/types';

const POLL_MS = 30_000;

class HealthStore {
	private map = $state<Record<string, ServiceHealth>>({});
	loading = $state(false);
	private timer: ReturnType<typeof setInterval> | null = null;

	async refresh() {
		if (!browser) return;
		this.loading = true;
		try {
			const res = await fetch('/api/health', { cache: 'no-store' });
			if (!res.ok) return;
			const data = (await res.json()) as ServiceHealth[];
			const next = { ...this.map };
			for (const h of data) next[h.id] = h;
			this.map = next;
		} finally {
			this.loading = false;
		}
	}

	start() {
		if (!browser || this.timer) return;
		void this.refresh();
		this.timer = setInterval(() => void this.refresh(), POLL_MS);
	}

	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}

	get(id: string): ServiceHealth | undefined {
		return this.map[id];
	}
}

export const healthStore = new HealthStore();
