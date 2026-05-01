import { getConfig } from '$lib/server/config';
import type { ServiceHealth } from '$lib/types';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { Agent, fetch as undiciFetch } from 'undici';

const TIMEOUT_MS = 3000;

// Internal HTTP client that tolerates self-signed / missing TLS certs.
// Self-hosted services on Tailscale IPs almost never have a CA-signed cert,
// so without this every HTTPS service tile shows red regardless of state.
const insecureDispatcher = new Agent({
	connect: { rejectUnauthorized: false, timeout: TIMEOUT_MS },
	bodyTimeout: TIMEOUT_MS,
	headersTimeout: TIMEOUT_MS
});

async function probe(url: string): Promise<ServiceHealth> {
	const started = Date.now();
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
	try {
		const res = await undiciFetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: ctrl.signal,
			dispatcher: insecureDispatcher,
			headers: { Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' }
		});
		// 4xx from a service that's up (e.g. 401 auth-gated) still proves the
		// daemon is alive. 5xx and connection errors are real outages.
		const ok = res.status > 0 && res.status < 500;
		return {
			id: url,
			online: ok,
			latencyMs: Date.now() - started,
			statusCode: res.status,
			checkedAt: Date.now()
		};
	} catch {
		return { id: url, online: false, latencyMs: null, statusCode: null, checkedAt: Date.now() };
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
