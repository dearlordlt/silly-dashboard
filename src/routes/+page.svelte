<script lang="ts">
	import NodeCard from '$lib/components/NodeCard.svelte';
	import ServiceTile from '$lib/components/ServiceTile.svelte';
	import { metricsStore } from '$lib/stores/metrics.svelte';
	import StatusDot from '$lib/components/StatusDot.svelte';
	import { Sparkles } from 'lucide-svelte';
	import type { ServiceCategory, ServiceConfig } from '$lib/types';

	let { data } = $props();
	const nodes = $derived(data.config.nodes);
	const services = $derived(data.config.services);

	const CATEGORY_LABELS: Record<ServiceCategory, string> = {
		media: 'Media',
		downloads: 'Downloads',
		arr: '*arr stack',
		admin: 'Admin & Infra',
		dev: 'Dev',
		monitoring: 'Monitoring',
		other: 'Other'
	};

	const ORDER: ServiceCategory[] = [
		'media',
		'downloads',
		'arr',
		'admin',
		'monitoring',
		'dev',
		'other'
	];

	let grouped = $derived.by(() => {
		const map = new Map<ServiceCategory, ServiceConfig[]>();
		for (const cat of ORDER) map.set(cat, []);
		for (const s of services) {
			const list = map.get(s.category) ?? [];
			list.push(s);
			map.set(s.category, list);
		}
		return ORDER.filter((c) => (map.get(c) ?? []).length > 0).map(
			(c) => [c, map.get(c) ?? []] as const
		);
	});

	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(t);
	});

	let timeStr = $derived(
		now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	);
	let dateStr = $derived(
		now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
	);
</script>

<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
	<!-- header -->
	<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
		<div class="flex items-center gap-3">
			<div class="rounded-xl bg-orange-500/10 p-2 text-orange-400">
				<Sparkles size={22} />
			</div>
			<div>
				<h1 class="text-xl font-semibold tracking-tight">silly-dashboard</h1>
				<div class="flex items-center gap-2 text-xs text-neutral-500">
					<StatusDot
						state={metricsStore.connected ? 'online' : 'unknown'}
						pulse={metricsStore.connected}
					/>
					<span>{metricsStore.connected ? 'live' : 'connecting…'}</span>
					<span class="text-neutral-700">·</span>
					<span>{nodes.length} nodes</span>
					<span class="text-neutral-700">·</span>
					<span>{services.length} services</span>
				</div>
			</div>
		</div>
		<div class="text-right">
			<div class="tabular text-2xl font-light text-neutral-200">{timeStr}</div>
			<div class="text-xs text-neutral-500">{dateStr}</div>
		</div>
	</header>

	<!-- nodes -->
	{#if nodes.length > 0}
		<section class="mb-10">
			<h2 class="mb-3 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
				Nodes
			</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
				{#each nodes as node (node.id)}
					<NodeCard {node} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- services, grouped by category -->
	{#if services.length > 0}
		<section class="space-y-8">
			{#each grouped as [cat, list] (cat)}
				<div>
					<h2
						class="mb-3 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase"
					>
						{CATEGORY_LABELS[cat]}
					</h2>
					<div
						class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
					>
						{#each list as svc (svc.id)}
							<ServiceTile service={svc} />
						{/each}
					</div>
				</div>
			{/each}
		</section>
	{:else}
		<div
			class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center text-sm text-neutral-500"
		>
			No services configured yet — edit <code class="text-neutral-300">data/config.json</code>
			to add some.
		</div>
	{/if}

	<footer class="mt-12 border-t border-neutral-900 pt-4 text-center text-[11px] text-neutral-700">
		runs on the mac mini · accessible via tailscale ·
		<code class="text-neutral-600">data/config.json</code>
	</footer>
</main>
