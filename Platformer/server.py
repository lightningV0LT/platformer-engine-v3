import http.server
import socketserver
import mimetypes

# Optional: Add support for WebAssembly if your game uses it
mimetypes.add_type('application/wasm', '.wasm')

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Set UTF-8 charset for HTML files
        if self.path.endswith('.html'):
            self.send_header('Content-Type', 'text/html; charset=UTF-8')

        # Set Cache-Control for static resources
        if self.path.endswith(('.js', '.css', '.wasm', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=31536000')

        super().end_headers()

PORT = 8000

with socketserver.TCPServer(("", PORT), UTF8Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
