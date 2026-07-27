#!/usr/bin/env python3
"""Local dev server: serves .html files for extensionless URLs (e.g. /login → login.html)."""
import http.server, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(path) and not self.path.split('?')[0].endswith('/'):
            html_path = path + '.html'
            if os.path.exists(html_path):
                bare, _, qs = self.path.partition('?')
                self.path = bare + '.html' + ('?' + qs if qs else '')
        return super().do_GET()

    def log_message(self, *_):
        pass  # suppress noise

if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with http.server.HTTPServer(('', port), Handler) as s:
        print(f'Serving at http://localhost:{port}')
        s.serve_forever()
