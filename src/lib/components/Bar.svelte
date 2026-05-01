<script lang="ts">
	import { cn, utilBgColor } from '$lib/utils';

	interface Props {
		value: number | null | undefined; // 0-100
		class?: string;
	}

	let { value, class: className = '' }: Props = $props();

	let safe = $derived(value == null ? 0 : Math.max(0, Math.min(100, value)));
	let bg = $derived(utilBgColor(value));
</script>

<div class={cn('h-1.5 w-full overflow-hidden rounded-full bg-neutral-800', className)}>
	<div
		class={cn('h-full rounded-full transition-[width,background-color] duration-500', bg)}
		style="width: {safe}%"
	></div>
</div>
