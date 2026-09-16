<script lang="ts">
	let {
		label,
		href,
		open = false,
		reverse = false,
		preview = false,
		stacked = false,
		ariaLabel,
		ariaExpanded,
		ariaControls,
		onclick
	}: {
		label: string;
		href?: string;
		open?: boolean;
		/** Orb on the left, label on the right. */
		reverse?: boolean;
		preview?: boolean;
		/** Allow the label to wrap on small screens (hero). */
		stacked?: boolean;
		ariaLabel?: string;
		ariaExpanded?: boolean;
		ariaControls?: string;
		onclick?: () => void;
	} = $props();

	const className = $derived([
		'show-me group inline-flex cursor-pointer items-center border-0 bg-transparent p-0 no-underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lens',
		reverse ? 'flex-row-reverse' : 'flex-row',
		open && 'is-open',
		preview && 'is-preview',
		stacked && 'stacked'
	]);
</script>

{#snippet mark()}
	<span
		class={[
			'show-me-label overflow-hidden text-[clamp(0.95rem,2vw,1.1rem)] leading-snug font-semibold tracking-tight text-bone',
			reverse ? 'pl-3 text-left' : 'pr-3 text-right'
		]}
		aria-hidden={!open}
	>
		{label}
	</span>

	<span
		class="show-me-orb relative flex h-11 w-11 shrink-0 items-center justify-center text-bone sm:h-12 sm:w-12"
		aria-hidden="true"
	>
		<svg class="show-me-hud absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none">
			<circle
				cx="24"
				cy="24"
				r="20"
				stroke="currentColor"
				stroke-width="1.25"
				stroke-dasharray="0.55 0.1 0.25 0.1"
				pathLength="1"
			/>
			<circle cx="24" cy="24" r="13.5" stroke="currentColor" stroke-width="1.5" />
			<circle cx="24" cy="24" r="3" fill="currentColor" />
		</svg>
	</span>
{/snippet}

{#if href && !onclick}
	<a {href} class={className} aria-label={ariaLabel ?? label}>
		{@render mark()}
	</a>
{:else}
	<button
		type="button"
		{onclick}
		class={className}
		aria-label={ariaLabel ?? label}
		aria-expanded={ariaExpanded}
		aria-controls={ariaControls}
	>
		{@render mark()}
	</button>
{/if}

<style>
	.show-me-label {
		display: inline-block;
		max-width: 0;
		opacity: 0;
		white-space: nowrap;
		transform: translateX(8px);
		transform-origin: right center;
		transition:
			max-width 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.38s,
			opacity 0.3s ease 0.4s,
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.38s;
	}

	.show-me.flex-row-reverse .show-me-label {
		transform: translateX(-8px);
		transform-origin: left center;
	}

	.show-me.is-open .show-me-label {
		max-width: 15rem;
		opacity: 1;
		transform: translateX(0);
	}

	.show-me.stacked.is-open .show-me-label {
		max-width: 11rem;
		white-space: normal;
	}

	@media (min-width: 640px) {
		.show-me.stacked.is-open .show-me-label {
			max-width: 20rem;
			white-space: nowrap;
		}
	}

	.show-me-orb {
		opacity: 0;
		transform: scale(0.15) rotate(-120deg);
		filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.4));
		transform-origin: center;
	}

	.show-me.is-open .show-me-orb {
		animation: show-me-pop 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.show-me.is-preview .show-me-orb {
		color: var(--color-lens, #009bcc);
	}

	.show-me-hud {
		overflow: visible;
	}

	.show-me.is-open .show-me-hud {
		animation: show-me-spin 16s linear 0.45s infinite;
	}

	@keyframes show-me-pop {
		0% {
			opacity: 0;
			transform: scale(0.12) rotate(-140deg);
		}
		55% {
			opacity: 1;
			transform: scale(1.1) rotate(16deg);
		}
		100% {
			opacity: 1;
			transform: scale(1) rotate(0deg);
		}
	}

	@keyframes show-me-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.show-me-label {
			transition: none;
		}

		.show-me .show-me-label {
			max-width: 15rem;
			opacity: 1;
			transform: none;
		}

		.show-me.stacked .show-me-label {
			max-width: 20rem;
		}

		.show-me .show-me-orb {
			opacity: 1;
			transform: none;
			animation: none;
		}

		.show-me .show-me-hud {
			animation: none;
		}
	}
</style>
