# Servidor local para probar (npm start). Igual que `python3 -m http.server`, pero sin caché:
# así el iPhone (por Wi-Fi) siempre carga lo último que se guardó en la Mac.
import http.server, socket

class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

def ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()

PUERTO = 5173
ip = ip_local()
print(f'En esta Mac:  http://localhost:{PUERTO}', flush=True)
if ip:
    print(f'En el iPhone (mismo Wi-Fi):  http://{ip}:{PUERTO}', flush=True)
http.server.ThreadingHTTPServer(('0.0.0.0', PUERTO), SinCache).serve_forever()
