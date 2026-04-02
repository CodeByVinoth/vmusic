from http.server import BaseHTTPRequestHandler
import yt_dlp
import json
from urllib import parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Get the YouTube URL from the request query
        query_components = parse.parse_qs(parse.urlparse(self.path).query)
        video_url = query_components.get("url", [""])[0]

        if not video_url:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"No URL provided")
            return

        # 2. Configure yt-dlp options
        ydl_opts = {
            'format': 'best',
            'quiet': True,
        }

        # 3. Extract video data using Python natively
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(info).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
