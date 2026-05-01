<script lang="ts">
	import type { ServiceConfig } from '$lib/types';
	import { healthStore } from '$lib/stores/health.svelte';
	import { cn } from '$lib/utils';
	import StatusDot from './StatusDot.svelte';
	import {
		Play,
		Film,
		Download,
		Search,
		Tv,
		Clapperboard,
		Network,
		Container,
		ExternalLink,
		Globe,
		type Icon as IconType
	} from 'lucide-svelte';

	interface Props {
		service: ServiceConfig;
	}

	let { service }: Props = $props();
	let h = $derived(healthStore.get(service.id));

	const ICONS: Record<string, typeof IconType> = {
		play: Play,
		film: Film,
		download: Download,
		search: Search,
		tv: Tv,
		clapperboard: Clapperboard,
		network: Network,
		container: Container,
		globe: Globe
	};
	const Icon = $derived(ICONS[service.icon] ?? Globe);

	const state = $derived.by(() => {
		if (!h) return 'unknown';
		return h.online ? 'online' : 'offline';
	});
</script>

<a
	href={service.url}
	target="_blank"
	rel="noopener noreferrer"
	class={cn(
		'group relative flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 transition-all',
		'hover:-translate-y-0.5 hover:border-neutral-700 hover:bg-neutral-900'
	)}
>
	<div class="flex items-start justify-between">
		<div
			class="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 transition-colors group-hover:text-orange-400"
		>
			<Icon size={18} />
		</div>
		<div class="flex items-center gap-1.5">
			<StatusDot {state} />
			<ExternalLink
				size={12}
				class="text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</div>
	</div>
	<div class="min-w-0">
		<div class="truncate text-sm font-medium">{service.name}</div>
		{#if service.description}
			<div class="truncate text-xs text-neutral-500">{service.description}</div>
		{/if}
	</div>
	{#if h?.latencyMs != null}
		<div class="tabular text-[10px] text-neutral-600">{h.latencyMs}ms</div>
	{:else}
		<div class="text-[10px] text-neutral-700">&nbsp;</div>
	{/if}
</a>
