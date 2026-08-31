import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

async function main() {
  const videoDir = "/tmp/living_web_video";
  if (fs.existsSync(videoDir)) {
    fs.rmSync(videoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(videoDir, { recursive: true });

  console.log("Launching Chromium with Playwright video recorder...");
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const context = await browser.newContext({
    viewport: { width: 860, height: 540 },
    recordVideo: {
      dir: videoDir,
      size: { width: 860, height: 540 }
    }
  });

  const page = await context.newPage();
  console.log("Navigating to http://localhost:3000/demo/showcase.html...");
  await page.goto("http://localhost:3000/demo/showcase.html");

  console.log("Recording 13 seconds of live autonomous pet action...");
  await page.waitForTimeout(13500);

  console.log("Closing page to finalize video...");
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(videoDir);
  const videoFile = files.find(f => f.endsWith(".webm"));
  if (!videoFile) {
    throw new Error("No video file generated");
  }

  const inputPath = path.join(videoDir, videoFile);
  const outputPath = path.resolve("docs/demo.gif");

  console.log(`Converting ${inputPath} to high quality GIF: ${outputPath}...`);
  const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf "fps=10,scale=760:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer" "${outputPath}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  console.log(`Success! ${outputPath} generated, size: ${fs.statSync(outputPath).size} bytes.`);
}

main().catch(err => {
  console.error("Error generating GIF:", err);
  process.exit(1);
});
