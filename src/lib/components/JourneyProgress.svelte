<script lang="ts">
	let { progress = 0 }: { progress?: number } = $props();
</script>

<div
	id="progress"
	aria-hidden="true"
	class="fixed top-1/2 right-6 z-40 hidden h-[180px] w-0.5 -translate-y-1/2 rounded-sm bg-bone/20 md:block"
>
	<div class="fill w-full rounded-sm bg-lens" style="height: {progress * 100}%"></div>
</div>
