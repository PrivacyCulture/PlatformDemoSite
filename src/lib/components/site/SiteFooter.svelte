<script lang="ts">
	import { site } from '$lib/site/content';

	const colA = site.footer.links.slice(0, 5);
	const colB = site.footer.links.slice(5);
</script>

<footer class="relative z-10 w-full bg-horizon pt-8 pb-5 text-white" aria-label="Site footer">
	<div class="m-auto flex w-full flex-col flex-wrap sm:flex-row md:w-2/3">
		<div class="mb-4 w-full px-8 md:w-1/3">
			<a
				href={site.footer.logo.href}
				class="block w-full no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
			>
				<img
					src={site.footer.logo.src}
					alt={site.footer.logo.alt}
					class="mx-0 block h-auto w-auto max-w-[50%] lg:max-w-[12vw]"
					width="420"
					height="72"
					decoding="async"
				/>
			</a>
		</div>

		<div class="w-full px-8 md:w-2/3 md:px-0">
			<div class="flex flex-col sm:flex-row">
				<nav class="w-full sm:w-1/2" aria-label="Footer">
					<div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
						<ul>
							{#each colA as link (link.href)}
								<li class="pb-2 text-xs">
									<a
										href={link.href}
										class="text-white no-underline hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
									>
										{link.label}
									</a>
								</li>
							{/each}
						</ul>
						<ul>
							{#each colB as link (link.href)}
								<li class="pb-2 text-xs">
									<a
										href={link.href}
										class="text-white no-underline hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
									>
										{link.label}
									</a>
								</li>
							{/each}
						</ul>
					</div>
				</nav>

				<div class="w-full text-left sm:w-1/2 lg:text-right">
					<p class="mb-2 text-xs">
						{#each site.footer.address as line, i (line)}
							{#if i > 0}<br />{/if}{line}
						{/each}
					</p>
					<p class="mb-2 text-xs">
						<a
							href={site.footer.phoneHref}
							class="text-white no-underline hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
						>
							{site.footer.phone}
						</a>
					</p>
					<p class="mb-2 text-xs">
						<a
							href="mailto:{site.footer.email}"
							class="text-white no-underline hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
						>
							{site.footer.email}
						</a>
					</p>
					<div class="pl-8">
						<a
							href={site.footer.linkedin}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
							aria-label="Privacy Culture on LinkedIn"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
								<g clip-path="url(#pc-linkedin-clip)">
									<path
										d="M10 26.438H5.625V12.313H10V26.438ZM10.437 7.813C10.4368 7.30628 10.2864 6.81101 10.0047 6.3898C9.72299 5.96859 9.32273 5.64037 8.85451 5.44664C8.38629 5.25291 7.87114 5.20237 7.3742 5.30142C6.87726 5.40047 6.42085 5.64466 6.06269 6.0031C5.70452 6.36154 5.46069 6.81814 5.36203 7.31516C5.26337 7.81218 5.31431 8.32729 5.5084 8.79536C5.7025 9.26343 6.03103 9.66343 6.45246 9.94478C6.87389 10.2261 7.36928 10.3762 7.876 10.376C8.55558 10.3755 9.20712 10.1051 9.68738 9.62425C10.1676 9.14344 10.4373 8.49158 10.437 7.812V7.813ZM26.375 18.667C26.375 14.875 25.575 12.067 21.145 12.067C20.3225 12.0181 19.5022 12.1939 18.772 12.5756C18.0418 12.9574 17.4292 13.5307 17 14.234V12.313H12.75V26.438H17V19.424C17 17.587 17.468 15.808 19.744 15.808C21.99 15.808 22.062 17.908 22.062 19.541V26.441H26.375V18.667ZM32 28.25V3.75C31.9989 2.75576 31.6035 1.80255 30.9005 1.09952C30.1974 0.396487 29.2442 0.00105883 28.25 0L3.75 0C2.75576 0.00105883 1.80255 0.396487 1.09952 1.09952C0.396487 1.80255 0.00105883 2.75576 0 3.75L0 28.25C0.00105883 29.2442 0.396487 30.1974 1.09952 30.9005C1.80255 31.6035 2.75576 31.9989 3.75 32H28.25C29.2442 31.9989 30.1974 31.6035 30.9005 30.9005C31.6035 30.1974 31.9989 29.2442 32 28.25ZM28.25 2.5C28.5814 2.50026 28.8992 2.63205 29.1336 2.86641C29.368 3.10077 29.4997 3.41856 29.5 3.75V28.25C29.4997 28.5814 29.368 28.8992 29.1336 29.1336C28.8992 29.368 28.5814 29.4997 28.25 29.5H3.75C3.41856 29.4997 3.10077 29.368 2.86641 29.1336C2.63205 28.8992 2.50026 28.5814 2.5 28.25V3.75C2.50026 3.41856 2.63205 3.10077 2.86641 2.86641C3.10077 2.63205 3.41856 2.50026 3.75 2.5H28.25Z"
										fill="white"
									/>
								</g>
								<defs>
									<clipPath id="pc-linkedin-clip">
										<rect width="32" height="32" fill="white" />
									</clipPath>
								</defs>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
