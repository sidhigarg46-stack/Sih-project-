"""
backend/utils.py
Utilities for local LAN IP resolution and QR code generation.
"""

import socket
import qrcode
import io
import base64

def get_lan_ip() -> str:
    """Finds the local LAN IP address of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just opens a socket to resolve interface
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

def generate_qr_code_base64(data_url: str) -> str:
    """Generates a Base64-encoded PNG image of a QR code pointing to data_url."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=3,
    )
    qr.add_data(data_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1E293B", back_color="#FAF7F2")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"
