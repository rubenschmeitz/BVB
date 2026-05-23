#!/usr/bin/env python3
"""Generate the club gallery manifest from images/club_diverse."""

from __future__ import annotations

import json
import re
import struct
from argparse import ArgumentParser
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "images" / "club_diverse"
OUTPUT_FILE = ROOT / "js" / "club-gallery-data.js"
IMAGE_EXTENSIONS = {".avif", ".gif", ".jpg", ".jpeg", ".png", ".webp"}
JPEG_EXTENSIONS = {".jpg", ".jpeg"}
ALT_TEXT = "Clubavond impressie"
WEBP_QUALITY = 82
MAX_WEBP_EDGE = 2048

# Keep the current curated opening sequence, then append any other images
# discovered in the folder using natural filename order.
FEATURED_FIRST = [
    "club_feb_2024_1.webp",
    "club_wa_01.webp",
    "club_wa_02.webp",
    "club_juni_2024_1.webp",
    "club_cursus_2023_1.webp",
    "club_nov_2022_1.webp",
    "club_juni_2022_1.webp",
    "club_cursus_2023_2.webp",
    "club_wa_03.webp",
    "club_wa_04.webp",
    "club_wa_05.webp",
    "club_wa_06.webp",
]


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.casefold() for part in re.split(r"(\d+)", value)]


def sort_key(path: Path) -> tuple[int, list[object]]:
    try:
        return (FEATURED_FIRST.index(path.name), [])
    except ValueError:
        return (len(FEATURED_FIRST), natural_key(path.name))


def web_path(path: Path) -> str:
    parts = path.relative_to(ROOT).as_posix().split("/")
    return "/".join(quote(part) for part in parts)


def convert_jpegs_to_webp(delete_sources: bool) -> None:
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise SystemExit(
            "Pillow is nodig om JPG's naar WebP om te zetten. "
            "Installeer dit met: python -m pip install Pillow"
        ) from exc

    for source in sorted(IMAGE_DIR.iterdir(), key=lambda path: natural_key(path.name)):
        if not source.is_file() or source.suffix.casefold() not in JPEG_EXTENSIONS:
            continue

        target = source.with_suffix(".webp")
        if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
            if delete_sources:
                source.unlink()
            continue

        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGB")
            image.thumbnail((MAX_WEBP_EDGE, MAX_WEBP_EDGE), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)

        if delete_sources:
            source.unlink()
        print(f"Omgezet: {source.relative_to(ROOT)} -> {target.relative_to(ROOT)}")


def read_jpeg_size(data: bytes) -> tuple[int, int] | None:
    if not data.startswith(b"\xff\xd8"):
        return None

    offset = 2
    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3,
        0xC5, 0xC6, 0xC7,
        0xC9, 0xCA, 0xCB,
        0xCD, 0xCE, 0xCF,
    }

    while offset < len(data):
        while offset < len(data) and data[offset] != 0xFF:
            offset += 1
        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            return None

        marker = data[offset]
        offset += 1

        if marker in {0x01, *range(0xD0, 0xDA)}:
            continue
        if offset + 2 > len(data):
            return None

        segment_length = struct.unpack(">H", data[offset:offset + 2])[0]
        if segment_length < 2 or offset + segment_length > len(data):
            return None

        if marker in sof_markers:
            if segment_length < 7:
                return None
            height = struct.unpack(">H", data[offset + 3:offset + 5])[0]
            width = struct.unpack(">H", data[offset + 5:offset + 7])[0]
            return width, height

        offset += segment_length

    return None


def read_png_size(data: bytes) -> tuple[int, int] | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and data[12:16] == b"IHDR":
        width, height = struct.unpack(">II", data[16:24])
        return width, height
    return None


def read_gif_size(data: bytes) -> tuple[int, int] | None:
    if data[:6] in {b"GIF87a", b"GIF89a"}:
        width, height = struct.unpack("<HH", data[6:10])
        return width, height
    return None


def read_webp_size(data: bytes) -> tuple[int, int] | None:
    if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
        return None

    offset = 12
    while offset + 8 <= len(data):
        chunk_type = data[offset:offset + 4]
        chunk_size = struct.unpack("<I", data[offset + 4:offset + 8])[0]
        chunk_data = data[offset + 8:offset + 8 + chunk_size]

        if chunk_type == b"VP8X" and len(chunk_data) >= 10:
            width = 1 + int.from_bytes(chunk_data[4:7], "little")
            height = 1 + int.from_bytes(chunk_data[7:10], "little")
            return width, height

        if chunk_type == b"VP8 " and len(chunk_data) >= 10 and chunk_data[3:6] == b"\x9d\x01\x2a":
            width = struct.unpack("<H", chunk_data[6:8])[0] & 0x3FFF
            height = struct.unpack("<H", chunk_data[8:10])[0] & 0x3FFF
            return width, height

        if chunk_type == b"VP8L" and len(chunk_data) >= 5 and chunk_data[0] == 0x2F:
            bits = int.from_bytes(chunk_data[1:5], "little")
            width = 1 + (bits & 0x3FFF)
            height = 1 + ((bits >> 14) & 0x3FFF)
            return width, height

        offset += 8 + chunk_size + (chunk_size % 2)

    return None


def read_image_size(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()
    return (
        read_jpeg_size(data)
        or read_png_size(data)
        or read_gif_size(data)
        or read_webp_size(data)
    )


def build_manifest() -> list[dict[str, object]]:
    images_by_stem: dict[str, Path] = {}
    for path in sorted(IMAGE_DIR.iterdir(), key=lambda image: natural_key(image.name)):
        if not path.is_file() or path.suffix.casefold() not in IMAGE_EXTENSIONS:
            continue

        stem = path.stem.casefold()
        current = images_by_stem.get(stem)
        if not current or path.suffix.casefold() == ".webp":
            images_by_stem[stem] = path

    images = sorted(images_by_stem.values(), key=sort_key)

    manifest: list[dict[str, object]] = []
    for image in images:
        photo: dict[str, object] = {
            "src": web_path(image),
            "alt": ALT_TEXT,
        }
        size = read_image_size(image)
        if size:
            photo["width"], photo["height"] = size
        else:
            print(f"Waarschuwing: afmetingen niet gevonden voor {image.relative_to(ROOT)}")
        manifest.append(photo)
    return manifest


def parse_args() -> object:
    parser = ArgumentParser(description="Generate the club gallery manifest.")
    parser.add_argument(
        "--convert-jpegs",
        action="store_true",
        help="Convert JPG/JPEG files in images/club_diverse to WebP before generating the manifest.",
    )
    parser.add_argument(
        "--delete-source-jpegs",
        action="store_true",
        help="Delete JPG/JPEG files after successful WebP conversion.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.convert_jpegs or args.delete_source_jpegs:
        convert_jpegs_to_webp(delete_sources=args.delete_source_jpegs)

    manifest = build_manifest()
    data = json.dumps(manifest, indent=4, ensure_ascii=True)
    OUTPUT_FILE.write_text(
        "/* Generated by scripts/build_club_gallery.py. Do not edit by hand. */\n"
        "window.BVB_CLUB_GALLERY = "
        f"{data};\n",
        encoding="utf-8",
    )
    print(f"{len(manifest)} foto's geschreven naar {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
