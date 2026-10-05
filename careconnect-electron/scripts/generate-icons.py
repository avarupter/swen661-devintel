#!/usr/bin/env python3
"""Draw the CareConnect icons as PNGs using only the standard library.

    python3 scripts/generate-icons.py

Writes:
  build/icon.png        512x512 app icon (electron-builder converts it to .ico)
  resources/icon.png    256x256 window and tray icon loaded at runtime
  resources/badge.png   32x32 taskbar overlay dot for unread messages
"""
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLUE = (0x1A, 0x73, 0xE8)
WHITE = (0xFF, 0xFF, 0xFF)
BADGE_RED = (0xC6, 0x28, 0x28)


def write_png(path, size, pixels):
    """pixels: list of rows, each a list of (r, g, b, a) tuples."""
    raw = b''.join(b'\x00' + b''.join(struct.pack('BBBB', *px) for px in row) for row in pixels)

    def chunk(kind, data):
        body = kind + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xFFFFFFFF)

    header = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as fh:
        fh.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def render(size, shade, samples=4):
    """shade(x, y) -> (r, g, b, a) in unit coordinates; supersampled for anti-aliasing."""
    rows = []
    step = 1.0 / samples
    for py in range(size):
        row = []
        for px in range(size):
            acc = [0.0, 0.0, 0.0, 0.0]
            for sy in range(samples):
                for sx in range(samples):
                    r, g, b, a = shade((px + (sx + 0.5) * step) / size, (py + (sy + 0.5) * step) / size)
                    acc[0] += r * a
                    acc[1] += g * a
                    acc[2] += b * a
                    acc[3] += a
            n = samples * samples
            alpha = acc[3] / n
            if alpha == 0:
                row.append((0, 0, 0, 0))
            else:
                row.append(tuple(int(round(c / acc[3])) for c in acc[:3]) + (int(round(alpha * 255)),))
        rows.append(row)
    return rows


def in_rounded_square(x, y, radius=0.22, inset=0.02):
    lo, hi = inset, 1 - inset
    if not (lo <= x <= hi and lo <= y <= hi):
        return False
    cx = min(max(x, lo + radius), hi - radius)
    cy = min(max(y, lo + radius), hi - radius)
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2


def in_letter_c(x, y):
    """A ring with a 90-degree opening on the right and round caps."""
    dx, dy = x - 0.5, y - 0.5
    r_out, r_in = 0.30, 0.185
    dist = math.hypot(dx, dy)
    angle = math.degrees(math.atan2(dy, dx))
    if r_in <= dist <= r_out and abs(angle) >= 45:
        return True
    cap_r = (r_out - r_in) / 2
    mid = (r_out + r_in) / 2
    for a in (45, -45):
        cx = 0.5 + mid * math.cos(math.radians(a))
        cy = 0.5 + mid * math.sin(math.radians(a))
        if (x - cx) ** 2 + (y - cy) ** 2 <= cap_r ** 2:
            return True
    return False


def app_icon(x, y):
    if not in_rounded_square(x, y):
        return (0, 0, 0, 0)
    return WHITE + (1,) if in_letter_c(x, y) else BLUE + (1,)


def badge(x, y):
    d = math.hypot(x - 0.5, y - 0.5)
    if d <= 0.40:
        return BADGE_RED + (1,)
    if d <= 0.48:
        return WHITE + (1,)
    return (0, 0, 0, 0)


if __name__ == '__main__':
    write_png(os.path.join(ROOT, 'build', 'icon.png'), 512, render(512, app_icon, samples=3))
    write_png(os.path.join(ROOT, 'resources', 'icon.png'), 256, render(256, app_icon))
    write_png(os.path.join(ROOT, 'resources', 'badge.png'), 32, render(32, badge))
    print('icons written')
