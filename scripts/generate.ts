import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getReplicateClient, getReplicateModel } from "../tools/replicateClient.js";
import { downloadToFile, fileExists } from "../tools/io.js";

type ShotsFile = {
  style_anchor_suffix: string;
  shots: Array<{ id: string; section: string; prompt: string }>;
};

function argValue(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function fillTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function pickFirstUrl(output: unknown): string {
  if (typeof output === "string") return output;

  if (output && typeof output === "object") {
    const fileOutput = output as { url?: () => URL | string; toString?: () => string };
    if (typeof fileOutput.url === "function") {
      const url = fileOutput.url();
      return url instanceof URL ? url.href : String(url);
    }
    const asString = String(output);
    if (asString.startsWith("http")) return asString;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      try {
        return pickFirstUrl(item);
      } catch {
        // try next item
      }
    }
  }

  if (output && typeof output === "object") {
    const anyOut = output as Record<string, unknown>;
    for (const key of ["output", "video", "url", "result"]) {
      if (typeof anyOut[key] === "string") return anyOut[key] as string;
      if (Array.isArray(anyOut[key]) && typeof (anyOut[key] as unknown[])[0] === "string") {
        return (anyOut[key] as unknown[])[0] as string;
      }
    }
  }

  throw new Error(
    "Could not find an output URL from Replicate result. You may need to adjust pickFirstUrl() for your chosen model."
  );
}

async function main() {
  const shotsPath = argValue("--shots") ?? "videoai.shots.json";
  const templatePath = argValue("--template") ?? "templates/replicate-input.template.json";
  const outDir = argValue("--out") ?? "output/clips";
  const onlyShot = argValue("--only");
  const overwrite = process.argv.includes("--overwrite");

  const shots: ShotsFile = JSON.parse(await readFile(shotsPath, "utf-8"));
  const templateRaw = await readFile(templatePath, "utf-8");
  const replicate = getReplicateClient();
  const model = getReplicateModel();

  const selectedShots = onlyShot
    ? shots.shots.filter((shot) => shot.id === onlyShot)
    : shots.shots;

  if (onlyShot && selectedShots.length === 0) {
    throw new Error(`No shot found with id "${onlyShot}"`);
  }

  for (const shot of selectedShots) {
    const outFile = path.join(outDir, `${shot.id}.mp4`);
    if (!overwrite && (await fileExists(outFile))) {
      // eslint-disable-next-line no-console
      console.log(`skip ${shot.id} (exists)`);
      continue;
    }

    const promptWithStyle = `${shot.prompt}, ${shots.style_anchor_suffix}`;
    const filled = fillTemplate(templateRaw, {
      PROMPT: shot.prompt,
      PROMPT_WITH_STYLE: promptWithStyle
    });
    const input = JSON.parse(filled) as Record<string, unknown>;

    // eslint-disable-next-line no-console
    console.log(`run ${shot.id}: ${shot.section}`);
    const output = await replicate.run(model as any, { input });
    const url = pickFirstUrl(output);

    // eslint-disable-next-line no-console
    console.log(`download ${shot.id} -> ${outFile}`);
    await downloadToFile(url, outFile);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

