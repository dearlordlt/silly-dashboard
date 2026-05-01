import { getConfig } from '$lib/server/config';
import type { ServiceHealth } from '$lib/types';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

const TIMEOUT_MS = 3000;

async function probe(url: string): Promise<ServiceHealth> {
	const id = url; // overwritten by caller
	const started = Date.now();
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: ctrl.signal,
			// some self-hosted services 401 without auth — that still proves they're up
			headers: { Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' }
		});
		const ok = res.status > 0 && res.status < 500;
		return {
			id,
			online: ok,
			latencyMs: Date.now() - started,
			statusCode: res.status,
			checkedAt: Date.now()
		};
	} catch {
		return { id, online: false, latencyMs: null, statusCode: null, checkedAt: Date.now() };
	} finally {
		clearTimeout(timer);
	}
}

export const GET: RequestHandler = async () => {
	const { services } = getConfig();
	const results = await Promise.all(
		services.map(async (s) => {
			const probed = await probe(s.healthUrl ?? s.url);
			return { ...probed, id: s.id };
		})
	);
	return json(results, {
		headers: { 'Cache-Control': 'no-store' }
	});
};
