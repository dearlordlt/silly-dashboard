<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { metricsStore } from '$lib/stores/metrics.svelte';
	import { healthStore } from '$lib/stores/health.svelte';

	let { children, data } = $props();

	onMount(() => {
		metricsStore.connect();
		healthStore.start();
		return () => {
			metricsStore.disconnect();
			healthStore.stop();
		};
	});
</script>

<svelte:head>
	<title>silly-dashboard</title>
</svelte:head>

<div class="min-h-screen bg-neutral-950">
	{#if data.configError}
		<div
			class="border-b border-yellow-900/50 bg-yellow-950/40 px-4 py-2 text-center text-xs text-yellow-300"
		>
			config error: {data.configError} — serving last known good config
		</div>
	{/if}
	{@render children()}
</div>
