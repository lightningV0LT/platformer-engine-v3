import http.server
from http.server import ThreadingHTTPServer
import mimetypes

# Optional: Add support for WebAssembly if your game uses it
mimetypes.add_type('application/wasm', '.wasm')


class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Only set cache headers for static resources. Do NOT set Content-Type here; the
        # parent handler already sets the correct Content-Type and adding another header
        # results in duplicate values (seen as "text/html,text/html; charset=UTF-8").
        if self.path.endswith(('.js', '.css', '.wasm', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=31536000')

        super().end_headers()


PORT = 8000

def run_server(port=PORT):
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, UTF8Handler)
    # allow quick restart during development
    httpd.allow_reuse_address = True
    try:
        print(f"Serving at http://localhost:{port}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
    finally:
        httpd.server_close()


if __name__ == '__main__':
    run_server()
