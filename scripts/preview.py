#!/usr/bin/env python3
"""Start a portable development preview from this checkout."""
import argparse, os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '8080')))
parser.add_argument('--host', default=os.environ.get('HOST', '127.0.0.1'))
args = parser.parse_args()
public = ROOT / 'public' if (ROOT / 'server.py').exists() else ROOT
class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parts = self.path.split('?', 1)[0].split('/')
        if any(part.startswith('.') for part in parts if part):
            self.send_error(404); return
        super().do_GET()
server = ThreadingHTTPServer((args.host, args.port), partial(PreviewHandler, directory=str(public)))
print(f'Preview ready on http://{args.host}:{server.server_port}/', flush=True)
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
