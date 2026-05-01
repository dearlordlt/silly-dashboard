<script lang="ts">
	import type { NodeConfig } from '$lib/types';
	import { metricsStore } from '$lib/stores/metrics.svelte';
	import { formatBytes, formatPercent, formatUptime, utilColor, cn } from '$lib/utils';
	import Bar from './Bar.svelte';
	import StatusDot from './StatusDot.svelte';
	import {
		Server,
		Monitor,
		Cloud,
		Cpu,
		Smartphone,
		ArrowDown,
		ArrowUp,
		Thermometer
	} from 'lucide-svelte';

	interface Props {
		node: NodeConfig;
	}

	let { node }: Props = $props();

	let m = $derived(metricsStore.get(node.id));
	let online = $derived(!!m?.online);
	let memPct = $derived(
		m?.memTotal && m?.memUsed != null ? (m.memUsed / m.memTotal) * 100 : null
	);
	let diskPct = $derived(
		m?.diskTotal && m?.diskUsed != null ? (m.diskUsed / m.diskTotal) * 100 : null
	);
	let hasAgent = $derived(m?.cpu != null);

	// human last-seen
	let lastSeenLabel = $derived.by(() => {
		if (!m?.lastSeenAt) return null;
		const ms = Date.now() - m.lastSeenAt;
		const sec = Math.floor(ms / 1000);
		if (sec < 60) return `${sec}s ago`;
		const min = Math.floor(sec / 60);
		if (min < 60) return `${min}m ago`;
		const hr = Math.floor(min / 60);
		if (hr < 48) return `${hr}h ago`;
		const days = Math.floor(hr / 24);
		return `${days}d ago`;
	});

	const Icon = $derived(
		{ server: Server, desktop: Monitor, vps: Cloud, rpi: Cpu, mobile: Smartphone }[node.role]
	);
</script>

<div
	class={cn(
		'group relative flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-colors',
		'hover:border-neutral-700',
		!online && 'opacity-70'
	)}
>
	<!-- header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<div class="rounded-lg bg-neutral-800 p-2 text-neutral-300">
				<Icon size={18} />
			</div>
			<div>
				<div class="text-sm font-medium">{node.name}</div>
				<div class="font-mono text-xs text-neutral-500">
					{node.tailscaleName ?? node.host}
				</div>
			</div>
		</div>
		<div class="flex items-center gap-2 text-xs text-neutral-500">
			<StatusDot state={online ? 'online' : 'offline'} pulse={online} />
			<span>{online ? 'online' : 'offline'}</span>
		</div>
	</div>

	{#if !m}
		<div class="grid place-items-center py-4 text-xs text-neutral-600">connecting…</div>
	{:else if !online}
		<div class="space-y-1 text-xs text-neutral-500">
			<div>not currently on the tailnet</div>
			{#if lastSeenLabel}
				<div class="text-neutral-600">last seen {lastSeenLabel}</div>
			{/if}
		</div>
	{:else if !hasAgent}
		<!-- Online, but no per-node metrics agent yet -->
		<div class="space-y-1.5 text-xs text-neutral-500">
			<div>online via Tailscale</div>
			<div class="text-neutral-600">
				no metrics agent — install Glances on this node for CPU/RAM/disk
			</div>
			{#if m.txBytesTotal != null || m.rxBytesTotal != null}
				<div class="tabular flex items-center gap-3 pt-1 text-neutral-600">
					<span class="flex items-center gap-1">
						<ArrowDown size={11} class="text-emerald-500" />
						{formatBytes(m.rxBytesTotal ?? 0)}
					</span>
					<span class="flex items-center gap-1">
						<ArrowUp size={11} class="text-sky-500" />
						{formatBytes(m.txBytesTotal ?? 0)}
					</span>
					<span class="text-neutral-700">tailscale total</span>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Real agent metrics -->
		<div class="space-y-1.5">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-neutral-400">CPU</span>
				<span class={cn('tabular font-medium', utilColor(m.cpu))}>
					{formatPercent(m.cpu, 1)}
				</span>
			</div>
			<Bar value={m.cpu} />
		</div>

		<div class="space-y-1.5">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-neutral-400">Memory</span>
				<span class="tabular text-neutral-500">
					<span class={utilColor(memPct)}>{formatBytes(m.memUsed ?? 0)}</span>
					<span class="text-neutral-600"> / {formatBytes(m.memTotal ?? 0)}</span>
				</span>
			</div>
			<Bar value={memPct} />
		</div>

		<div class="space-y-1.5">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-neutral-400">Disk</span>
				<span class="tabular text-neutral-500">
					<span class={utilColor(diskPct)}>{formatPercent(diskPct)}</span>
					<span class="text-neutral-600">
						{' '}of {formatBytes(m.diskTotal ?? 0, 0)}
					</span>
				</span>
			</div>
			<Bar value={diskPct} />
		</div>

		<div class="flex items-center justify-between border-t border-neutral-800 pt-2 text-xs">
			<div class="flex items-center gap-3 text-neutral-400">
				{#if m.tempC != null}
					<span class="tabular flex items-center gap-1 text-neutral-500">
						<Thermometer size={12} />
						{m.tempC.toFixed(0)}°C
					</span>
				{/if}
			</div>
			<span class="tabular text-neutral-500">up {formatUptime(m.uptime)}</span>
		</div>
	{/if}
</div>
