#!/usr/bin/env python3
"""
Stride Mobility - Mobile Signature App Local Server
Runs a lightweight HTTP server to serve the mobile app over local Wi-Fi / hotspot,
and receives signed documents directly for local Brightree intake folder.
"""

import http.server
import socket
import socketserver
import os
import sys
import json
import base64

PORT = 8080
INCOMING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brightree_incoming")

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class StrideHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/save-pdf':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                filename = data.get('filename', 'signed_document.pdf')
                pdf_b64 = data.get('pdfBase64', '')
                
                os.makedirs(INCOMING_DIR, exist_ok=True)
                target_path = os.path.join(INCOMING_DIR, filename)
                
                pdf_bytes = base64.b64decode(pdf_b64)
                with open(target_path, 'wb') as f:
                    f.write(pdf_bytes)
                
                print(f"  [SAVED TO BRIGHTREE FOLDER] {filename} ({len(pdf_bytes)} bytes)")
                
                response_data = json.dumps({
                    'success': True,
                    'filename': filename,
                    'savedPath': target_path
                }).encode('utf-8')
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data)
            except Exception as e:
                print(f"  [ERROR SAVING PDF] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(INCOMING_DIR, exist_ok=True)
    local_ip = get_local_ip()

    try:
        with http.server.ThreadingHTTPServer(("", PORT), StrideHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("  STRIDE MOBILITY - MOBILE ATP SIGNATURE APP")
            print("=" * 60)
            print(f"  Server running locally at:")
            print(f"  --> Local:   http://localhost:{PORT}")
            print(f"  --> Network: http://{local_ip}:{PORT}  (Open this on your phone!)")
            print(f"  --> Brightree Intake Folder: {INCOMING_DIR}")
            print("=" * 60)
            print("  Press Ctrl+C to stop the server.")
            print("=" * 60)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == '__main__':
    main()
