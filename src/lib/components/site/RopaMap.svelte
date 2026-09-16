<script lang="ts">
	import UiChrome from './UiChrome.svelte';

	let { compact = false }: { compact?: boolean } = $props();
</script>

<UiChrome title="Visual ROPA View" badge="Live" pad={compact ? 'tight' : 'default'}>
	<div class={['relative', compact ? 'min-h-[180px]' : 'min-h-[280px] sm:min-h-[320px]']}>
		<svg viewBox="0 0 640 320" class="h-auto w-full" role="img" aria-label="Node map of a connected privacy estate">
			<defs>
				<linearGradient id="ropa-line" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="#d4af6a" stop-opacity="0.85" />
					<stop offset="100%" stop-color="#009bcc" stop-opacity="0.7" />
				</linearGradient>
			</defs>
			<line x1="320" y1="160" x2="120" y2="64" stroke="url(#ropa-line)" stroke-width="1.4" />
			<line x1="320" y1="160" x2="520" y2="64" stroke="url(#ropa-line)" stroke-width="1.4" />
			<line x1="320" y1="160" x2="96" y2="230" stroke="url(#ropa-line)" stroke-width="1.4" />
			<line x1="320" y1="160" x2="544" y2="230" stroke="url(#ropa-line)" stroke-width="1.4" />
			<line x1="320" y1="160" x2="320" y2="286" stroke="url(#ropa-line)" stroke-width="1.4" />

			<circle cx="320" cy="160" r="46" fill="#103389" stroke="#d4af6a" stroke-width="2" />
			<text x="320" y="156" text-anchor="middle" fill="#f7fafc" font-size="11" font-weight="700">
				Privacy
			</text>
			<text x="320" y="172" text-anchor="middle" fill="#d4af6a" font-size="10">
				oversight
			</text>

			<g>
				<rect x="48" y="36" width="144" height="56" rx="12" fill="#0b1220" stroke="#009bcc" />
				<text x="120" y="60" text-anchor="middle" fill="#f7fafc" font-size="12" font-weight="600">HR</text>
				<text x="120" y="76" text-anchor="middle" fill="#f7fafc" font-size="10" opacity="0.65">12 activities</text>
			</g>
			<g>
				<rect x="448" y="36" width="144" height="56" rx="12" fill="#0b1220" stroke="#d4af6a" />
				<text x="520" y="60" text-anchor="middle" fill="#f7fafc" font-size="12" font-weight="600">Marketing</text>
				<text x="520" y="76" text-anchor="middle" fill="#d4af6a" font-size="10">3 stale</text>
			</g>
			<g>
				<rect x="24" y="202" width="144" height="56" rx="12" fill="#0b1220" stroke="rgba(247,250,252,0.2)" />
				<text x="96" y="226" text-anchor="middle" fill="#f7fafc" font-size="12" font-weight="600">Sales</text>
				<text x="96" y="242" text-anchor="middle" fill="#f7fafc" font-size="10" opacity="0.65">9 vendors</text>
			</g>
			<g>
				<rect x="472" y="202" width="144" height="56" rx="12" fill="#0b1220" stroke="#009bcc" />
				<text x="544" y="226" text-anchor="middle" fill="#f7fafc" font-size="12" font-weight="600">Product</text>
				<text x="544" y="242" text-anchor="middle" fill="#f7fafc" font-size="10" opacity="0.65">DPIA due</text>
			</g>
			<g>
				<rect x="248" y="268" width="144" height="40" rx="12" fill="#0b1220" stroke="rgba(212,175,106,0.45)" />
				<text x="320" y="293" text-anchor="middle" fill="#d4af6a" font-size="11" font-weight="600">
					Task badges live
				</text>
			</g>
		</svg>
	</div>
</UiChrome>
