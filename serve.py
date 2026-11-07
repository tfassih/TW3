"""Optional offline local server. Python standard library only."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser

if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    address = 'http://127.0.0.1:8000/TW3.html'
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8000), partial(SimpleHTTPRequestHandler, directory=str(root)))
    except OSError as error:
        raise SystemExit(f'Could not start TW3 on port 8000: {error}. Open TW3.html directly or stop the program using that port.')
    print(f'TW3 is running offline at {address}\nPress Ctrl+C to stop.')
    threading.Timer(0.5, lambda: webbrowser.open(address)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nTW3 server stopped.')
    finally:
        server.server_close()
