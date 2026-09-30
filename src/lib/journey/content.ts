import { journey } from "$lib/content";
import { isArchived } from "$lib/site/archive";

import type { JourneyShowMe } from "$lib/content";

export type {
  JourneyContent,
  JourneySceneContent,
  JourneyShowMe,
} from "$lib/content";

/** All editable journey copy lives in the site content under `journey` (see `$lib/content`). */
export const content = journey;

export type PlatformSpec = {
  slug: string;
  label: string;
  pain: string;
  whatIfRest: string;
  href: string;
};

export function platformSpecs(): PlatformSpec[] {
  return content.scenes.flatMap((scene) => {
    const href = scene.showMe?.href;
    if (!href || isArchived(href)) return [];
    const slug = href.match(/^\/platform\/([^/?#]+)$/)?.[1];
    if (!slug) return [];
    return [
      {
        slug,
        label: scene.label,
        pain: scene.pain,
        whatIfRest: scene.whatIfRest,
        href,
      },
    ];
  });
}

/**
 * What a scene's "Show me" panel links to, with archived pages dropped. `exploreHref` is the
 * panel's "Explore" link: the CMS's Explore field when it is set and live, otherwise the spec page.
 * `specHref` is the /platform spec page when it is live and not already the Explore link.
 * Undefined when neither page is on the site; the scene itself stays either way.
 */
export type SceneShowMe = Omit<JourneyShowMe, "href" | "exploreHref"> & {
  exploreHref: string;
  specHref?: string;
};

export function sceneShowMe(
  showMe: JourneyShowMe | undefined,
): SceneShowMe | undefined {
  if (!showMe) return undefined;
  const { href, exploreHref: explore, ...rest } = showMe;
  const spec = href && !isArchived(href) ? href : undefined;
  const exploreHref =
    (explore && !isArchived(explore) ? explore : undefined) ?? spec;
  if (!exploreHref) return undefined;
  return {
    ...rest,
    exploreHref,
    specHref: spec && spec !== exploreHref ? spec : undefined,
  };
}

export function platformSpecBySlug(slug: string): PlatformSpec | undefined {
  return platformSpecs().find((spec) => spec.slug === slug);
}

export function sceneClassName(scene: (typeof content.scenes)[number]): string {
  return scene.align === "right" ? "scene-copy from-right" : "scene-copy";
}
