<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { metricsStore } from '$lib/stores/metrics.svelte';
	import { healthStore } from '$lib/stores/health.svelte';

	let { children } = $props();

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
	{@render children()}
</div>
