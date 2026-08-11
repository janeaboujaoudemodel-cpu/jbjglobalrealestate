import sys,os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT=os.path.abspath(sys.argv[1]); PORT=int(sys.argv[2])
class H(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        p=super().translate_path(path.split('?')[0])
        if not os.path.exists(p) or os.path.isdir(p):
            if '.' not in os.path.basename(p): return os.path.join(ROOT,'index.html')
        return p
    def log_message(self,*a): pass
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
os.chdir(ROOT)
ThreadingHTTPServer(('127.0.0.1',PORT),H).serve_forever()
