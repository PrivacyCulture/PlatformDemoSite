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
  const inFile = argValue("--in") ?? "output/master.mp4";
  const outFile = argValue("--out") ?? "output/master.scrub.mp4";

  // All-keyframe encode for smooth seeking/scrubbing.
  // Key idea: GOP size 1, scenecut off, no B-frames.
  await run("ffmpeg", [
    "-y",
    "-i",
    inFile,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-bf",
    "0",
    "-x264-params",
    "keyint=1:min-keyint=1:scenecut=0",
    "-movflags",
    "+faststart",
    outFile
  ]);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

