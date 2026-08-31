import subprocess
import time
import json
import urllib.request
import base64
import os
import struct

FRAMES_DIR = "/tmp/living_web_frames"
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs("docs", exist_ok=True)

# Clean previous frames
for f in os.listdir(FRAMES_DIR):
    if f.endswith(".png"):
        os.remove(os.path.join(FRAMES_DIR, f))

# Launch headless chromium
print("Launching Chromium...")
chrome_proc = subprocess.Popen([
    "chromium",
    "--headless",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--window-size=1080,680",
    "http://localhost:3000/"
])

time.sleep(2.0)

try:
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode())
    target_tab = None
    for tab in tabs:
        if "webSocketDebuggerUrl" in tab:
            target_tab = tab
            break

    if not target_tab:
        raise Exception("No active CDP tab found")

    ws_url = target_tab["webSocketDebuggerUrl"]
    print("Connecting to CDP tab:", ws_url)

    # Use basic websocket client via socket
    import socket
    import urllib.parse

    parsed = urllib.parse.urlparse(ws_url)
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((parsed.hostname, parsed.port))

    # Send WebSocket handshake
    sec_key = base64.b64encode(os.urandom(16)).decode()
    handshake = (
        f"GET {parsed.path} HTTP/1.1\r\n"
        f"Host: {parsed.hostname}:{parsed.port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {sec_key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(handshake.encode())

    # Read handshake response
    resp = s.recv(4096)
    if b"101 Switching Protocols" not in resp:
        raise Exception("WebSocket handshake failed")

    def send_cdp(msg_id, method, params=None):
        payload = json.dumps({"id": msg_id, "method": method, "params": params or {}}).encode()
        frame = bytearray([0x81]) # FIN + text
        length = len(payload)
        mask_key = os.urandom(4)
        if length <= 125:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))
        frame.extend(mask_key)
        masked_payload = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(payload))
        frame.extend(masked_payload)
        s.sendall(frame)

    def recv_cdp():
        # Simple frame parser
        raw_header = s.recv(2)
        if len(raw_header) < 2:
            return None
        b1, b2 = raw_header[0], raw_header[1]
        length = b2 & 0x7f
        if length == 126:
            length = struct.unpack("!H", s.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", s.recv(8))[0]
        
        data = bytearray()
        while len(data) < length:
            chunk = s.recv(min(4096, length - len(data)))
            if not chunk:
                break
            data.extend(chunk)
        return json.loads(data.decode(errors="ignore"))

    # Helper to evaluate JS
    def eval_js(msg_id, expression):
        send_cdp(msg_id, "Runtime.evaluate", {"expression": expression})
        time.sleep(0.02)
        # Drain responses
        s.setblocking(False)
        try:
            while True:
                s.recv(4096)
        except Exception:
            pass
        s.setblocking(True)

    # Capture 50 frames (~3.5 seconds)
    print("Capturing frames...")
    total_frames = 48

    for i in range(total_frames):
        msg_id = 100 + i
        if i == 5:
            eval_js(msg_id, "window.pet.say('Hav hav! Living Web!', 3000)")
        elif i == 18:
            eval_js(msg_id, "window.pet.jump()")
        elif i == 32:
            eval_js(msg_id, "window.pet.walk()")

        send_cdp(msg_id, "Page.captureScreenshot", {"format": "png"})
        
        # Read until we get our screenshot response
        img_b64 = None
        while True:
            msg = recv_cdp()
            if msg and msg.get("id") == msg_id and "result" in msg:
                img_b64 = msg["result"].get("data")
                break
        
        if img_b64:
            frame_path = os.path.join(FRAMES_DIR, f"frame_{i:04d}.png")
            with open(frame_path, "wb") as f:
                f.write(base64.b64decode(img_b64))
        
        time.sleep(0.08) # ~12 fps

    s.close()
    print(f"Captured {total_frames} frames.")

finally:
    chrome_proc.terminate()

# Compile frames to high quality GIF using ffmpeg
print("Encoding GIF with ffmpeg...")
gif_path = "docs/demo.gif"
cmd = [
    "ffmpeg",
    "-y",
    "-framerate", "12",
    "-i", f"{FRAMES_DIR}/frame_%04d.png",
    "-vf", "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
    gif_path
]
subprocess.run(cmd, check=True)
print(f"Successfully generated {gif_path} ({os.path.getsize(gif_path)} bytes)")
