import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function argValue(flag: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  const clipsDir = argValue("--clips") ?? "output/clips";
  const outFile = argValue("--out") ?? "output/master.mp4";

  const files = (await readdir(clipsDir))
    .filter((f) => f.endsWith(".mp4"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) throw new Error(`No .mp4 clips found in ${clipsDir}`);

  const listFile = path.join(clipsDir, "_concat.txt");
  const list = files.map((f) => `file '${path.join(clipsDir, f).replace(/'/g, "'\\''")}'`).join("\n") + "\n";
  await writeFile(listFile, list, "utf-8");

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-c",
    "copy",
    outFile
  ]);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

