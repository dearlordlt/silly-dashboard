<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		state: 'online' | 'offline' | 'unknown' | 'warning';
		pulse?: boolean;
		class?: string;
	}

	let { state, pulse = false, class: className = '' }: Props = $props();

	const colors = {
		online: 'bg-emerald-500',
		offline: 'bg-red-500',
		unknown: 'bg-neutral-500',
		warning: 'bg-yellow-500'
	} as const;
</script>

<span class={cn('relative inline-flex h-2.5 w-2.5', className)}>
	{#if pulse && state === 'online'}
		<span
			class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50"
		></span>
	{/if}
	<span class={cn('relative inline-flex h-2.5 w-2.5 rounded-full', colors[state])}></span>
</span>
