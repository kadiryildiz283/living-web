import subprocess
import time
import os
import shutil

FRAMES_DIR = "/tmp/living_web_showcase_frames"
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs("docs", exist_ok=True)

# Clean previous frames
for f in os.listdir(FRAMES_DIR):
    if f.endswith(".png"):
        os.remove(os.path.join(FRAMES_DIR, f))

print("Starting showcase frame capture...")

# We will run playwright or headless chromium with injected step timestamps
# Or create a showcase page that executes the choreographed sequence
showcase_html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/index.html">
  <script src="/dist/living-web.global.js"></script>
  <style>
    /* Same styles as index */
  </style>
</head>
<body>
  <!-- Embedded in index.html -->
</body>
</html>
"""

# We can capture screenshots of localhost:3000 by executing JS actions
script = """
async function runShowcase() {
  const SDK = window.LivingWeb;
  const pet = window.pet;
  
  // Sequence 1: Hero Banner Walk & Bark
  pet.teleport(350, 140);
  pet.walk();
  pet.say('Hav hav! DOM üzerinde geziyorum! 🐾', 3000);
}
"""

print("Capturing 60 high-action frames...")

# We use playwright or headless screenshot in a loop with small delay
for i in range(1, 61):
    frame_path = f"{FRAMES_DIR}/frame_{i:03d}.png"
    # Take screenshot
    cmd = [
        "chromium",
        "--headless",
        "--disable-gpu",
        "--window-size=1080,680",
        f"--screenshot={frame_path}",
        "http://localhost:3000/"
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.04)

print(f"Captured {len(os.listdir(FRAMES_DIR))} frames.")

# Generate smooth animated GIF
gif_path = "docs/demo.gif"
print("Encoding GIF with ffmpeg...")
ffmpeg_cmd = [
    "ffmpeg",
    "-y",
    "-framerate", "12",
    "-i", f"{FRAMES_DIR}/frame_%03d.png",
    "-vf", "scale=820:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer",
    gif_path
]
subprocess.run(ffmpeg_cmd, check=True)
print(f"Generated {gif_path}, size: {os.path.getsize(gif_path)} bytes.")
