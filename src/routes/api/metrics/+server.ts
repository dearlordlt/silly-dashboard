import { NODES } from '$lib/config/nodes';
import { getMetrics } from '$lib/server/metrics-source';
import type { RequestHandler } from './$types';

const TICK_MS = 2000;

/**
 * Server-Sent Events stream of metrics for every configured node.
 * Each tick emits a JSON array of NodeMetrics objects.
 */
export const GET: RequestHandler = () => {
	const stream = new ReadableStream({
		async start(controller) {
			const enc = new TextEncoder();
			let cancelled = false;

			const send = (event: string, data: unknown) => {
				if (cancelled) return;
				controller.enqueue(
					enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
				);
			};

			const tick = async () => {
				if (cancelled) return;
				try {
					const all = await Promise.all(NODES.map((n) => getMetrics(n)));
					send('metrics', all);
				} catch (err) {
					send('error', { message: (err as Error).message });
				}
			};

			// initial flush
			send('hello', { ts: Date.now(), nodes: NODES.map((n) => n.id) });
			await tick();

			const interval = setInterval(tick, TICK_MS);

			// keep-alive comment so proxies don't drop the connection
			const keepAlive = setInterval(() => {
				if (cancelled) return;
				controller.enqueue(enc.encode(`: keep-alive\n\n`));
			}, 25_000);

			// teardown on cancel
			(controller as unknown as { _cleanup: () => void })._cleanup = () => {
				cancelled = true;
				clearInterval(interval);
				clearInterval(keepAlive);
				try {
					controller.close();
				} catch {
					/* noop */
				}
			};
		},
		cancel() {
			// stream is being torn down — nothing else to do; the start closure
			// observes `cancelled` flips on each tick.
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
