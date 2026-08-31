import http.server
import socketserver
import os
import json
import base64
import subprocess
import time
import urllib.request

PORT = 3005
FRAMES_DIR = "/tmp/living_web_frames"
os.makedirs(FRAMES_DIR, exist_ok=True)

class FrameHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/save_frame":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            frame_idx = data.get("index", 0)
            img_data = data.get("image", "").split(",")[-1]
            if img_data:
                file_path = os.path.join(FRAMES_DIR, f"frame_{frame_idx:04d}.png")
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(img_data))
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            super().do_POST()

def run_server():
    server = socketserver.TCPServer(("", PORT), FrameHandler)
    server.serve_forever()

if __name__ == "__main__":
    run_server()
