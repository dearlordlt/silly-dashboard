<script lang="ts">
	import type { NodeConfig } from '$lib/types';
	import { metricsStore } from '$lib/stores/metrics.svelte';
	import {
		formatBytes,
		formatPercent,
		formatRate,
		formatUptime,
		utilColor,
		cn
	} from '$lib/utils';
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

	const Icon = $derived(
		{ server: Server, desktop: Monitor, vps: Cloud, rpi: Cpu, mobile: Smartphone }[node.role]
	);
</script>

<div
	class={cn(
		'group relative flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-colors',
		'hover:border-neutral-700'
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
				<div class="font-mono text-xs text-neutral-500">{node.host}</div>
			</div>
		</div>
		<div class="flex items-center gap-2 text-xs text-neutral-500">
			<StatusDot state={online ? 'online' : 'offline'} pulse={online} />
			<span>{online ? 'online' : 'offline'}</span>
		</div>
	</div>

	{#if !node.hasMetrics}
		<div class="flex items-center justify-between text-xs text-neutral-500">
			<span>presence-only</span>
			<span>via Tailscale</span>
		</div>
	{:else if m}
		<!-- CPU -->
		<div class="space-y-1.5">
			<div class="flex items-baseline justify-between text-xs">
				<span class="text-neutral-400">CPU</span>
				<span class={cn('tabular font-medium', utilColor(m.cpu))}>
					{formatPercent(m.cpu, 1)}
				</span>
			</div>
			<Bar value={m.cpu} />
		</div>

		<!-- Memory -->
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

		<!-- Disk -->
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

		<!-- Net + uptime row -->
		<div class="flex items-center justify-between border-t border-neutral-800 pt-2 text-xs">
			<div class="flex items-center gap-3 text-neutral-400">
				<span class="tabular flex items-center gap-1">
					<ArrowDown size={12} class="text-emerald-400" />
					{formatRate(m.netRx)}
				</span>
				<span class="tabular flex items-center gap-1">
					<ArrowUp size={12} class="text-sky-400" />
					{formatRate(m.netTx)}
				</span>
				{#if m.tempC != null}
					<span class="tabular flex items-center gap-1 text-neutral-500">
						<Thermometer size={12} />
						{m.tempC.toFixed(0)}°C
					</span>
				{/if}
			</div>
			<span class="tabular text-neutral-500">up {formatUptime(m.uptime)}</span>
		</div>
	{:else}
		<div class="grid place-items-center py-6 text-xs text-neutral-600">connecting…</div>
	{/if}
</div>
