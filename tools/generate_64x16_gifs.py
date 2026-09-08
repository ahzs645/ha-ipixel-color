#!/usr/bin/env python3
"""Generate 64x16 animated GIFs for the iPIXEL gallery."""

import math
import os
from io import BytesIO

from PIL import Image, ImageDraw

WIDTH = 64
HEIGHT = 16
TOTAL_FRAMES = 12
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GALLERY_DIR = os.path.join(
    REPO_ROOT, "custom_components", "ipixel_color", "assets", "gallery", "64x16"
)


def save_gif(frames, path, duration=100):
    buf = BytesIO()
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
    )
    with open(path, "wb") as f:
        f.write(buf.getvalue())


def render_rainbow():
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        hue_base = i / TOTAL_FRAMES
        for y in range(HEIGHT):
            hue = (hue_base + y / max(HEIGHT - 1, 1) * 0.4) % 1.0
            r = int((math.sin(hue * math.pi * 2) + 1) * 127)
            g = int((math.sin(hue * math.pi * 2 + 2.094) + 1) * 127)
            b = int((math.sin(hue * math.pi * 2 + 4.188) + 1) * 127)
            draw.line([(0, y), (WIDTH - 1, y)], fill=(r, g, b))
        frames.append(img)
    return frames


def render_fire():
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        for y in range(HEIGHT):
            t = (y + i * 2) % HEIGHT
            intensity = int((1 - t / max(HEIGHT - 1, 1)) * 255)
            draw.line(
                [(0, y), (WIDTH - 1, y)],
                fill=(intensity, int(intensity * 0.35), 0),
            )
        frames.append(img)
    return frames


def render_plasma():
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        offset = i * 0.5
        for y in range(HEIGHT):
            for x in range(WIDTH):
                v1 = math.sin(x * 0.1 + offset)
                v2 = math.sin(y * 0.1 + offset)
                v3 = math.sin((x + y) * 0.1 + offset)
                v = (v1 + v2 + v3 + 3) / 6
                r = int(v * 255)
                g = int(((math.sin(x * 0.2 + offset) + 1) / 2) * 255)
                b = int(((math.cos(y * 0.2 + offset) + 1) / 2) * 255)
                img.putpixel((x, y), (r, g, b))
        frames.append(img)
    return frames


def render_matrix():
    rng = __import__("random").Random(123)
    particles = [
        (rng.randint(0, WIDTH - 1), rng.randint(0, HEIGHT - 1))
        for _ in range(max(8, WIDTH * HEIGHT // 8))
    ]
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        for x, y in particles:
            head = (y + i * 4) % HEIGHT
            tail = (head - 4) % HEIGHT
            intensity = int((1 - (head / max(HEIGHT - 1, 1))) * 255)
            draw.point((x, head), fill=(0, 255, 0))
            draw.point((x, tail), fill=(0, intensity // 3, 0))
        frames.append(img)
    return frames


def render_stars():
    rng = __import__("random").Random(321)
    particles = [
        (rng.randint(0, WIDTH - 1), rng.randint(0, HEIGHT - 1))
        for _ in range(max(8, WIDTH * HEIGHT // 8))
    ]
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        for x, y in particles:
            phase = (y * 0.3 + i * 0.8) % (math.pi * 2)
            bright = int((math.sin(phase) * 0.5 + 0.5) * 255)
            draw.point((x, y), fill=(bright, bright, bright))
        frames.append(img)
    return frames


def render_water():
    frames = []
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)
        for y in range(HEIGHT):
            wave = math.sin(y * 0.4 + i * 0.6) * 0.5 + 0.5
            intensity = int(40 + 215 * wave)
            draw.line(
                [(0, y), (WIDTH - 1, y)],
                fill=(0, intensity, intensity),
            )
        frames.append(img)
    return frames


def main():
    os.makedirs(GALLERY_DIR, exist_ok=True)
    effects = {
        "ipixel_anim_rainbow_64x16.gif": render_rainbow(),
        "ipixel_anim_fire_64x16.gif": render_fire(),
        "ipixel_anim_plasma_64x16.gif": render_plasma(),
        "ipixel_anim_matrix_64x16.gif": render_matrix(),
        "ipixel_anim_stars_64x16.gif": render_stars(),
        "ipixel_anim_water_64x16.gif": render_water(),
    }
    for filename, frames in effects.items():
        path = os.path.join(GALLERY_DIR, filename)
        save_gif(frames, path, duration=120)
        print(f"Generated {path} ({os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    main()
